<?php

namespace ElioBlocks\Tests\Unit\WeatherForecast;

use ElioBlocks\Tests\Stub\FixedSecret;
use ElioBlocks\Weather\Coordinates;
use ElioBlocks\WeatherForecast\WeatherForecastRequestSigner;
use PHPUnit\Framework\TestCase;

class WeatherForecastRequestSignerTest extends TestCase
{
    private function paris(): Coordinates
    {
        return Coordinates::fromFloats(48.8566, 2.3522);
    }

    public function test_a_signature_is_valid_for_the_request_it_was_issued_for(): void
    {
        $signer    = new WeatherForecastRequestSigner(new FixedSecret('s3cret'));
        $signature = $signer->sign($this->paris(), 'open-meteo', 'metric');

        $this->assertTrue($signer->isValid($signature, $this->paris(), 'open-meteo', 'metric'));
    }

    public function test_a_signature_does_not_unlock_another_location(): void
    {
        $signer    = new WeatherForecastRequestSigner(new FixedSecret('s3cret'));
        $signature = $signer->sign($this->paris(), 'open-meteo', 'metric');

        $this->assertFalse($signer->isValid($signature, Coordinates::fromFloats(40.71, -74.0), 'open-meteo', 'metric'));
    }

    public function test_a_signature_does_not_unlock_another_provider_or_unit_system(): void
    {
        $signer    = new WeatherForecastRequestSigner(new FixedSecret('s3cret'));
        $signature = $signer->sign($this->paris(), 'open-meteo', 'metric');

        $this->assertFalse($signer->isValid($signature, $this->paris(), 'other', 'metric'));
        $this->assertFalse($signer->isValid($signature, $this->paris(), 'open-meteo', 'imperial'));
    }

    public function test_a_signature_of_the_same_request_for_other_data_is_rejected(): void
    {
        $paris  = $this->paris();
        $signer = new WeatherForecastRequestSigner(new FixedSecret('s3cret'));
        $place  = implode('|', [$paris->latitude, $paris->longitude, 'open-meteo', 'metric']);

        // What another endpoint signing with the site secret would issue for
        // Paris: a signature of the place alone, or of the place for its data.
        foreach (['', 'marine-forecast|'] as $domain) {
            $other = hash_hmac('sha256', $domain . $place, 's3cret');

            $this->assertFalse($signer->isValid($other, $paris, 'open-meteo', 'metric'), "Signed as: {$domain}{$place}");
        }
    }

    public function test_a_signature_issued_with_another_secret_is_rejected(): void
    {
        $forged = (new WeatherForecastRequestSigner(new FixedSecret('attacker')))->sign($this->paris(), 'open-meteo', 'metric');

        $signer = new WeatherForecastRequestSigner(new FixedSecret('s3cret'));

        $this->assertFalse($signer->isValid($forged, $this->paris(), 'open-meteo', 'metric'));
    }

    public function test_an_empty_signature_is_rejected(): void
    {
        $signer = new WeatherForecastRequestSigner(new FixedSecret('s3cret'));

        $this->assertFalse($signer->isValid('', $this->paris(), 'open-meteo', 'metric'));
    }

    public function test_unrounded_coordinates_of_the_same_place_share_the_signature(): void
    {
        $signer    = new WeatherForecastRequestSigner(new FixedSecret('s3cret'));
        $signature = $signer->sign(Coordinates::fromFloats(48.8566141, 2.3522219), '', 'metric');

        $this->assertTrue($signer->isValid($signature, Coordinates::fromFloats(48.86, 2.35), '', 'metric'));
    }
}
