<?php

namespace ElioBlocks\WeatherForecast;

use ElioBlocks\Weather\Condition\ConditionDescriptions;
use ElioBlocks\Weather\Condition\Icons\ConditionIconsRegistry;
use ElioBlocks\Weather\Condition\WmoConditionCodes;
use ElioBlocks\Weather\Units\UnitsConversionService;

// Exit if called directly.
if (! defined('ABSPATH')) {
    die;
}

/**
 * Turns the weather forecast of a provider into what the REST API and the
 * blocks show.
 *
 * Everything added here depends on the site or on the request, not on the
 * weather: the icon collections the page shows, the unit overrides, the
 * language. None of it belongs in the cached weather forecast, which is
 * shared by every visitor.
 */
class WeatherForecastPresenter
{
    /**
     * Fields of an item holding a date-time (ISO 8601, with its UTC offset).
     */
    private const DATE_FIELDS = array( 'timestamp', 'sunrise', 'sunset' );

    /**
     * Constructor.
     *
     * @param ConditionIconsRegistry $iconRegistry   Icon registry.
     * @param UnitsConversionService $unitConversion Unit conversion service.
     */
    public function __construct(
        private ConditionIconsRegistry $iconRegistry,
        private UnitsConversionService $unitConversion,
    ) {
    }

    /**
     * Presents the weather forecast of a provider: condition icons and descriptions,
     * unit overrides, timezone names.
     *
     * @param WeatherForecast       $weatherForecast Weather forecast of the provider.
     * @param string                $units           Unit preset the provider answered in ('metric' or 'imperial').
     * @param array<string, string> $unitSettings    Per-domain unit overrides: temperature, wind, precipitation, pressure, distance.
     * @param list<string>          $iconCollections Collections whose icons the items name (the ones the page shows).
     * @return array<string, mixed> Weather forecast sections, plus the `icons` dictionary.
     */
    public function present(WeatherForecast $weatherForecast, string $units, array $unitSettings = array(), array $iconCollections = array()): array
    {
        $icons        = array();
        $times        = array();
        $descriptions = ConditionDescriptions::getDescriptions();

        $presented = $weatherForecast->mapItems(
            function (array $item) use (&$icons, &$times, $descriptions, $units, $unitSettings, $iconCollections): array {
                foreach (self::DATE_FIELDS as $field) {
                    $time = is_string($item[ $field ] ?? null) ? strtotime($item[ $field ]) : false;

                    if (false !== $time) {
                        $times[] = $time;
                    }
                }

                $condition = $this->conditionSlug($item);

                // Items name their icon in each collection the page shows; each SVG is
                // sent once, in the dictionary. A week of hourly rows repeats the same
                // handful of icons.
                $item['condition_icons'] = array();

                foreach ($iconCollections as $collection) {
                    $icon = null !== $condition ? $this->resolveIcon($collection, $condition, $item) : null;

                    $item['condition_icons'][ $collection ] = $icon['name'] ?? null;

                    if (null !== $icon) {
                        $icons[ $icon['name'] ] = array(
                            'content' => $icon['content'],
                            'style'   => $icon['style'],
                        );
                    }
                }

                // A provider without WMO codes may describe the condition itself.
                $item['condition_description'] = null !== $condition
                    ? ( $descriptions[ $condition ] ?? '' )
                    : (string) ( $item['condition_description'] ?? '' );

                return ! empty($unitSettings)
                    ? $this->unitConversion->convertItem($item, $units, $unitSettings)
                    : $item;
            }
        )->toArray();

        $presented['icons'] = $icons;

        // Which units the values are in: the front gets it from the block context,
        // the editor has nothing else to label them with.
        $presented['meta']['units']         = $units;
        $presented['meta']['unit_settings'] = $unitSettings;

        $presented['meta']['timezone_abbreviations'] = $this->timezoneAbbreviations($presented['meta']['timezone'] ?? '', $times);

        return $presented;
    }

    /**
     * Returns the names PHP gives the timezone of the location (`T` in a date
     * format) over the weather forecast period, each from the Unix time it comes
     * into force: "CEST", then "CET". Browsers have no timezone database to name it: Intl
     * says "GMT+2".
     *
     * @param mixed     $timezone IANA name of the timezone of the location.
     * @param list<int> $times    Unix times of the dates of the weather forecast.
     * @return list<array{from: int, abbr: string}>
     */
    private function timezoneAbbreviations(mixed $timezone, array $times): array
    {
        if (! is_string($timezone) || '' === $timezone || empty($times)) {
            return array();
        }

        try {
            $transitions = ( new \DateTimeZone($timezone) )->getTransitions(min($times), max($times));
        } catch (\Exception $e) {
            // Unknown identifier: the dates are shown in the timezone of the site.
            return array();
        }

        return false === $transitions ? array() : array_map(
            fn(array $transition): array => array(
                'from' => (int) $transition['ts'],
                'abbr' => (string) $transition['abbr'],
            ),
            array_values($transitions)
        );
    }

    /**
     * Returns the WMO condition slug of an item ('clear-sky'…), null without a known code.
     *
     * @param array<string, mixed> $item Weather item.
     */
    private function conditionSlug(array $item): ?string
    {
        $code = $item['condition_code'] ?? null;

        return is_int($code) || is_string($code) ? ( WmoConditionCodes::getCodes()[ $code ] ?? null ) : null;
    }

    /**
     * Resolves the icon of a condition in a collection.
     *
     * Daily items have no is_day: they get the day icon. The registry falls back
     * to the 'all' mapping when there is no day/night-specific one.
     *
     * @param string               $collection Collection slug.
     * @param string               $condition  WMO condition slug.
     * @param array<string, mixed> $item       Weather item.
     * @return array{name: string, content: string, style: string}|null
     */
    private function resolveIcon(string $collection, string $condition, array $item): ?array
    {
        $timeOfDay = ! isset($item['is_day']) || $item['is_day'] ? 'day' : 'night';

        return $this->iconRegistry->getIconForCondition($collection, $condition, $timeOfDay);
    }
}
