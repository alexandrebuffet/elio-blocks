<?php

namespace ElioBlocks\Tests\Unit\Interactivity;

use Brain\Monkey;
use Brain\Monkey\Functions;
use ElioBlocks\Interactivity\Blocks\Report\DerivedState;
use ElioBlocks\Interactivity\Blocks\Report\DirectivesHelper;
use ElioBlocks\Provider\ProviderRegistry;
use ElioBlocks\Settings\PluginSettings;
use ElioBlocks\Tests\Stub\ArrayCache;
use ElioBlocks\Tests\Stub\FixedSecret;
use ElioBlocks\Tests\Stub\StubWeatherForecastProvider;
use ElioBlocks\Tests\Support\WordPressCore;
use ElioBlocks\Weather\Condition\Icons\ConditionIconCollectionResolver;
use ElioBlocks\Weather\Condition\Icons\ConditionIconsRegistry;
use ElioBlocks\Weather\Coordinates;
use ElioBlocks\WeatherForecast\WeatherForecastProviderInterface;
use ElioBlocks\WeatherForecast\WeatherForecastPresenter;
use ElioBlocks\WeatherForecast\WeatherForecastProviderRegistry;
use ElioBlocks\WeatherForecast\WeatherForecastRequestSigner;
use ElioBlocks\WeatherForecast\WeatherForecastService;
use ElioBlocks\Weather\Units\UnitsConversionService;
use PHPUnit\Framework\TestCase;
use WP_Block;

class DirectivesHelperTest extends TestCase
{
    private WeatherForecastProviderRegistry $providers;
    private WeatherForecastRequestSigner $signer;

    protected function setUp(): void
    {
        parent::setUp();
        Monkey\setUp();

        Functions\when('__')->returnArg();
        Functions\when('rest_url')->alias(static fn(string $path = ''): string => 'https://example.test/wp-json/' . $path);
        Functions\stubEscapeFunctions();

        $providers = new ProviderRegistry();
        $providers->register('stub', array( 'label' => 'Stub' ));

        $this->providers = new WeatherForecastProviderRegistry($providers);
        $this->signer    = new WeatherForecastRequestSigner(new FixedSecret('s3cret'));
    }

    protected function tearDown(): void
    {
        Monkey\tearDown();
        parent::tearDown();
    }

    private function makeHelper(?ConditionIconsRegistry $icons = null): DirectivesHelper
    {
        $icons ??= new ConditionIconsRegistry();

        $settings = $this->createMock(PluginSettings::class);
        $settings->method('getDefaultWeatherForecastProvider')->willReturn('stub');
        $settings->method('getUnitSystem')->willReturn('metric');
        $settings->method('getUnitOverrides')->willReturn(array( 'wind' => 'ms' ));
        $settings->method('isCacheEnabled')->willReturn(true);
        $settings->method('getCacheTime')->willReturn(1800);
        $settings->method('getEffectiveRefreshIntervalSeconds')->willReturn(900);
        $settings->method('getConditionIconCollection')->willReturn('elio');

        $service = new WeatherForecastService(
            $this->providers,
            new ArrayCache(),
            new WeatherForecastPresenter($icons, new UnitsConversionService()),
            $settings,
        );

        return new DirectivesHelper($service, $settings, $this->signer, new DerivedState(), new ConditionIconCollectionResolver($icons, $settings));
    }

    private function blockAt(mixed $latitude, mixed $longitude): WP_Block
    {
        return new WP_Block(array( 'location' => array( 'latitude' => $latitude, 'longitude' => $longitude ) ));
    }

    public function test_state_exposes_the_weather_forecast_endpoint_and_no_nonce(): void
    {
        $state = $this->makeHelper()->getState();

        $this->assertSame('https://example.test/wp-json/elio/v1/weather-forecast', $state['weatherForecastUrl']);
        $this->assertArrayNotHasKey('nonce', $state, 'A nonce goes stale in cached pages and turns public requests into 403s.');
    }

    public function test_context_carries_the_signature_of_the_request_the_client_will_send(): void
    {
        $this->providers->register('stub', new StubWeatherForecastProvider(array( 'current' => array( 'temperature' => 20.0 ) )));

        $context = $this->makeHelper()->getContext($this->blockAt(48.8566, 2.3522));

        $this->assertTrue(
            $this->signer->isValid(
                $context['signature'],
                Coordinates::fromFloats(48.8566, 2.3522),
                $context['provider'],
                $context['units']
            )
        );
    }

    public function test_context_carries_the_server_fetched_weather_forecast_with_unit_overrides_applied(): void
    {
        $this->providers->register(
            'stub',
            new StubWeatherForecastProvider(array( 'current' => array( 'temperature' => 20.0, 'wind_speed' => 36.0 ) ))
        );

        $context = $this->makeHelper()->getContext($this->blockAt(48.8566, 2.3522));

        $this->assertSame(10.0, $context['query']['data']['current']['wind_speed']);
        $this->assertSame($context['query']['data']['current'], $context['item']);
        $this->assertSame('', $context['query']['error']);
    }

