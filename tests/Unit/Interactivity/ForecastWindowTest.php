<?php

namespace ElioBlocks\Tests\Unit\WeatherForecast;

use ElioBlocks\Interactivity\Blocks\Forecast\ForecastWindow;
use PHPUnit\Framework\TestCase;

/**
 * Rows a forecast-template block shows. Same rules as `state.forecastItems`
 * in src/blocks/weather-report/view.js, so hydration keeps the server rows.
 */
class ForecastWindowTest extends TestCase
{
    private static function at(string $iso): int
    {
        return (new \DateTimeImmutable($iso))->getTimestamp();
    }

    private static function hours(string ...$times): array
    {
        return array_map(static fn(string $time): array => ['timestamp' => "2026-07-01T{$time}:00+05:30"], $times);
    }

    public function test_daily_rows_are_the_first_days_of_the_forecast(): void
    {
        $forecast = ['daily' => [['timestamp' => 'd1'], ['timestamp' => 'd2'], ['timestamp' => 'd3']]];

        $rows = ForecastWindow::select($forecast, 'daily', 2, self::at('2026-07-01T10:00:00Z'));

        $this->assertSame([['timestamp' => 'd1'], ['timestamp' => 'd2']], $rows);
    }

    public function test_hourly_rows_start_at_the_hour_in_progress_at_the_location(): void
    {
        $forecast = ['hourly' => self::hours('12:00', '13:00', '14:00', '15:00')];

        // 13:45 in Kolkata (UTC+05:30), while the server runs in UTC.
        $rows = ForecastWindow::select($forecast, 'hourly', 2, self::at('2026-07-01T13:45:00+05:30'));

        $this->assertSame(self::hours('13:00', '14:00'), $rows);
    }

    public function test_an_hour_that_just_ended_is_not_shown(): void
    {
        $forecast = ['hourly' => self::hours('12:00', '13:00', '14:00')];

        $rows = ForecastWindow::select($forecast, 'hourly', 1, self::at('2026-07-01T14:00:00+05:30'));

        $this->assertSame(self::hours('14:00'), $rows);
    }

    public function test_a_forecast_entirely_in_the_past_is_shown_from_its_start_like_the_browser_does(): void
    {
        $forecast = ['hourly' => self::hours('12:00', '13:00')];

        $rows = ForecastWindow::select($forecast, 'hourly', 5, self::at('2026-07-03T00:00:00Z'));

        $this->assertSame(self::hours('12:00', '13:00'), $rows);
    }

    public function test_no_rows_without_a_forecast_or_for_an_unknown_section(): void
    {
        $this->assertSame([], ForecastWindow::select(null, 'daily', 7, 0));
        $this->assertSame([], ForecastWindow::select(['daily' => 'oops'], 'daily', 7, 0));
        $this->assertSame([], ForecastWindow::select(['daily' => [['timestamp' => 'd1']]], 'minutely', 7, 0));
    }

    public function test_rows_are_a_list_so_the_context_encodes_to_a_json_array(): void
    {
        $forecast = ['hourly' => self::hours('12:00', '13:00', '14:00')];

        $rows = ForecastWindow::select($forecast, 'hourly', 2, self::at('2026-07-01T13:10:00+05:30'));

        $this->assertTrue(array_is_list($rows));
    }
}
