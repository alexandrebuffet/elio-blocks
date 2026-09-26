<?php

namespace ElioBlocks\Tests\Unit\WeatherForecast;

use Brain\Monkey;
use Brain\Monkey\Functions;
use ElioBlocks\WeatherForecast\WeatherForecast;
use ElioBlocks\WeatherForecast\OpenMeteoWeatherForecastResponseNormalizer;
use PHPUnit\Framework\TestCase;

class OpenMeteoWeatherForecastResponseNormalizerTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        Monkey\setUp();
        Functions\stubTranslationFunctions();
    }

    protected function tearDown(): void
    {
        Monkey\tearDown();
        parent::tearDown();
    }

    /**
     * Returns a response of Open-Meteo for Tokyo.
     *
     * Open-Meteo answers in the local time of the location, without offset:
     * "2026-07-01T14:00" means 2 pm in Tokyo, not 2 pm for the visitor.
     */
    private function tokyoResponse(): array
    {
        return [
            'latitude'           => 35.7,
            'longitude'          => 139.69,
            'timezone'           => 'Asia/Tokyo',
            'utc_offset_seconds' => 32400,
            'current'            => ['time' => '2026-07-01T14:15', 'temperature_2m' => 28.1, 'weather_code' => 0],
            'hourly'             => [
                'time'           => ['2026-07-01T14:00', '2026-07-01T15:00'],
                'temperature_2m' => [28.0, 28.4],
                'weather_code'   => [0, 1],
            ],
            'daily'              => [
                'time'         => ['2026-07-01', '2026-07-02'],
                'weather_code' => [0, 3],
                'sunrise'      => ['2026-07-01T04:29', '2026-07-02T04:29'],
                'sunset'       => ['2026-07-01T19:01', '2026-07-02T19:01'],
            ],
        ];
    }

    public function test_timestamps_carry_the_utc_offset_of_the_location(): void
    {
        $weatherForecast = (new OpenMeteoWeatherForecastResponseNormalizer())->normalize($this->tokyoResponse(), 'metric');

        $this->assertSame('2026-07-01T14:15:00+09:00', $weatherForecast['current']['timestamp']);
        $this->assertSame('2026-07-01T15:00:00+09:00', $weatherForecast['hourly'][1]['timestamp']);
        $this->assertSame('2026-07-02T00:00:00+09:00', $weatherForecast['daily'][1]['timestamp']);
    }

    public function test_sun_events_carry_the_utc_offset_of_the_location(): void
    {
        $weatherForecast = (new OpenMeteoWeatherForecastResponseNormalizer())->normalize($this->tokyoResponse(), 'metric');

        $this->assertSame('2026-07-01T04:29:00+09:00', $weatherForecast['current']['sunrise']);
        $this->assertSame('2026-07-01T19:01:00+09:00', $weatherForecast['current']['sunset']);
        $this->assertSame('2026-07-02T04:29:00+09:00', $weatherForecast['daily'][1]['sunrise']);
        $this->assertSame('2026-07-02T19:01:00+09:00', $weatherForecast['daily'][1]['sunset']);
    }

    public function test_offset_follows_a_daylight_saving_change_inside_the_weather_forecast_period(): void
    {
        $response                       = $this->tokyoResponse();
        $response['timezone']           = 'Europe/Paris';
        $response['utc_offset_seconds'] = 7200;
        // Clocks go back on 25 October 2026.
        $response['daily']['time'] = ['2026-10-24', '2026-10-26'];

        $weatherForecast = (new OpenMeteoWeatherForecastResponseNormalizer())->normalize($response, 'metric');

        $this->assertSame('2026-10-24T00:00:00+02:00', $weatherForecast['daily'][0]['timestamp']);
        $this->assertSame('2026-10-26T00:00:00+01:00', $weatherForecast['daily'][1]['timestamp']);
    }

    public function test_falls_back_to_the_numeric_offset_when_the_timezone_name_is_unknown(): void
    {
        $response             = $this->tokyoResponse();
        $response['timezone'] = 'Mars/Olympus_Mons';

        $weatherForecast = (new OpenMeteoWeatherForecastResponseNormalizer())->normalize($response, 'metric');

        $this->assertSame('2026-07-01T14:15:00+09:00', $weatherForecast['current']['timestamp']);
    }

    public function test_meta_keeps_the_timezone_name_for_formatting(): void
    {
        $weatherForecast = (new OpenMeteoWeatherForecastResponseNormalizer())->normalize($this->tokyoResponse(), 'metric');

        $this->assertSame('Asia/Tokyo', $weatherForecast['meta']['timezone']);
    }

    public function test_conditions_are_left_undescribed_because_the_result_is_cached_for_every_language(): void
    {
        $weatherForecast = (new OpenMeteoWeatherForecastResponseNormalizer())->normalize($this->tokyoResponse(), 'metric');

        $this->assertArrayNotHasKey('condition_description', $weatherForecast['current']);
        $this->assertArrayNotHasKey('condition_description', $weatherForecast['hourly'][0]);
        $this->assertArrayNotHasKey('condition_description', $weatherForecast['daily'][0]);
    }

    public function test_rows_are_built_from_the_column_oriented_response(): void
    {
        $weatherForecast = (new OpenMeteoWeatherForecastResponseNormalizer())->normalize($this->tokyoResponse(), 'metric');

        $this->assertCount(2, $weatherForecast['hourly']);
        $this->assertSame(28.4, $weatherForecast['hourly'][1]['temperature']);
        $this->assertSame(1, $weatherForecast['hourly'][1]['condition_code']);
        $this->assertSame(3, $weatherForecast['daily'][1]['condition_code']);
    }

    // --- Contract with the real API: a response recorded from Open-Meteo
    // (Darwin, UTC+09:30) ---

    private function recordedForecast(): array
    {
        $json = (string) file_get_contents(dirname(__DIR__, 2) . '/fixtures/open-meteo/forecast-darwin-metric.json');

        return (new OpenMeteoWeatherForecastResponseNormalizer())->normalize(json_decode($json, true), 'metric');
    }

    public function test_a_recorded_response_gives_a_week_of_rows_the_plugin_accepts(): void
    {
        $weatherForecast = WeatherForecast::fromArray($this->recordedForecast())->toArray();

        $this->assertCount(168, $weatherForecast['hourly']);
        $this->assertCount(7, $weatherForecast['daily']);
        $this->assertSame('Australia/Darwin', $weatherForecast['meta']['timezone']);
        $this->assertSame('open-meteo', $weatherForecast['meta']['provider']);
    }

    public function test_a_recorded_response_has_every_field_the_blocks_display(): void
    {
        $weatherForecast = $this->recordedForecast();
        $common   = ['timestamp', 'condition_code', 'wind_speed', 'wind_direction'];

        $expected = [
            'current' => [...$common, 'temperature', 'temperature_feels_like', 'humidity', 'pressure', 'wind_gusts',
                'cloud_cover', 'precipitation', 'uv_index', 'is_day', 'sunrise', 'sunset'],
            'hourly'  => [...$common, 'temperature', 'temperature_feels_like', 'humidity', 'pressure', 'cloud_cover',
                'precipitation', 'precipitation_probability', 'uv_index', 'is_day'],
            'daily'   => [...$common, 'temperature_min', 'temperature_max', 'temperature_feels_like_min',
                'temperature_feels_like_max', 'wind_gusts', 'precipitation', 'precipitation_probability',
                'uv_index_max', 'sunrise', 'sunset'],
        ];

        $this->assertSame([], array_diff($expected['current'], array_keys($weatherForecast['current'])), 'current');
        $this->assertSame([], array_diff($expected['hourly'], array_keys($weatherForecast['hourly'][0])), 'hourly');
        $this->assertSame([], array_diff($expected['daily'], array_keys($weatherForecast['daily'][0])), 'daily');
    }

    public function test_a_recorded_response_keeps_its_half_hour_offset_and_its_values(): void
    {
        $weatherForecast = $this->recordedForecast();

        $this->assertSame('2026-09-21T17:00:00+09:30', $weatherForecast['current']['timestamp']);
        $this->assertSame('2026-09-21T06:37:00+09:30', $weatherForecast['current']['sunrise']);
        $this->assertSame('2026-09-21T00:00:00+09:30', $weatherForecast['daily'][0]['timestamp']);
        $this->assertSame('2026-09-21T00:00:00+09:30', $weatherForecast['hourly'][0]['timestamp']);
        $this->assertSame(28.1, $weatherForecast['current']['temperature']);
        $this->assertSame(29.3, $weatherForecast['daily'][0]['temperature_max']);
        $this->assertSame(51, $weatherForecast['daily'][0]['condition_code']);
    }
}
