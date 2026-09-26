<?php

namespace ElioBlocks\Tests\Unit\WeatherForecast;

use Brain\Monkey;
use Brain\Monkey\Functions;
use ElioBlocks\Contracts\Cache\CacheInterface;
use ElioBlocks\Provider\ProviderRegistry;
use ElioBlocks\Settings\PluginSettings;
use ElioBlocks\Tests\Stub\ArrayCache;
use ElioBlocks\Tests\Stub\NullCache;
use ElioBlocks\Tests\Stub\StubWeatherForecastProvider;
use ElioBlocks\Weather\Condition\Icons\ConditionIconsRegistry;
use ElioBlocks\Weather\Coordinates;
use ElioBlocks\WeatherForecast\Exception\ProviderNotConfigured;
use ElioBlocks\WeatherForecast\Exception\InvalidProviderResponse;
use ElioBlocks\WeatherForecast\Exception\ProviderNotFound;
use ElioBlocks\WeatherForecast\WeatherForecastPresenter;
use ElioBlocks\WeatherForecast\WeatherForecastProviderRegistry;
use ElioBlocks\WeatherForecast\WeatherForecastService;
use ElioBlocks\Weather\Units\UnitsConversionService;
use ElioBlocks\Tests\Support\WordPressCore;
use PHPUnit\Framework\TestCase;

class WeatherForecastServiceTest extends TestCase
{
    private const SUN  = '<svg id="sun"></svg>';
    private const MOON = '<svg id="moon"></svg>';

    private WeatherForecastProviderRegistry $registry;
    private ArrayCache $cache;
    private ConditionIconsRegistry $iconRegistry;

    /** @var array<string, mixed> Options of the site, by name. */
    private array $options = [];

    /** Raw provider output: clear sky (WMO 0), metric units. */
    private array $rawWeatherForecast = [
        'current' => ['condition_code' => 0, 'is_day' => 1, 'temperature' => 20.0, 'wind_speed' => 36.0],
        'hourly'  => [
            ['condition_code' => 0, 'is_day' => 0, 'temperature' => 10.0, 'wind_speed' => 18.0],
        ],
        'daily'   => [
            ['condition_code' => 0, 'temperature_max' => 25.0, 'wind_speed' => 72.0],
        ],
    ];

    protected function setUp(): void
    {
        parent::setUp();
        Monkey\setUp();
        Functions\stubEscapeFunctions();
        WordPressCore::stubKses();
        Functions\when('__')->returnArg();
        Functions\when('get_option')->alias(fn(string $name, $default = false) => $this->options[$name] ?? $default);

        $providers = new ProviderRegistry();
        $providers->register('stub', ['label' => 'Stub']);
        $providers->register(
            'acme-weather',
            [
                'label'       => 'Acme Weather',
                'credentials' => [
                    'username' => ['label' => 'Username', 'required' => true],
                    'password' => ['label' => 'Password', 'required' => true, 'secret' => true],
                    'contact'  => ['label' => 'Contact'],
                ],
            ]
        );

        $this->registry     = new WeatherForecastProviderRegistry($providers);
        $this->cache        = new ArrayCache();
        $this->iconRegistry = new ConditionIconsRegistry();
    }

    protected function tearDown(): void
    {
        Monkey\tearDown();
        parent::tearDown();
    }

    /** 2026-09-21T14:13:20+00:00 */
    private const NOW = 1790000000;

    private function makeService(int $now = self::NOW): WeatherForecastService
    {
        return new WeatherForecastService($this->registry, $this->cache, $this->makePresenter(), new PluginSettings(), static fn(): int => $now);
    }

    private function makePresenter(): WeatherForecastPresenter
    {
        return new WeatherForecastPresenter($this->iconRegistry, new UnitsConversionService());
    }

    private function paris(): Coordinates
    {
        return Coordinates::fromFloats(48.8566, 2.3522);
    }

    public function test_throws_for_unknown_provider(): void
    {
        $this->expectException(ProviderNotFound::class);
        $this->expectExceptionMessageMatches('/"missing"/');

        $this->makeService()->getWeatherForecast($this->paris(), 'missing', 'metric');
    }

    public function test_caches_the_weather_forecast_of_the_provider_with_the_settings_ttl(): void
    {
        $this->registry->register('stub', new StubWeatherForecastProvider($this->rawWeatherForecast));

        $this->makeService()->getWeatherForecast($this->paris(), 'stub', 'metric', ['wind' => 'ms']);

        // Nothing that depends on the site or the visitor (icons, unit overrides, language) is cached.
        $this->assertSame(
            [['meta' => ['fetched_at' => '2026-09-21T14:13:20+00:00']] + $this->rawWeatherForecast],
            array_values($this->cache->entries)
        );
        $this->assertSame([CacheInterface::TTL_FROM_SETTINGS], array_values($this->cache->ttls));
    }

