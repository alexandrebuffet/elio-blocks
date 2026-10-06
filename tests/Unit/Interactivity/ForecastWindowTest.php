<?php

namespace ElioBlocks\Tests\Unit\WeatherForecast;

use ElioBlocks\Interactivity\Blocks\Forecast\ForecastWindow;
use PHPUnit\Framework\TestCase;

/**
 * Rows a forecast-template block shows. Same cases as
 * src/shared/test/forecast-window.test.js, so hydration keeps the server rows.
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

    private static function days(int ...$days): array
    {
        return array_map(static fn(int $day): array => ['timestamp' => "2026-07-0{$day}T00:00:00+02:00"], $days);
    }

    public function test_daily_rows_start_at_the_day_in_progress_at_the_location(): void
    {
        $forecast = ['daily' => self::days(1, 2, 3, 4)];

        $rows = ForecastWindow::select($forecast, 'daily', 2, self::at('2026-07-02T10:00:00+02:00'));

        $this->assertSame(self::days(2, 3), $rows);
    }

    public function test_a_day_that_just_ended_is_not_shown_from_a_copy_taken_the_day_before(): void
    {
        $forecast = ['daily' => self::days(1, 2, 3)];

        // 00:10 in Paris, still 1 July in UTC.
        $rows = ForecastWindow::select($forecast, 'daily', 2, self::at('2026-07-02T00:10:00+02:00'));

        $this->assertSame(self::days(2, 3), $rows);
    }

    public function test_a_day_ends_when_the_next_one_starts_on_a_day_of_25_hours_too(): void
    {
        // Paris goes back to UTC+01:00 on 25 October.
        $forecast = ['daily' => [
            ['timestamp' => '2026-10-25T00:00:00+02:00'],
            ['timestamp' => '2026-10-26T00:00:00+01:00'],
        ]];

        // 23:30 on 25 October, 24 hours and a half after it started.
        $rows = ForecastWindow::select($forecast, 'daily', 1, self::at('2026-10-25T23:30:00+01:00'));

        $this->assertSame([$forecast['daily'][0]], $rows);
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

    public function test_the_last_hour_is_shown_until_it_ends(): void
    {
        $forecast = ['hourly' => self::hours('12:00', '13:00')];

        $rows = ForecastWindow::select($forecast, 'hourly', 5, self::at('2026-07-01T13:59:00+05:30'));

        $this->assertSame(self::hours('13:00'), $rows);
    }

    public function test_no_rows_once_every_item_has_ended_rather_than_past_ones(): void
    {
        $forecast = ['hourly' => self::hours('12:00', '13:00'), 'daily' => self::days(1, 2)];
        $now      = self::at('2026-07-03T00:00:00Z');

        $this->assertSame([], ForecastWindow::select($forecast, 'hourly', 5, $now));
        $this->assertSame([], ForecastWindow::select($forecast, 'daily', 5, $now));
    }

    public function test_no_rows_without_a_forecast_or_for_an_unknown_section(): void
    {
        $this->assertSame([], ForecastWindow::select(null, 'daily', 7, 0));
        $this->assertSame([], ForecastWindow::select(['daily' => 'oops'], 'daily', 7, 0));
        $this->assertSame([], ForecastWindow::select(['minutely' => self::days(1)], 'minutely', 7, 0));
        $this->assertSame([], ForecastWindow::select(['daily' => [['timestamp' => 'soon']]], 'daily', 7, 0));
    }

    public function test_rows_are_a_list_so_the_context_encodes_to_a_json_array(): void
    {
        $forecast = ['hourly' => self::hours('12:00', '13:00', '14:00')];

        $rows = ForecastWindow::select($forecast, 'hourly', 2, self::at('2026-07-01T13:10:00+05:30'));

        $this->assertTrue(array_is_list($rows));
    }
}
