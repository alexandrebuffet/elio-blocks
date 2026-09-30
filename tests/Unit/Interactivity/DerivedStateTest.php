<?php

namespace ElioBlocks\Tests\Unit\Interactivity;

use Brain\Monkey;
use Brain\Monkey\Functions;
use ElioBlocks\Interactivity\Blocks\Report\DerivedState;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

/**
 * The derived state is what lets `data-wp-text="state.xxx"` print a value in
 * the server-rendered HTML. Each getter mirrors the one of the block's view.js.
 */
class DerivedStateTest extends TestCase
{
    /** 1 July 2026, 14:20 in Tokyo (05:20 UTC). */
    private const NOW = '2026-07-01T14:20:00+09:00';

    private const CURRENT = [
        'timestamp'                 => '2026-07-01T14:15:00+09:00',
        'temperature'               => 28.1,
        'temperature_feels_like'    => 31.0,
        'humidity'                  => 64,
        'pressure'                  => 1013.2,
        'wind_speed'                => 12.0,
        'wind_gusts'                => 30.5,
        'wind_direction'            => 225,
        'cloud_cover'               => 40,
        'precipitation'             => 0.0,
        'precipitation_probability' => 15,
        'uv_index'                  => 7.5,
        'condition_description'     => 'Partly cloudy',
        'sunrise'                   => '2026-07-01T04:29:00+09:00',
        'sunset'                    => '2026-07-01T19:01:00+09:00',
    ];

    protected function setUp(): void
    {
        parent::setUp();
        Monkey\setUp();

        Functions\when('get_option')->alias(
            static fn(string $name) => ['date_format' => 'Y-m-d', 'time_format' => 'H:i'][$name] ?? false
        );
        Functions\when('wp_timezone')->justReturn(new \DateTimeZone('Europe/Paris'));
        Functions\when('wp_date')->alias(
            static fn(string $format, int $timestamp, \DateTimeZone $timezone): string =>
                (new \DateTimeImmutable('@' . $timestamp))->setTimezone($timezone)->format($format)
        );
    }

    protected function tearDown(): void
    {
        Monkey\tearDown();
        parent::tearDown();
    }

    /**
     * Evaluates a getter the way the directive processor does: within a context.
     */
    private function evaluate(string $getter, array $context = [], string $now = self::NOW): mixed
    {
        $context = array_replace_recursive(
            [
                'units'        => 'metric',
                'unitSettings' => ['temperature' => '', 'wind' => '', 'precipitation' => '', 'pressure' => ''],
                'item'         => self::CURRENT,
                'query'        => ['data' => ['meta' => ['timezone' => 'Asia/Tokyo'], 'current' => self::CURRENT]],
            ],
            $context
        );

        Functions\when('wp_interactivity_get_context')->justReturn($context);

        $clock = static fn(): int => (new \DateTimeImmutable($now))->getTimestamp();

        return (new DerivedState($clock))->getters()[$getter]();
    }

    public function test_defines_every_getter_the_view_scripts_read_so_nothing_renders_empty(): void
    {
        $clientOnly = ['forecastItems', 'weatherForecastRequestUrl'];
        $inViews    = [];

        foreach (glob(dirname(__DIR__, 3) . '/src/blocks/*/view.js') as $file) {
            preg_match_all('/^\s*get (\w+)\(\)/m', (string) file_get_contents($file), $matches);
            $inViews = array_merge($inViews, $matches[1]);
        }

        $expected = array_values(array_diff(array_unique($inViews), $clientOnly));
        $actual   = array_keys((new DerivedState())->getters());
        sort($expected);
        sort($actual);

        $this->assertNotEmpty($expected);
        $this->assertSame($expected, $actual);
    }

    public function test_current_temperature_comes_from_the_weather_forecast_of_the_report(): void
    {
        $this->assertSame('28.1', $this->evaluate('temperature'));
        $this->assertSame('31', $this->evaluate('temperature', ['displayType' => 'feels-like']));
        $this->assertSame('28.1°C', $this->evaluate('formattedTemperature'));
    }

    #[DataProvider('temperatureUnits')]
    public function test_temperature_unit_label(array $context, string $expected): void
    {
        foreach (['unit', 'dailyTemperatureUnit', 'hourlyTemperatureUnit'] as $getter) {
            $item = ['item' => ['temperature_min' => 12.0, 'temperature' => 12.0]];
            $this->assertSame($expected, $this->evaluate($getter, $context + $item), $getter);
        }
    }

