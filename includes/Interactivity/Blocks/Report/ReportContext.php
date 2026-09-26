<?php

namespace ElioBlocks\Interactivity\Blocks\Report;

use ElioBlocks\Interactivity\Blocks\Forecast\ForecastWindow;

// Exit if called directly.
if (! defined('ABSPATH')) {
    die;
}

/**
 * Weather forecast of the report block being rendered, shared with its inner
 * blocks.
 *
 * PreloadWeatherForecast stores the weather forecast here before inner blocks
 * render. Their render.php files read it through functions.php: the current
 * conditions and their icon (elio_blocks_get_current_conditions(),
 * elio_blocks_get_condition_icon()), the rows of a forecast list
 * (elio_blocks_get_forecast_items()).
 *
 * Registered as a singleton in the DI container so PreloadWeatherForecast
 * (injected) and those functions share the same instance.
 */
final class ReportContext
{
    /**
     * @var array<string, mixed>|null
     */
    private ?array $weatherForecast = null;

    /**
     * @var \Closure(): int
     */
    private \Closure $clock;

    /**
     * Constructor.
     *
     * @param (callable(): int)|null $clock Returns the current Unix timestamp. Defaults to time().
     */
    public function __construct(?callable $clock = null)
    {
        $this->clock = null !== $clock ? $clock(...) : time(...);
    }

    /**
     * Stores the weather forecast the inner blocks of a report block read.
     *
     * @param array<string, mixed>|null $weatherForecast Weather forecast of the report block about to render, null when it has none.
     */
    public function setWeatherForecast(?array $weatherForecast): void
    {
        $this->weatherForecast = $weatherForecast;
    }

    /**
     * Returns the current conditions.
     *
     * @return array<string, mixed>|null
     */
    public function getCurrentItem(): ?array
    {
        $current = $this->weatherForecast['current'] ?? null;

        return is_array($current) ? $current : null;
    }

    /**
     * Returns the icon an item points to with a qualified name in condition_icons.
     *
     * @return array{content: string, style: string}|null
     */
    public function getIcon(?string $name): ?array
    {
        return null !== $name ? ( $this->weatherForecast['icons'][ $name ] ?? null ) : null;
    }

    /**
     * Returns the rows of a forecast list.
     *
     * @param string $type  'daily' or 'hourly'.
     * @param int    $count Number of rows.
     * @return list<array<string, mixed>>
     */
    public function getForecastItems(string $type, int $count): array
    {
        return ForecastWindow::select($this->weatherForecast, $type, $count, ( $this->clock )());
    }
}
