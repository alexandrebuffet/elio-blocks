<?php

namespace ElioBlocks\Tests\Unit\WeatherForecast;

use Brain\Monkey;
use Brain\Monkey\Functions;
use ElioBlocks\Provider\Provider;
use ElioBlocks\Provider\ProviderRegistry;
use ElioBlocks\Tests\Stub\StubWeatherForecastProvider;
use ElioBlocks\WeatherForecast\WeatherForecastProviderRegistry;
use Mockery;
use PHPUnit\Framework\TestCase;

/**
 * The weather forecast providers: how the registered providers serve the
 * weather forecast, one each at most.
 */
class WeatherForecastProviderRegistryTest extends TestCase
{
	private ProviderRegistry $providers;

	private WeatherForecastProviderRegistry $registry;

	protected function setUp(): void
	{
		parent::setUp();
		Monkey\setUp();
		// The slugs in error messages are escaped.
		Functions\stubEscapeFunctions();

		$this->providers = new ProviderRegistry();
		$this->providers->register('open-meteo', ['label' => 'Open-Meteo']);
		$this->providers->register('acme-weather', ['label' => 'Acme Weather']);
		$this->providers->register('air-only', ['label' => 'Air Only']);

		$this->registry = new WeatherForecastProviderRegistry($this->providers);
	}

	protected function tearDown(): void
	{
		Monkey\tearDown();
		parent::tearDown();
	}

	public function test_the_weather_forecast_provider_of_a_provider_is_found_by_its_slug(): void
	{
		$weatherForecastProvider = new StubWeatherForecastProvider();
		$this->registry->register('open-meteo', $weatherForecastProvider);

		$this->assertSame($weatherForecastProvider, $this->registry->getBySlug('open-meteo'));
		$this->assertNull($this->registry->getBySlug('acme-weather'));
	}

	public function test_lists_the_providers_that_serve_the_weather_forecast(): void
	{
		$this->registry->register('open-meteo', new StubWeatherForecastProvider());
		$this->registry->register('acme-weather', new StubWeatherForecastProvider());

		$this->assertSame(
			['open-meteo', 'acme-weather'],
			array_map(static fn(Provider $provider): string => $provider->slug, $this->registry->getProviders())
		);
	}

	public function test_register_returns_true_for_a_registered_provider(): void
	{
		$this->assertTrue($this->registry->register('open-meteo', new StubWeatherForecastProvider()));
	}

	public function test_serves_the_weather_forecast_for_a_registered_provider_only(): void
	{
		Functions\expect('_doing_it_wrong')->once()->with(
			'ElioBlocks\WeatherForecast\WeatherForecastProviderRegistry::register',
			Mockery::pattern('/No provider registered with slug &quot;unregistered&quot;/'),
			'0.1.0'
		);

		$this->assertFalse($this->registry->register('unregistered', new StubWeatherForecastProvider()));
		$this->assertNull($this->registry->getBySlug('unregistered'));
	}

	public function test_a_provider_serves_the_weather_forecast_once_and_the_first_is_kept(): void
	{
		$first = new StubWeatherForecastProvider();
		$this->registry->register('open-meteo', $first);
		Functions\expect('_doing_it_wrong')->once()->with(
			'ElioBlocks\WeatherForecast\WeatherForecastProviderRegistry::register',
			Mockery::pattern('/&quot;open-meteo&quot; already has a weather forecast provider/'),
			'0.1.0'
		);

		$this->assertFalse($this->registry->register('open-meteo', new StubWeatherForecastProvider()));
		$this->assertSame($first, $this->registry->getBySlug('open-meteo'));
	}

	public function test_nothing_is_registered_once_the_registry_is_built(): void
	{
		$this->assertFalse($this->registry->isBuilt());
		$this->registry->build();
		$this->assertTrue($this->registry->isBuilt());
		Functions\expect('_doing_it_wrong')->once()->with(
			'ElioBlocks\WeatherForecast\WeatherForecastProviderRegistry::register',
			Mockery::pattern('/already built/'),
			'0.1.0'
		);

		$this->assertFalse($this->registry->register('acme-weather', new StubWeatherForecastProvider()));
		$this->assertNull($this->registry->getBySlug('acme-weather'));
	}
}
