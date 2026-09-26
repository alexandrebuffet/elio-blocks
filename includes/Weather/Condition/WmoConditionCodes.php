<?php

namespace ElioBlocks\Weather\Condition;

// Exit if called directly.
if (! defined('ABSPATH')) {
    die;
}

/**
 * Maps WMO-style `weather_code` integers to stable plugin slugs.
 *
 * The table matches the subset documented by Open-Meteo for hourly and daily
 * `weather_code` (WMO weather interpretation codes as used with ERA5-style
 * model output). It is not the full set of WMO present-weather codes used in
 * manual or synoptic observations.
 *
 * Use the numeric keys for values returned by providers that follow this
 * convention (e.g. Open-Meteo). Use the string values as stable identifiers
 * for settings, REST schemas, and icon registration.
 *
 * @see https://open-meteo.com/en/docs (section “WMO Weather interpretation codes (WW)”)
 */
final class WmoConditionCodes
{
    /**
     * WMO `weather_code` value => stable condition slug.
     *
     * @var array<int, string>
     */
    private static array $codes = array(
        0  => 'clear-sky',
        1  => 'mainly-clear',
        2  => 'partly-cloudy',
        3  => 'overcast',
        45 => 'fog',
        48 => 'depositing-rime-fog',
        51 => 'light-drizzle',
        53 => 'moderate-drizzle',
        55 => 'dense-drizzle',
        56 => 'light-freezing-drizzle',
        57 => 'dense-freezing-drizzle',
        61 => 'slight-rain',
        63 => 'moderate-rain',
        65 => 'heavy-rain',
        66 => 'light-freezing-rain',
        67 => 'heavy-freezing-rain',
        71 => 'slight-snowfall',
        73 => 'moderate-snowfall',
        75 => 'heavy-snowfall',
        77 => 'snow-grains',
        80 => 'slight-rain-showers',
        81 => 'moderate-rain-showers',
        82 => 'violent-rain-showers',
        85 => 'slight-snow-showers',
        86 => 'heavy-snow-showers',
        95 => 'thunderstorm',
        96 => 'thunderstorm-with-slight-hail',
        99 => 'thunderstorm-with-heavy-hail',
    );

    /**
     * Returns the full code map: WMO `weather_code` integer => stable slug.
     *
     * @return array<int, string>
     */
    public static function getCodes(): array
    {
        return self::$codes;
    }

    /**
     * Returns stable condition slugs in the same order as the internal map.
     *
     * @return list<string>
     */
    public static function getSlugs(): array
    {
        return array_values(self::$codes);
    }

    /**
     * Returns WMO `weather_code` integers in the same order as the internal map.
     *
     * @return list<int>
     */
    public static function getNumericCodes(): array
    {
        return array_keys(self::$codes);
    }
}
