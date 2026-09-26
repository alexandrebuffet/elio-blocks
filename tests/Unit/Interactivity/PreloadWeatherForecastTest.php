<?php

namespace ElioBlocks\Tests\Unit\Interactivity;

use Brain\Monkey;
use Brain\Monkey\Functions;
use ElioBlocks\Interactivity\Blocks\Report\Hooks\PreloadWeatherForecast;
use ElioBlocks\Interactivity\Blocks\Report\ReportContext;
use ElioBlocks\Provider\ProviderRegistry;
use ElioBlocks\Settings\PluginSettings;
use ElioBlocks\Tests\Stub\ArrayCache;
use ElioBlocks\Tests\Stub\StubWeatherForecastProvider;
use ElioBlocks\Tests\Support\WordPressCore;
use ElioBlocks\Weather\Condition\Icons\ConditionIconCollectionResolver;
use ElioBlocks\Weather\Condition\Icons\ConditionIconsRegistry;
use ElioBlocks\WeatherForecast\WeatherForecastPresenter;
use ElioBlocks\WeatherForecast\WeatherForecastProviderRegistry;
use ElioBlocks\WeatherForecast\WeatherForecastService;
use ElioBlocks\Weather\Units\UnitsConversionService;
use PHPUnit\Framework\TestCase;

class PreloadWeatherForecastTest extends TestCase
{
    private StubWeatherForecastProvider $provider;
    private ReportContext $reportContext;
    private ConditionIconsRegistry $icons;
    private array $unitOverrides = array();

    protected function setUp(): void
    {
        parent::setUp();
        Monkey\setUp();
        Functions\when('__')->returnArg();
        Functions\stubEscapeFunctions();

        $this->provider      = new StubWeatherForecastProvider(array( 'current' => array( 'temperature' => 68.0 ) ));
        $this->reportContext = new ReportContext();
        $this->icons         = new ConditionIconsRegistry();
    }

    protected function tearDown(): void
    {
        Monkey\tearDown();
        parent::tearDown();
    }

    private function makeHook(string $siteUnitSystem): PreloadWeatherForecast
    {
        $settings = $this->createMock(PluginSettings::class);
        $settings->method('getDefaultWeatherForecastProvider')->willReturn('stub');
        $settings->method('getUnitSystem')->willReturn($siteUnitSystem);
        $settings->method('getUnitOverrides')->willReturn($this->unitOverrides);
        $settings->method('getConditionIconCollection')->willReturn('elio');

        $providers = new ProviderRegistry();
        $providers->register('stub', array( 'label' => 'Stub' ));
        $weatherForecastProviders = new WeatherForecastProviderRegistry($providers);
        $weatherForecastProviders->register('stub', $this->provider);

        $service = new WeatherForecastService(
            $weatherForecastProviders,
            new ArrayCache(),
            new WeatherForecastPresenter($this->icons, new UnitsConversionService()),
            $settings,
        );

        return new PreloadWeatherForecast($service, $settings, $this->reportContext, new ConditionIconCollectionResolver($this->icons, $settings));
    }

    private function reportBlock(array $attrs): array
    {
        return array( 'blockName' => 'elio/weather-report', 'attrs' => $attrs );
    }

    public function test_preloads_in_the_site_unit_system_so_the_block_context_reuses_the_same_fetch(): void
    {
        $block = $this->reportBlock(array( 'location' => array( 'latitude' => 40.71, 'longitude' => -74.0 ) ));

        $this->makeHook('imperial')->preloadForecast(array(), $block);

        $this->assertSame('imperial', $this->provider->calls[0]['units']);
    }

    public function test_the_block_unit_system_wins_over_the_site_setting(): void
    {
        $block = $this->reportBlock(
            array(
                'units'    => 'metric',
                'location' => array( 'latitude' => 40.71, 'longitude' => -74.0 ),
            )
        );

        $this->makeHook('imperial')->preloadForecast(array(), $block);

        $this->assertSame('metric', $this->provider->calls[0]['units']);
    }

    public function test_a_location_on_the_equator_and_prime_meridian_is_preloaded(): void
    {
        $block = $this->reportBlock(array( 'location' => array( 'latitude' => 0, 'longitude' => 0 ) ));

        $this->makeHook('metric')->preloadForecast(array(), $block);

        $this->assertSame(68.0, $this->reportContext->getCurrentItem()['temperature']);
    }

    public function test_weather_forecast_rows_get_the_unit_overrides_of_the_site(): void
    {
        $this->provider = new StubWeatherForecastProvider(
            array(
                'current' => array( 'wind_speed' => 36.0 ),
                'daily'   => array( array( 'timestamp' => '2026-07-01T00:00:00+02:00', 'wind_speed' => 72.0 ) ),
            )
        );
        $this->unitOverrides = array( 'wind' => 'ms' );
        $block               = $this->reportBlock(array( 'location' => array( 'latitude' => 48.85, 'longitude' => 2.35 ) ));

        $this->makeHook('metric')->preloadForecast(array(), $block);

        $this->assertSame(10.0, $this->reportContext->getCurrentItem()['wind_speed']);
        $this->assertSame(20.0, $this->reportContext->getForecastItems('daily', 7)[0]['wind_speed']);
    }

    public function test_a_report_without_location_clears_the_weather_forecast_of_the_previous_report(): void
    {
        $hook = $this->makeHook('metric');
        $hook->preloadForecast(array(), $this->reportBlock(array( 'location' => array( 'latitude' => 48.85, 'longitude' => 2.35 ) )));

        $hook->preloadForecast(array(), $this->reportBlock(array()));

        $this->assertNull($this->reportContext->getCurrentItem());
    }

    public function test_other_blocks_are_ignored(): void
    {
        $context = $this->makeHook('metric')->preloadForecast(array( 'a' => 1 ), array( 'blockName' => 'core/paragraph' ));

        $this->assertSame(array( 'a' => 1 ), $context);
        $this->assertCount(0, $this->provider->calls);
    }

    public function test_preloads_the_icons_of_the_collections_the_report_and_its_blocks_show(): void
    {
        WordPressCore::stubKses();
        $this->icons->registerCollection('elio', array( 'label' => 'Elio' ));
        $this->icons->registerIcon('elio/sun', array( 'content' => '<svg id="sun"></svg>', 'conditions' => array( array( 'clear-sky', 'all' ) ) ));
        $this->icons->registerCollection('theme', array( 'label' => 'Theme' ));
        $this->icons->registerIcon('theme/sunny', array( 'content' => '<svg id="sunny"></svg>', 'conditions' => array( array( 'clear-sky', 'all' ) ) ));
        $this->provider = new StubWeatherForecastProvider(array( 'current' => array( 'condition_code' => 0, 'is_day' => 1 ) ));
        $block          = $this->reportBlock(array( 'location' => array( 'latitude' => 48.85, 'longitude' => 2.35 ) ));
        $block['innerBlocks'] = array(
            array( 'blockName' => 'elio/condition-icon', 'attrs' => array( 'iconCollection' => 'theme' ), 'innerBlocks' => array() ),
        );

        $this->makeHook('metric')->preloadForecast(array(), $block);

        $this->assertSame(
            array( 'elio' => 'elio/sun', 'theme' => 'theme/sunny' ),
            $this->reportContext->getCurrentItem()['condition_icons']
        );
        $this->assertSame('<svg id="sunny"></svg>', $this->reportContext->getIcon('theme/sunny')['content']);
    }
}
