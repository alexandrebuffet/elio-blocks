<?php

namespace ElioBlocks\Tests\Unit\WeatherForecast;

use Brain\Monkey;
use Brain\Monkey\Functions;
use ElioBlocks\Weather\Condition\Icons\ConditionIconsRegistry;
use ElioBlocks\WeatherForecast\WeatherForecast;
use ElioBlocks\WeatherForecast\WeatherForecastPresenter;
use ElioBlocks\Weather\Units\UnitsConversionService;
use ElioBlocks\Tests\Support\WordPressCore;
use PHPUnit\Framework\TestCase;

/**
 * What the REST API and the blocks receive: the weather forecast of the
 * provider, plus everything that depends on the site or the request rather than
 * on the weather.
 */
class WeatherForecastPresenterTest extends TestCase
{
    private const SUN  = '<svg id="sun"></svg>';
    private const MOON = '<svg id="moon"></svg>';

    private ConditionIconsRegistry $icons;

    protected function setUp(): void
    {
        parent::setUp();
        Monkey\setUp();
        WordPressCore::stubKses();
        Functions\stubEscapeFunctions();
        Functions\when('__')->returnArg();

        $this->icons = new ConditionIconsRegistry();
    }

    protected function tearDown(): void
    {
        Monkey\tearDown();
        parent::tearDown();
    }

    /** Builds a weather forecast: clear sky (WMO 0), metric units. */
    private function weatherForecast(array $overrides = []): WeatherForecast
    {
        return WeatherForecast::fromArray(
            $overrides + [
                'current' => ['condition_code' => 0, 'is_day' => 1, 'temperature' => 20.0, 'wind_speed' => 36.0],
                'hourly'  => [['condition_code' => 0, 'is_day' => 0, 'temperature' => 10.0, 'wind_speed' => 18.0]],
                'daily'   => [['condition_code' => 0, 'temperature_max' => 25.0, 'wind_speed' => 72.0]],
            ]
        );
    }

    private function present(WeatherForecast $weatherForecast, array $unitSettings = [], array $iconCollections = ['elio']): array
    {
        return (new WeatherForecastPresenter($this->icons, new UnitsConversionService()))
            ->present($weatherForecast, 'metric', $unitSettings, $iconCollections);
    }

    private function registerSunAndMoon(): void
    {
        $this->icons->registerCollection('elio', ['label' => 'Elio']);
        $this->icons->registerIcon('elio/sun', ['content' => self::SUN, 'conditions' => [['clear-sky', 'day']]]);
        $this->icons->registerIcon('elio/moon', ['content' => self::MOON, 'conditions' => [['clear-sky', 'night']]]);
        $this->icons->registerCollection('theme', ['label' => 'Theme']);
        $this->icons->registerIcon('theme/sunny', ['content' => self::SUN, 'style' => 'stroke', 'conditions' => [['clear-sky', 'all']]]);
    }

    public function test_each_item_names_its_icon_in_every_requested_collection(): void
    {
        $this->registerSunAndMoon();

        $result = $this->present($this->weatherForecast(), [], ['elio', 'theme']);

        $this->assertSame(['elio' => 'elio/sun', 'theme' => 'theme/sunny'], $result['current']['condition_icons']);
        $this->assertSame(['elio' => 'elio/moon', 'theme' => 'theme/sunny'], $result['hourly'][0]['condition_icons']);
        $this->assertSame('elio/sun', $result['daily'][0]['condition_icons']['elio'], 'Daily items have no is_day: day icon expected.');
        $this->assertArrayNotHasKey('condition_icon', $result['current']);
    }

    public function test_each_svg_is_sent_once_however_many_items_use_it(): void
    {
        $this->registerSunAndMoon();
        $weatherForecast = $this->weatherForecast(['hourly' => array_fill(0, 48, ['condition_code' => 0, 'is_day' => 1])]);

        $result = $this->present($weatherForecast);

        $this->assertSame(['elio/sun' => ['content' => self::SUN, 'style' => 'fill']], $result['icons']);
        $this->assertSame(1, substr_count((string) json_encode($result), 'id=\"sun\"'));
    }

    public function test_a_collection_without_icon_for_the_condition_names_none(): void
    {
        $this->registerSunAndMoon();

        $result = $this->present($this->weatherForecast(['current' => ['condition_code' => 45]]), [], ['elio', 'theme']);

        $this->assertSame(['elio' => null, 'theme' => null], $result['current']['condition_icons']);
    }

    public function test_only_the_requested_collections_are_resolved(): void
    {
        $this->registerSunAndMoon();

        $result = $this->present($this->weatherForecast(), [], ['theme']);

        $this->assertSame(['theme' => 'theme/sunny'], $result['current']['condition_icons']);
        $this->assertSame(['theme/sunny'], array_keys($result['icons']));
        $this->assertSame('stroke', $result['icons']['theme/sunny']['style']);
    }

