<?php

namespace ElioBlocks\Tests\Unit\Blocks;

use Brain\Monkey;
use ElioBlocks\Interactivity\Blocks\Report\ReportContext;
use PHPUnit\Framework\TestCase;

class ForecastTemplateRenderTest extends TestCase
{
    use RendersBlocks;

    private const WEATHER_FORECAST = [
        'hourly' => [
            ['timestamp' => '2026-07-01T13:00:00+02:00', 'temperature' => 21.0],
            ['timestamp' => '2026-07-01T14:00:00+02:00', 'temperature' => 22.0],
            ['timestamp' => '2026-07-01T15:00:00+02:00', 'temperature' => 23.0],
        ],
        'daily'  => [
            ['timestamp' => '2026-07-01T00:00:00+02:00', 'temperature_max' => 25.0],
            ['timestamp' => '2026-07-02T00:00:00+02:00', 'temperature_max' => 27.0],
            ['timestamp' => '2026-07-03T00:00:00+02:00', 'temperature_max' => 24.0],
        ],
    ];

    private ReportContext $report;

    protected function setUp(): void
    {
        parent::setUp();
        Monkey\setUp();

        $this->report = new ReportContext(static fn(): int => (new \DateTimeImmutable('2026-07-01T14:30:00+02:00'))->getTimestamp());
        $this->stubRenderFunctions();
        $this->stubWeatherForecastFunctions($this->report);
    }

    protected function tearDown(): void
    {
        Monkey\tearDown();
        parent::tearDown();
    }

    public function test_rows_are_in_the_page_so_the_server_renders_the_list(): void
    {
        $this->report->setWeatherForecast(self::WEATHER_FORECAST);

        $html = $this->renderBlock('forecast-template', [], ['elio/forecastType' => 'daily', 'elio/forecastCount' => 2]);

        // assertEquals: the JSON round trip reads 25.0 back as 25.
        $this->assertEquals(
            [self::WEATHER_FORECAST['daily'][0], self::WEATHER_FORECAST['daily'][1]],
            $this->contextOf($html)['forecastItems']
        );
    }

    public function test_hourly_rows_start_at_the_hour_in_progress(): void
    {
        $this->report->setWeatherForecast(self::WEATHER_FORECAST);

        $html = $this->renderBlock('forecast-template', [], ['elio/forecastType' => 'hourly', 'elio/forecastCount' => 24]);

        $this->assertEquals(
            [self::WEATHER_FORECAST['hourly'][1], self::WEATHER_FORECAST['hourly'][2]],
            $this->contextOf($html)['forecastItems']
        );
    }

    public function test_the_list_is_empty_when_the_report_has_no_weather_forecast(): void
    {
        $html = $this->renderBlock('forecast-template', [], ['elio/forecastType' => 'daily', 'elio/forecastCount' => 7]);

        $this->assertSame([], $this->contextOf($html)['forecastItems']);
    }

    public function test_the_row_template_wraps_the_inner_blocks(): void
    {
        $html = $this->renderBlock('forecast-template', [], [], '<p>row</p>');

        $this->assertMatchesRegularExpression(
            '#<template data-wp-each--item="context.forecastItems">\s*<li[^>]*>\s*<p>row</p>\s*</li>\s*</template>#',
            $html
        );
    }

    public function test_the_rows_move_with_the_clock_of_the_page(): void
    {
        $html = $this->renderBlock('forecast-template', [], ['elio/forecastType' => 'hourly', 'elio/forecastCount' => 24]);

        $this->assertStringContainsString('data-wp-watch="callbacks.syncForecastItems"', $html);
        // Three hyphens: two for a unique ID are deprecated since WordPress 7.0.
        $this->assertStringContainsString('data-wp-watch---clock="callbacks.startQuarterHourClock"', $html);
    }
}
