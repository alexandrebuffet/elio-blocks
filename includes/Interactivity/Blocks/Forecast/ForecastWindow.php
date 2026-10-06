<?php

namespace ElioBlocks\Interactivity\Blocks\Forecast;

// Exit if called directly.
if (! defined('ABSPATH')) {
    die;
}

/**
 * Picks the rows a forecast list shows: the next N days or hours, starting at
 * the day or the hour in progress.
 *
 * Same rules as `selectForecastItems()` in src/shared/forecast-window.js: the
 * browser rebuilds the list after each fetch and must land on the rows the
 * server rendered.
 */
final class ForecastWindow
{
    /**
     * How long an item lasts when no item follows it.
     */
    private const PERIOD_IN_SECONDS = array(
        'hourly' => 3600,
        'daily'  => 86400,
    );

    /**
     * Returns the rows a forecast list shows: from the first item that has not
     * ended yet, none when every item has.
     *
     * @param array<string, mixed>|null $forecast Normalized forecast.
     * @param string                    $type     'daily' or 'hourly'.
     * @param int                       $count    Number of rows.
     * @param int                       $now      Current Unix timestamp.
     * @return list<array<string, mixed>>
     */
    public static function select(?array $forecast, string $type, int $count, int $now): array
    {
        if (! isset(self::PERIOD_IN_SECONDS[ $type ]) || ! is_array($forecast[ $type ] ?? null)) {
            return array();
        }

        $items = array_values($forecast[ $type ]);

        foreach (array_keys($items) as $index) {
            $end = self::endOf($items, $index, self::PERIOD_IN_SECONDS[ $type ]);

            if (null !== $end && $end > $now) {
                return array_slice($items, $index, max(0, $count));
            }
        }

        return array();
    }

    /**
     * Returns when the hour or the day of an item ends: when the next item
     * starts (a day of a change of daylight saving time lasts 23 or 25 hours),
     * else one period after its own start. Null without a valid timestamp.
     *
     * Timestamps carry their UTC offset, so instants are compared: no timezone
     * of the server or the visitor gets in the way, half-hour offsets included.
     *
     * @param list<mixed> $items  Items of the section.
     * @param int         $index  Index of the item.
     * @param int         $period Length of an hour or a day, in seconds.
     */
    private static function endOf(array $items, int $index, int $period): ?int
    {
        $start = self::startOf($items[ $index ] ?? null);
        $next  = self::startOf($items[ $index + 1 ] ?? null);

        if (null === $start) {
            return null;
        }

        return null !== $next && $next > $start ? $next : $start + $period;
    }

    /**
     * Returns when an item starts, null without a valid timestamp.
     */
    private static function startOf(mixed $item): ?int
    {
        $start = is_array($item) ? strtotime((string) ( $item['timestamp'] ?? '' )) : false;

        return false === $start ? null : $start;
    }
}