    public static function temperatureUnits(): array
    {
        return [
            'metric preset'            => [[], '°C'],
            'imperial preset'          => [['units' => 'imperial'], '°F'],
            'override wins over units' => [['units' => 'imperial', 'unitSettings' => ['temperature' => 'celsius']], '°C'],
            'degree symbol only'       => [['unitFormat' => 'degree-symbol'], '°'],
            'unit hidden'              => [['showUnit' => false], ''],
        ];
    }

    public function test_no_unit_without_a_value(): void
    {
        $empty = ['item' => null, 'query' => ['data' => null]];

        foreach (
            [
                'temperature', 'unit', 'formattedTemperature', 'humidity', 'humidityUnit', 'pressure', 'pressureUnit',
                'windSpeed', 'windSpeedUnit', 'windDirection', 'cloudCover', 'cloudCoverUnit', 'precipitation',
                'precipitationUnit', 'precipitationProbability', 'precipitationProbabilityUnit', 'uvIndex',
                'conditionDescription', 'dailyTemperature', 'dailyTemperatureUnit', 'hourlyTemperature',
                'hourlyTemperatureUnit', 'datetime', 'formattedDateTime', 'sunEventDatetime', 'formattedSunEvent',
                'lastUpdatedDatetime', 'formattedLastUpdated',
            ] as $getter
        ) {
            $context = array_replace(
                [
                    'units'        => 'metric',
                    'unitSettings' => [],
                ],
                $empty
            );
            Functions\when('wp_interactivity_get_context')->justReturn($context);

            $this->assertSame('', (new DerivedState())->getters()[$getter](), $getter);
        }
    }

    public function test_item_values_are_printed_as_the_browser_would(): void
    {
        $this->assertSame('64', $this->evaluate('humidity'));
        $this->assertSame('%', $this->evaluate('humidityUnit'));
        $this->assertSame('40', $this->evaluate('cloudCover'));
        $this->assertSame('%', $this->evaluate('cloudCoverUnit'));
        $this->assertSame('15', $this->evaluate('precipitationProbability'));
        $this->assertSame('%', $this->evaluate('precipitationProbabilityUnit'));
        $this->assertSame('0', $this->evaluate('precipitation'), 'A dry day prints 0, not nothing.');
        $this->assertSame('1013.2', $this->evaluate('pressure'));
        $this->assertSame('Partly cloudy', $this->evaluate('conditionDescription'));
    }

    public function test_uv_index_of_a_daily_item_is_its_maximum(): void
    {
        $this->assertSame('7.5', $this->evaluate('uvIndex'));
        $this->assertSame('9', $this->evaluate('uvIndex', ['item' => ['uv_index' => null, 'uv_index_max' => 9.0]]));
    }

    public function test_wind_speed_or_gusts(): void
    {
        $this->assertSame('12', $this->evaluate('windSpeed'));
        $this->assertSame('30.5', $this->evaluate('windSpeed', ['displayType' => 'gusts']));
    }

    #[DataProvider('windUnits')]
    public function test_wind_unit_label(array $context, string $expected): void
    {
        $this->assertSame("\u{00A0}" . $expected, $this->evaluate('windSpeedUnit', $context));
    }

    public static function windUnits(): array
    {
        return [
            'metric preset'   => [[], 'km/h'],
            'imperial preset' => [['units' => 'imperial'], 'mph'],
            'm/s'             => [['unitSettings' => ['wind' => 'ms']], 'm/s'],
            'knots'           => [['unitSettings' => ['wind' => 'knots']], 'kt'],
            'beaufort'        => [['unitSettings' => ['wind' => 'beaufort']], 'Bft'],
        ];
    }

    public function test_pressure_and_precipitation_unit_labels(): void
    {
        $this->assertSame("\u{00A0}hPa", $this->evaluate('pressureUnit'));
        $this->assertSame("\u{00A0}inHg", $this->evaluate('pressureUnit', ['unitSettings' => ['pressure' => 'inhg']]));
        $this->assertSame("\u{00A0}mbar", $this->evaluate('pressureUnit', ['unitSettings' => ['pressure' => 'mbar']]));
        $this->assertSame("\u{00A0}mm", $this->evaluate('precipitationUnit'));
        $this->assertSame("\u{00A0}in", $this->evaluate('precipitationUnit', ['units' => 'imperial']));
        $this->assertSame("\u{00A0}mm", $this->evaluate('precipitationUnit', ['units' => 'imperial', 'unitSettings' => ['precipitation' => 'mm']]));
    }