    public function test_the_weather_forecast_tells_when_the_provider_was_asked(): void
    {
        $this->registry->register('stub', new StubWeatherForecastProvider($this->rawWeatherForecast));

        $result = $this->makeService()->getWeatherForecast($this->paris(), 'stub', 'metric');

        // The browser works out from it when the server will have newer data.
        $this->assertSame('2026-09-21T14:13:20+00:00', $result['meta']['fetched_at']);
    }

    public function test_a_weather_forecast_served_from_the_cache_keeps_the_time_the_provider_was_asked(): void
    {
        $this->registry->register('stub', new StubWeatherForecastProvider($this->rawWeatherForecast));
        $this->makeService()->getWeatherForecast($this->paris(), 'stub', 'metric');

        $result = $this->makeService(self::NOW + 600)->getWeatherForecast($this->paris(), 'stub', 'metric');

        $this->assertSame('2026-09-21T14:13:20+00:00', $result['meta']['fetched_at']);
    }

    public function test_ignores_entries_cached_before_weather_forecasts_told_when_they_were_fetched(): void
    {
        $legacyKey                        = $this->cache->key('forecast_v3', 48.86, 2.35, 'stub', 'metric');
        $this->cache->entries[$legacyKey] = ['current' => ['temperature' => -99.0]];
        $this->registry->register('stub', new StubWeatherForecastProvider($this->rawWeatherForecast));

        $result = $this->makeService()->getWeatherForecast($this->paris(), 'stub', 'metric');

        $this->assertSame(20.0, $result['current']['temperature']);
    }

    public function test_a_malformed_weather_forecast_is_refused_and_never_cached(): void
    {
        $this->registry->register('stub', new StubWeatherForecastProvider(['hourly' => 'not a list']));

        try {
            $this->makeService()->getWeatherForecast($this->paris(), 'stub', 'metric');
            $this->fail('Expected InvalidProviderResponse.');
        } catch (InvalidProviderResponse $e) {
            $this->assertSame([], $this->cache->entries);
        }
    }

    public function test_a_corrupt_cache_entry_is_fetched_again(): void
    {
        $provider = new StubWeatherForecastProvider($this->rawWeatherForecast);
        $this->registry->register('stub', $provider);
        $service = $this->makeService();
        $service->getWeatherForecast($this->paris(), 'stub', 'metric');
        $key                        = array_key_first($this->cache->entries);
        $this->cache->entries[$key] = ['hourly' => 'garbage written by something else'];

        // A new request: the in-memory copy of the first one is gone.
        $result = $this->makeService()->getWeatherForecast($this->paris(), 'stub', 'metric');

        $this->assertSame(20.0, $result['current']['temperature']);
        $this->assertCount(2, $provider->calls);
    }

    public function test_second_request_is_served_from_cache(): void
    {
        $provider = new StubWeatherForecastProvider($this->rawWeatherForecast);
        $this->registry->register('stub', $provider);
        $service = $this->makeService();

        $service->getWeatherForecast($this->paris(), 'stub', 'metric');
        $service->getWeatherForecast($this->paris(), 'stub', 'metric');

        $this->assertCount(1, $provider->calls);
    }

    public function test_ignores_entries_cached_before_timestamps_carried_an_offset(): void
    {
        // Key format used up to 1.x: those entries hold local times without offset.
        $legacyKey                        = $this->cache->key('forecast', 48.86, 2.35, 'stub', 'metric');
        $this->cache->entries[$legacyKey] = ['current' => ['temperature' => -99.0]];
        $this->registry->register('stub', new StubWeatherForecastProvider($this->rawWeatherForecast));

        $result = $this->makeService()->getWeatherForecast($this->paris(), 'stub', 'metric');

        $this->assertSame(20.0, $result['current']['temperature']);
    }

    public function test_neighbouring_points_share_one_upstream_call(): void
    {
        $provider = new StubWeatherForecastProvider($this->rawWeatherForecast);
        $this->registry->register('stub', $provider);
        $service = $this->makeService();

        $service->getWeatherForecast(Coordinates::fromFloats(48.8566141, 2.3522219), 'stub', 'metric');
        $service->getWeatherForecast(Coordinates::fromFloats(48.8566142, 2.3522218), 'stub', 'metric');

        $this->assertCount(1, $provider->calls);
        $this->assertSame(
            ['latitude' => 48.86, 'longitude' => 2.35, 'units' => 'metric'],
            $provider->calls[0]
        );
    }