    public function test_page_context_leaves_out_the_hourly_and_daily_sections_the_server_already_rendered(): void
    {
        $this->providers->register(
            'stub',
            new StubWeatherForecastProvider(
                array(
                    'meta'    => array( 'timezone' => 'Europe/Paris' ),
                    'current' => array( 'temperature' => 20.0 ),
                    'hourly'  => array_fill(0, 168, array( 'temperature' => 18.0 )),
                    'daily'   => array_fill(0, 7, array( 'temperature_max' => 25.0 )),
                )
            )
        );

        $data = $this->makeHelper()->getContext($this->blockAt(48.8566, 2.3522))['query']['data'];

        // Rows travel once, in the context of the forecast list that shows them.
        $this->assertSame(array( 'meta', 'current', 'icons' ), array_keys($data));
        $this->assertSame('Europe/Paris', $data['meta']['timezone'], 'The browser formats times in the timezone of the location.');
    }

    public function test_page_context_names_the_style_of_each_icon_but_carries_no_svg(): void
    {
        WordPressCore::stubKses();
        $icons = new ConditionIconsRegistry();
        $icons->registerCollection('elio', ['label' => 'Elio']);
        $icons->registerIcon('elio/sun', ['content' => '<svg id="sun"></svg>', 'style' => 'stroke', 'conditions' => [['clear-sky', 'day']]]);
        $this->providers->register('stub', new StubWeatherForecastProvider(['current' => ['condition_code' => 0, 'is_day' => 1]]));

        $context = $this->makeHelper($icons)->getContext($this->blockAt(48.8566, 2.3522));

        // The SVGs are symbols printed once in the page (IconSprite), not JSON in every report.
        $this->assertSame(['elio/sun' => ['style' => 'stroke']], $context['query']['data']['icons']);
        $this->assertSame(['elio'], $context['iconCollections']);
    }

    public function test_context_lists_the_collections_the_report_and_its_blocks_show_so_a_refresh_asks_for_them(): void
    {
        WordPressCore::stubKses();
        $icons = new ConditionIconsRegistry();
        $icons->registerCollection('elio', ['label' => 'Elio']);
        $icons->registerCollection('theme', ['label' => 'Theme']);
        $this->providers->register('stub', new StubWeatherForecastProvider(['current' => ['condition_code' => 0]]));
        $block = new WP_Block(
            ['location' => ['latitude' => 48.8566, 'longitude' => 2.3522]],
            [],
            [
                'blockName'   => 'elio/weather-report',
                'attrs'       => ['location' => ['latitude' => 48.8566, 'longitude' => 2.3522]],
                'innerBlocks' => [['blockName' => 'elio/condition-icon', 'attrs' => ['iconCollection' => 'theme'], 'innerBlocks' => []]],
            ]
        );

        $context = $this->makeHelper($icons)->getContext($block);

        $this->assertSame(['elio', 'theme'], $context['iconCollections']);
        $this->assertSame(['elio' => null, 'theme' => null], $context['item']['condition_icons']);
    }

    public function test_state_defines_the_derived_getters_so_values_are_in_the_server_rendered_html(): void
    {
        $state = $this->makeHelper()->getState();

        $this->assertInstanceOf(\Closure::class, $state['humidity']);
        $this->assertInstanceOf(\Closure::class, $state['formattedDateTime']);
    }

    public function test_a_location_on_the_equator_and_prime_meridian_is_fetched(): void
    {
        $provider = new StubWeatherForecastProvider(array( 'current' => array( 'temperature' => 28.0 ) ));
        $this->providers->register('stub', $provider);

        $context = $this->makeHelper()->getContext($this->blockAt(0, 0.0));

        $this->assertCount(1, $provider->calls);
        $this->assertSame(28.0, $context['item']['temperature']);
    }

    public function test_a_block_without_location_does_not_fetch_and_has_no_signature(): void
    {
        $provider = new StubWeatherForecastProvider(array());
        $this->providers->register('stub', $provider);

        $context = $this->makeHelper()->getContext(new WP_Block(array()));

        $this->assertCount(0, $provider->calls);
        $this->assertSame('', $context['signature']);
        $this->assertNull($context['query']['data']);
    }

    public function test_upstream_failure_is_reported_without_leaking_the_upstream_message(): void
    {
        $failing = $this->createMock(WeatherForecastProviderInterface::class);
        $failing->method('fetch')->willThrowException(new \RuntimeException('cURL error 28: resolving api.internal timed out'));
        $this->providers->register('stub', $failing);

        $context = $this->makeHelper()->getContext($this->blockAt(48.8566, 2.3522));

        $this->assertNotSame('', $context['query']['error']);
        $this->assertStringNotContainsString('cURL', $context['query']['error']);
        $this->assertNull($context['query']['data']);
    }

    public function test_context_tells_when_the_page_asked_for_the_weather_forecast_even_when_the_request_failed(): void
    {
        $failing = $this->createMock(WeatherForecastProviderInterface::class);
        $failing->method('fetch')->willThrowException(new \RuntimeException('timeout'));
        $this->providers->register('stub', $failing);
        $before = (int) ( microtime(true) * 1000 );

        $query = $this->makeHelper()->getContext($this->blockAt(48.8566, 2.3522))['query'];

        // The browser spaces its refreshes from the last request, successful or not.
        $this->assertGreaterThanOrEqual($before, $query['requestedAt']);
        $this->assertArrayNotHasKey('fetchedAt', $query);
    }

    public function test_a_block_without_location_has_asked_for_nothing(): void
    {
        $query = $this->makeHelper()->getContext(new WP_Block(array()))['query'];

        $this->assertNull($query['requestedAt']);
    }
}
