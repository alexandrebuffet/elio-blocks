<?php

namespace ElioBlocks\Tests\Unit\WeatherForecast;

use Brain\Monkey;
use Brain\Monkey\Functions;
use ElioBlocks\Tests\Stub\FakeHttpClient;
use ElioBlocks\WeatherForecast\Exception\WeatherForecastException;
use ElioBlocks\WeatherForecast\Exception\InvalidProviderResponse;
use ElioBlocks\WeatherForecast\Exception\ProviderUnavailable;
use ElioBlocks\WeatherForecast\OpenMeteoWeatherForecastProvider;
use ElioBlocks\WeatherForecast\OpenMeteoWeatherForecastResponseNormalizer;
use PHPUnit\Framework\TestCase;

class OpenMeteoWeatherForecastProviderTest extends TestCase
{
    private const BODY = '{"timezone":"Europe/Paris","current":{"time":"2026-07-01T14:15","temperature_2m":21.4,"weather_code":2}}';

    protected function setUp(): void
    {
        parent::setUp();
        Monkey\setUp();
        Functions\stubTranslationFunctions();
        Functions\stubEscapeFunctions();
    }

    protected function tearDown(): void
    {
        Monkey\tearDown();
        parent::tearDown();
    }

    private function makeProvider(FakeHttpClient $http): OpenMeteoWeatherForecastProvider
    {
        return new OpenMeteoWeatherForecastProvider($http, new OpenMeteoWeatherForecastResponseNormalizer());
    }

    public function test_asks_for_a_week_in_the_timezone_of_the_location(): void
    {
        $http = FakeHttpClient::respondingWith(200, self::BODY);

        $this->makeProvider($http)->fetch(48.86, 2.35, 'metric');

        $query = $http->lastQuery();
        $this->assertStringStartsWith('https://api.open-meteo.com/v1/forecast?', $http->requestedUrls[0]);
        $this->assertSame(['48.86', '2.35'], [$query['latitude'], $query['longitude']]);
        $this->assertSame('auto', $query['timezone']);
        $this->assertSame('7', $query['forecast_days']);
        $this->assertArrayNotHasKey('temperature_unit', $query, 'Open-Meteo is metric by default.');
        $this->assertArrayNotHasKey('apikey', $query, 'The free access needs no key.');
    }

    public function test_asks_the_customer_api_with_the_key_of_a_subscription(): void
    {
        $http = FakeHttpClient::respondingWith(200, self::BODY);

        $this->makeProvider($http)->fetch(48.86, 2.35, 'metric', ['credentials' => ['api_key' => 'k3y']]);

        $this->assertStringStartsWith('https://customer-api.open-meteo.com/v1/forecast?', $http->requestedUrls[0]);
        $this->assertSame('k3y', $http->lastQuery()['apikey']);
        $this->assertSame('7', $http->lastQuery()['forecast_days'], 'Same parameters as the free access.');
    }

    public function test_asks_open_meteo_for_imperial_values_instead_of_converting_them(): void
    {
        $http = FakeHttpClient::respondingWith(200, self::BODY);

        $this->makeProvider($http)->fetch(40.71, -74.0, 'imperial');

        $query = $http->lastQuery();
        $this->assertSame('fahrenheit', $query['temperature_unit']);
        $this->assertSame('mph', $query['wind_speed_unit']);
        $this->assertSame('inch', $query['precipitation_unit']);
    }

    public function test_returns_the_normalized_weather_forecast(): void
    {
        $weatherForecast = $this->makeProvider(FakeHttpClient::respondingWith(200, self::BODY))->fetch(48.86, 2.35, 'metric');

        $this->assertSame(21.4, $weatherForecast['current']['temperature']);
        $this->assertSame('2026-07-01T14:15:00+02:00', $weatherForecast['current']['timestamp']);
        $this->assertSame('metric', $weatherForecast['meta']['units']);
    }

    public function test_an_http_error_means_the_provider_is_unavailable(): void
    {
        $provider = $this->makeProvider(FakeHttpClient::respondingWith(429, '{"error":true,"reason":"Too many requests"}'));

        $this->expectException(ProviderUnavailable::class);

        $provider->fetch(48.86, 2.35, 'metric');
    }

    public function test_a_network_failure_means_the_provider_is_unavailable(): void
    {
        $provider = $this->makeProvider(FakeHttpClient::failingWith(new \RuntimeException('cURL error 28: timed out')));

        try {
            $provider->fetch(48.86, 2.35, 'metric');
            $this->fail('Expected ProviderUnavailable.');
        } catch (ProviderUnavailable $e) {
            $this->assertSame('Open-Meteo API could not be reached: cURL error 28: timed out', $e->getMessage(), 'The cause stays available for logs.');
        }
    }

    public function test_a_body_that_is_not_a_json_object_is_an_invalid_response(): void
    {
        $provider = $this->makeProvider(FakeHttpClient::respondingWith(200, '<html>Bad gateway</html>'));

        $this->expectException(InvalidProviderResponse::class);

        $provider->fetch(48.86, 2.35, 'metric');
    }

    public function test_failures_can_be_caught_as_one_family_and_stay_runtime_exceptions_for_existing_integrations(): void
    {
        $failure = new ProviderUnavailable('Open-Meteo API returned HTTP 500.');

        $this->assertInstanceOf(WeatherForecastException::class, $failure);
        $this->assertInstanceOf(\RuntimeException::class, $failure);
    }
}
