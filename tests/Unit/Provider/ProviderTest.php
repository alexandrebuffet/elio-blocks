<?php

namespace ElioBlocks\Tests\Unit\Provider;

use ElioBlocks\Provider\Provider;
use ElioBlocks\Provider\ProviderCredential;
use ElioBlocks\Tests\Stub\StubWeatherForecastAdapter;
use ElioBlocks\WeatherForecast\WeatherForecastAdapterInterface;
use PHPUnit\Framework\TestCase;

/**
 * A provider: what identifies the site to it, and what it serves.
 */
class ProviderTest extends TestCase
{
    public function test_its_credentials_are_found_by_name_in_the_order_declared(): void
    {
        $username = new ProviderCredential('username', 'Username', '', true);
        $contact  = new ProviderCredential('contact', 'Contact', 'Who they write to.');

        $provider = new Provider('acme-weather', 'Acme Weather', [$username, $contact]);

        $this->assertSame(['username' => $username, 'contact' => $contact], $provider->credentials);
        $this->assertSame([], (new Provider('open-meteo', 'Open-Meteo'))->credentials, 'None unless it says so.');
    }

    public function test_it_serves_a_domain_through_the_adapter_implementing_its_interface(): void
    {
        $first    = new StubWeatherForecastAdapter();
        $provider = new Provider('acme-weather', 'Acme Weather', [], null, [new \stdClass(), $first, new StubWeatherForecastAdapter()]);

        $this->assertSame($first, $provider->getAdapter(WeatherForecastAdapterInterface::class), 'Of two, the first.');
        $this->assertNull((new Provider('air-only', 'Air Only'))->getAdapter(WeatherForecastAdapterInterface::class));
    }
}