    public function test_wind_direction_as_cardinal_point_or_degrees(): void
    {
        $this->assertSame('SW', $this->evaluate('windDirection'));
        $this->assertSame('225°', $this->evaluate('windDirection', ['format' => 'degrees']));
        $this->assertSame('N', $this->evaluate('windDirection', ['item' => ['wind_direction' => 350]]));
        $this->assertSame('N', $this->evaluate('windDirection', ['item' => ['wind_direction' => 0]]));
    }

    public function test_daily_and_hourly_temperatures_follow_the_display_type(): void
    {
        $daily = ['item' => ['temperature_min' => 11.0, 'temperature_max' => 24.5, 'temperature_feels_like_min' => 9.0, 'temperature_feels_like_max' => 26.0]];

        $this->assertSame('11', $this->evaluate('dailyTemperature', $daily));
        $this->assertSame('24.5', $this->evaluate('dailyTemperature', $daily + ['displayType' => 'max']));
        $this->assertSame('9', $this->evaluate('dailyTemperature', $daily + ['displayType' => 'feels-like-min']));
        $this->assertSame('26', $this->evaluate('dailyTemperature', $daily + ['displayType' => 'feels-like-max']));
        $this->assertSame('28.1', $this->evaluate('hourlyTemperature'));
        $this->assertSame('31', $this->evaluate('hourlyTemperature', ['displayType' => 'feels-like']));
    }

    public function test_times_are_formatted_in_the_timezone_of_the_location(): void
    {
        // The site is in Paris, the weather forecast is for Tokyo: 14:15 there,
        // 07:15 in Paris.
        $this->assertSame('14:15', $this->evaluate('formattedDateTime', ['displayType' => 'time']));
        $this->assertSame('2026-07-01', $this->evaluate('formattedDateTime', ['displayType' => 'date']));
        $this->assertSame('2026-07-01T14:15:00+09:00', $this->evaluate('datetime'));
    }

    public function test_block_format_wins_over_the_site_format(): void
    {
        $this->assertSame('01/07 14h', $this->evaluate('formattedDateTime', ['format' => 'd/m H\h']));
    }

    public function test_today_and_now_labels_are_decided_in_the_timezone_of_the_location(): void
    {
        $labels = ['currentAsLabel' => true, 'todayLabel' => 'Today', 'nowLabel' => 'Now'];
        // 00:30 on 2 July in Tokyo is still 1 July in UTC and in Paris.
        $now      = '2026-07-02T00:30:00+09:00';
        $tomorrow = ['item' => ['timestamp' => '2026-07-02T00:00:00+09:00']];
        $nextHour = ['item' => ['timestamp' => '2026-07-02T01:00:00+09:00']];

        $this->assertSame('Today', $this->evaluate('formattedDateTime', $labels + $tomorrow, $now));
        $this->assertSame('Now', $this->evaluate('formattedDateTime', $labels + $tomorrow + ['displayType' => 'time'], $now));
        $this->assertSame('01:00', $this->evaluate('formattedDateTime', $labels + $nextHour + ['displayType' => 'time'], $now));
        // Noon on 1 July in Tokyo: same day as "now" in UTC and in Paris, but yesterday over there.
        $this->assertSame(
            '2026-07-01',
            $this->evaluate('formattedDateTime', $labels + ['item' => ['timestamp' => '2026-07-01T12:00:00+09:00']], $now)
        );
    }

    public function test_sun_events_are_formatted_in_the_timezone_of_the_location(): void
    {
        $this->assertSame('04:29', $this->evaluate('formattedSunEvent'));
        $this->assertSame('19:01', $this->evaluate('formattedSunEvent', ['displayType' => 'sunset']));
        $this->assertSame('2026-07-01T19:01:00+09:00', $this->evaluate('sunEventDatetime', ['displayType' => 'sunset']));
    }

    public function test_an_hourly_item_has_no_sun_event_and_shows_the_one_of_the_day(): void
    {
        $hourly = ['item' => ['sunrise' => null, 'sunset' => null]];

        $this->assertSame('04:29', $this->evaluate('formattedSunEvent', $hourly));
    }

    public function test_last_update_is_when_the_provider_was_asked_in_the_timezone_of_the_location(): void
    {
        // 05:32 UTC is 14:32 in Tokyo, 07:32 in Paris.
        $fetched = ['query' => ['data' => ['meta' => ['fetched_at' => '2026-07-01T05:32:10+00:00']]]];

        $this->assertSame('14:32', $this->evaluate('formattedLastUpdated', $fetched));
        $this->assertSame('01/07 14:32', $this->evaluate('formattedLastUpdated', $fetched + ['format' => 'd/m H:i']));
        $this->assertSame('2026-07-01T05:32:10+00:00', $this->evaluate('lastUpdatedDatetime', $fetched));
    }