    public function test_without_requested_collection_items_name_no_icon(): void
    {
        $this->registerSunAndMoon();

        $result = $this->present($this->weatherForecast(), [], []);

        $this->assertSame([], $result['current']['condition_icons']);
        $this->assertSame([], $result['icons']);
    }

    public function test_unit_overrides_are_applied_to_current_hourly_and_daily(): void
    {
        $result = $this->present($this->weatherForecast(), ['wind' => 'ms']);

        $this->assertSame(10.0, $result['current']['wind_speed']);
        $this->assertSame(5.0, $result['hourly'][0]['wind_speed']);
        $this->assertSame(20.0, $result['daily'][0]['wind_speed']);
    }

    public function test_tells_which_units_the_values_are_in_so_the_editor_labels_them_right(): void
    {
        $result = $this->present($this->weatherForecast(['meta' => ['timezone' => 'Europe/Paris']]), ['wind' => 'ms', 'pressure' => '']);

        $this->assertSame('metric', $result['meta']['units']);
        $this->assertSame(['wind' => 'ms', 'pressure' => ''], $result['meta']['unit_settings']);
        $this->assertSame('Europe/Paris', $result['meta']['timezone'], 'What the provider says about the location stays.');
    }

    public function test_values_are_left_alone_without_unit_overrides(): void
    {
        $this->assertSame(36.0, $this->present($this->weatherForecast())['current']['wind_speed']);
    }

    public function test_conditions_are_described_from_their_wmo_code(): void
    {
        $result = $this->present($this->weatherForecast(['daily' => [['condition_code' => 95]]]));

        $this->assertSame('Clear sky', $result['current']['condition_description']);
        $this->assertSame('Thunderstorm', $result['daily'][0]['condition_description']);
    }

    public function test_descriptions_follow_the_language_of_the_request_not_the_one_in_force_when_the_weather_forecast_was_cached(): void
    {
        $weatherForecast = $this->weatherForecast();

        $english = $this->present($weatherForecast)['current']['condition_description'];
        Functions\when('__')->alias(static fn(string $text): string => 'Clear sky' === $text ? 'Ciel dégagé' : $text);
        $french = $this->present($weatherForecast)['current']['condition_description'];

        $this->assertSame(['Clear sky', 'Ciel dégagé'], [$english, $french]);
    }

    public function test_an_unknown_code_is_not_described_as_clear_sky(): void
    {
        $result = $this->present($this->weatherForecast(['current' => ['condition_code' => 1234]]));

        $this->assertSame('', $result['current']['condition_description']);
    }

    public function test_a_provider_without_wmo_codes_keeps_its_own_description(): void
    {
        $result = $this->present($this->weatherForecast(['current' => ['condition_description' => 'Sandstorm']]));

        $this->assertSame('Sandstorm', $result['current']['condition_description']);
    }

    public function test_names_the_timezone_of_the_location_as_php_does_over_the_weather_forecast_period(): void
    {
        // Paris leaves summer time on 25 October 2026 at 01:00 UTC, inside the
        // weather forecast.
        $result = $this->present(
            WeatherForecast::fromArray(
                [
                    'meta'    => ['timezone' => 'Europe/Paris'],
                    'current' => ['timestamp' => '2026-10-24T12:00:00+02:00', 'sunrise' => '2026-10-24T08:26:00+02:00'],
                    'hourly'  => [['timestamp' => '2026-10-24T13:00:00+02:00'], ['timestamp' => '2026-10-25T13:00:00+01:00']],
                    'daily'   => [['timestamp' => '2026-10-26T00:00:00+01:00', 'sunset' => '2026-10-26T17:52:00+01:00']],
                ]
            )
        );

        // The browser has no timezone database: it would print "GMT+2" for "CEST".
        $this->assertSame(
            [
                ['from' => strtotime('2026-10-24T06:26:00Z'), 'abbr' => 'CEST'],
                ['from' => strtotime('2026-10-25T01:00:00Z'), 'abbr' => 'CET'],
            ],
            $result['meta']['timezone_abbreviations']
        );
    }

    public function test_names_no_timezone_the_location_does_not_have(): void
    {
        foreach (['', 'Mars/Olympus_Mons'] as $timezone) {
            $result = $this->present(
                WeatherForecast::fromArray(['meta' => ['timezone' => $timezone], 'current' => ['timestamp' => '2026-10-24T12:00:00+02:00']])
            );

            $this->assertSame([], $result['meta']['timezone_abbreviations'], $timezone);
        }
    }
}
