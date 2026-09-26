<?php

namespace ElioBlocks\Interactivity\Blocks\Forecast;

// Exit if called directly.
if (! defined('ABSPATH')) {
    die;
}

/**
 * Picks the rows a forecast list shows: the next N days, or the next N hours
 * starting at the hour in progress.
 *
 * Same rules as `state.forecastItems` in src/blocks/weather-report/view.js:
 * the browser rebuilds the list after each fetch and must land on the rows the
 * server rendered.
 */
final class ForecastWindow
{
    private const HOUR_IN_SECONDS = 3600;

    /**
     * Returns the rows a forecast list shows.
     *
     * @param array<string, mixed>|null $forecast Normalized forecast.
     * @param string                    $type     'daily' or 'hourly'.
     * @param int                       $count    Number of rows.
     * @param int                       $now      Current Unix timestamp.
     * @return list<array<string, mixed>>
     */
    public static function select(?array $forecast, string $type, int $count, int $now): array
    {
        if (! in_array($type, array( 'daily', 'hourly' ), true) || ! is_array($forecast[ $type ] ?? null)) {
            return array();
        }

        $items = array_values($forecast[ $type ]);
        $from  = 'hourly' === $type ? self::indexOfHourInProgress($items, $now) : 0;

        return array_slice($items, $from, max(0, $count));
    }

    /**
     * Returns the index of the first hourly item that has not ended yet, 0 when they all have.
     *
     * Timestamps carry their UTC offset, so instants are compared: no timezone
     * of the server or the visitor gets in the way, half-hour offsets included.
     *
     * @param list<mixed> $items Hourly items.
     */
    private static function indexOfHourInProgress(array $items, int $now): int
    {
        foreach ($items as $index => $item) {
            $start = is_array($item) ? strtotime((string) ( $item['timestamp'] ?? '' )) : false;

            if (false !== $start && $start + self::HOUR_IN_SECONDS > $now) {
                return $index;
            }
        }

        return 0;
    }
}