    public function test_a_relative_date_is_printed_in_the_site_format_for_the_view_script_to_word(): void
    {
        $relative = ['format' => 'human-diff'];
        $fetched  = ['query' => ['data' => ['meta' => ['fetched_at' => '2026-07-01T05:32:10+00:00']]]];

        $this->assertSame('14:15', $this->evaluate('formattedDateTime', $relative + ['displayType' => 'time']));
        $this->assertSame('2026-07-01', $this->evaluate('formattedDateTime', $relative));
        $this->assertSame('19:01', $this->evaluate('formattedSunEvent', $relative + ['displayType' => 'sunset']));
        $this->assertSame('14:32', $this->evaluate('formattedLastUpdated', $relative + $fetched));
    }

    public function test_falls_back_to_the_site_timezone_when_the_provider_gives_none(): void
    {
        $context = ['displayType' => 'time', 'query' => ['data' => ['meta' => ['timezone' => '']]]];

        $this->assertSame('07:15', $this->evaluate('formattedDateTime', $context));
    }

    public function test_an_unreadable_timestamp_prints_nothing(): void
    {
        $this->assertSame('', $this->evaluate('formattedDateTime', ['item' => ['timestamp' => 'soon']]));
    }

    // --- Condition icon: an <svg><use> pointing at the symbol of the icon; the wrapper names it ---

    private const ICON_CONTEXT = [
        'isDecorative'   => false,
        'iconCollection' => 'elio',
        'item'           => [
            'condition_icons'       => ['elio' => 'elio/partly-cloudy', 'theme' => 'theme/cloud', 'sparse' => null],
            'condition_description' => 'Partly cloudy',
        ],
        'query'          => [
            'data' => [
                'icons' => [
                    'elio/partly-cloudy' => ['style' => 'stroke'],
                    'elio/sun'           => ['style' => 'fill'],
                    'theme/cloud'        => ['style' => 'fill'],
                ],
            ],
        ],
    ];

    public function test_condition_icon_points_at_the_symbol_of_the_icon_of_its_collection(): void
    {
        $this->assertTrue($this->evaluate('hasConditionIcon', self::ICON_CONTEXT));
        $this->assertSame('#elio-condition-icon-elio--partly-cloudy', $this->evaluate('conditionIconHref', self::ICON_CONTEXT));

        $theme = ['iconCollection' => 'theme'] + self::ICON_CONTEXT;
        $this->assertSame('#elio-condition-icon-theme--cloud', $this->evaluate('conditionIconHref', $theme));
    }

    public function test_an_item_without_icon_in_the_collection_points_at_nothing(): void
    {
        foreach (
            [
                'collection without icon for the condition' => ['iconCollection' => 'sparse'] + self::ICON_CONTEXT,
                'collection not requested'                  => ['iconCollection' => 'other'] + self::ICON_CONTEXT,
                'no collection in context'                  => array_diff_key(self::ICON_CONTEXT, ['iconCollection' => 1]),
                'item without icons'                        => ['item' => ['condition_icons' => []] + self::ICON_CONTEXT['item']] + self::ICON_CONTEXT,
            ] as $case => $context
        ) {
            $this->assertFalse($this->evaluate('hasConditionIcon', $context), $case);
            $this->assertNull($this->evaluate('conditionIconHref', $context), $case);
        }
    }

    public function test_a_stroke_icon_is_flagged_so_the_block_strokes_it(): void
    {
        $this->assertTrue($this->evaluate('isStrokeConditionIcon', self::ICON_CONTEXT));

        $fill = array_replace_recursive(self::ICON_CONTEXT, ['item' => ['condition_icons' => ['elio' => 'elio/sun']]]);

        $this->assertFalse($this->evaluate('isStrokeConditionIcon', $fill));
    }

    public function test_condition_icon_is_labelled_with_the_condition_unless_decorative(): void
    {
        $this->assertSame('img', $this->evaluate('conditionIconRole', self::ICON_CONTEXT));
        $this->assertSame('Partly cloudy', $this->evaluate('conditionIconLabel', self::ICON_CONTEXT));

        foreach (
            [
                'decorative'     => ['isDecorative' => true],
                'no description' => ['item' => ['condition_description' => '']],
                // Nothing on screen: a screen reader must not announce an image either.
                'no icon'        => ['item' => ['condition_icons' => ['elio' => null]]],
            ] as $case => $overrides
        ) {
            $context = array_replace_recursive(self::ICON_CONTEXT, $overrides);

            $this->assertNull($this->evaluate('conditionIconRole', $context), $case);
            $this->assertNull($this->evaluate('conditionIconLabel', $context), $case);
        }
    }
}