    public function test_one_upstream_call_per_request_even_when_the_persistent_cache_is_disabled(): void
    {
        $provider = new StubWeatherForecastProvider($this->rawWeatherForecast);
        $this->registry->register('stub', $provider);
        $service = new WeatherForecastService($this->registry, new NullCache(), $this->makePresenter(), new PluginSettings());

        // A report block asks twice per render: once to preload the icon, once for its context.
        $service->getWeatherForecast($this->paris(), 'stub', 'metric');
        $service->getWeatherForecast($this->paris(), 'stub', 'metric', ['wind' => 'ms']);

        $this->assertCount(1, $provider->calls);
    }

    public function test_a_provider_gets_its_credentials_that_are_set_and_no_other(): void
    {
        $this->options[PluginSettings::OPTION_PROVIDER_CREDENTIALS] = [
            'acme-weather' => ['username' => 'me', 'password' => 's3cret'],
            'other'        => ['api_key' => 'n0t-y0urs'],
        ];
        $provider = new StubWeatherForecastProvider($this->rawWeatherForecast);
        $this->registry->register('acme-weather', $provider);

        $this->makeService()->getWeatherForecast($this->paris(), 'acme-weather', 'metric');

        $this->assertSame([['credentials' => ['username' => 'me', 'password' => 's3cret']]], $provider->receivedArgs);
    }

    public function test_a_provider_that_declares_no_credentials_gets_none(): void
    {
        $this->options[PluginSettings::OPTION_PROVIDER_CREDENTIALS] = ['other' => ['api_key' => 'n0t-y0urs']];
        $provider = new StubWeatherForecastProvider($this->rawWeatherForecast);
        $this->registry->register('stub', $provider);

        $this->makeService()->getWeatherForecast($this->paris(), 'stub', 'metric');

        $this->assertSame([['credentials' => []]], $provider->receivedArgs);
    }

    public function test_a_provider_missing_a_required_credential_is_not_asked(): void
    {
        $this->options[PluginSettings::OPTION_PROVIDER_CREDENTIALS] = ['acme-weather' => ['username' => 'me']];
        $provider = new StubWeatherForecastProvider($this->rawWeatherForecast);
        $this->registry->register('acme-weather', $provider);

        try {
            $this->makeService()->getWeatherForecast($this->paris(), 'acme-weather', 'metric');
            $this->fail('A provider missing a required credential was asked.');
        } catch (ProviderNotConfigured $e) {
            $this->assertStringContainsString('password', $e->getMessage());
        }

        $this->assertSame([], $provider->calls);
        $this->assertSame([], $this->cache->entries);
    }

    public function test_unit_overrides_do_not_fragment_the_cache(): void
    {
        $provider = new StubWeatherForecastProvider($this->rawWeatherForecast);
        $this->registry->register('stub', $provider);
        $service = $this->makeService();

        $service->getWeatherForecast($this->paris(), 'stub', 'metric', ['wind' => 'ms']);
        $service->getWeatherForecast($this->paris(), 'stub', 'metric');

        $this->assertCount(1, $provider->calls);
        $this->assertCount(1, $this->cache->entries);
    }

    public function test_unit_overrides_are_applied_to_current_hourly_and_daily(): void
    {
        $this->registry->register('stub', new StubWeatherForecastProvider($this->rawWeatherForecast));

        $result = $this->makeService()->getWeatherForecast($this->paris(), 'stub', 'metric', ['wind' => 'ms']);

        $this->assertSame(10.0, $result['current']['wind_speed']);
        $this->assertSame(5.0, $result['hourly'][0]['wind_speed']);
        $this->assertSame(20.0, $result['daily'][0]['wind_speed']);
    }

    public function test_the_weather_forecast_is_presented_with_the_icons_of_the_site(): void
    {
        $this->registerSunAndMoon();
        $this->registry->register('stub', new StubWeatherForecastProvider($this->rawWeatherForecast));

        $result = $this->makeService()->getWeatherForecast($this->paris(), 'stub', 'metric', [], ['elio']);

        $this->assertSame('elio/sun', $result['current']['condition_icons']['elio']);
        $this->assertArrayHasKey('elio/sun', $result['icons']);
    }

    private function registerSunAndMoon(): void
    {
        $this->iconRegistry->registerCollection('elio', ['label' => 'Elio']);
        $this->iconRegistry->registerIcon('elio/sun', ['content' => self::SUN, 'conditions' => [['clear-sky', 'day']]]);
        $this->iconRegistry->registerIcon('elio/moon', ['content' => self::MOON, 'conditions' => [['clear-sky', 'night']]]);
    }
}
