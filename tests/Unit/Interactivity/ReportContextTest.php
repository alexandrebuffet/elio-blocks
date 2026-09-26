<?php

namespace ElioBlocks\Tests\Unit\Interactivity;

use ElioBlocks\Interactivity\Blocks\Report\ReportContext;
use PHPUnit\Framework\TestCase;

class ReportContextTest extends TestCase
{
    private const WEATHER_FORECAST = [
        'current' => ['temperature' => 20.0, 'condition_icons' => ['elio' => 'elio/sun']],
        'hourly'  => [
            ['timestamp' => '2026-07-01T13:00:00+02:00'],
            ['timestamp' => '2026-07-01T14:00:00+02:00'],
            ['timestamp' => '2026-07-01T15:00:00+02:00'],
        ],
        'daily'   => [['timestamp' => '2026-07-01T00:00:00+02:00'], ['timestamp' => '2026-07-02T00:00:00+02:00']],
        'icons'   => ['elio/sun' => ['content' => '<svg></svg>', 'style' => 'fill']],
    ];

    private function makeContext(): ReportContext
    {
        return new ReportContext(static fn(): int => (new \DateTimeImmutable('2026-07-01T14:30:00+02:00'))->getTimestamp());
    }

    public function test_is_empty_until_a_report_block_preloads_its_weather_forecast(): void
    {
        $context = $this->makeContext();

        $this->assertNull($context->getCurrentItem());
        $this->assertNull($context->getIcon('elio/sun'));
        $this->assertSame([], $context->getForecastItems('daily', 7));
    }

    public function test_gives_inner_blocks_the_current_conditions_and_their_icon(): void
    {
        $context = $this->makeContext();
        $context->setWeatherForecast(self::WEATHER_FORECAST);

        $this->assertSame(self::WEATHER_FORECAST['current'], $context->getCurrentItem());
        $this->assertSame(self::WEATHER_FORECAST['icons']['elio/sun'], $context->getIcon('elio/sun'));
        $this->assertNull($context->getIcon('elio/tornado'));
        $this->assertNull($context->getIcon(null));
    }

    public function test_gives_a_forecast_template_its_rows(): void
    {
        $context = $this->makeContext();
        $context->setWeatherForecast(self::WEATHER_FORECAST);

        $this->assertSame([self::WEATHER_FORECAST['daily'][0]], $context->getForecastItems('daily', 1));
        $this->assertSame(
            [self::WEATHER_FORECAST['hourly'][1], self::WEATHER_FORECAST['hourly'][2]],
            $context->getForecastItems('hourly', 5),
            'Hourly rows start at the hour in progress.'
        );
    }

    public function test_a_report_without_weather_forecast_clears_what_the_previous_report_left(): void
    {
        $context = $this->makeContext();
        $context->setWeatherForecast(self::WEATHER_FORECAST);

        $context->setWeatherForecast(null);

        $this->assertNull($context->getCurrentItem());
        $this->assertSame([], $context->getForecastItems('daily', 7));
    }
}
