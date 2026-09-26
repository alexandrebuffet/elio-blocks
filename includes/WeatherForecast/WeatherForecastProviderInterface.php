<?php

namespace ElioBlocks\WeatherForecast;

if (! defined('ABSPATH')) {
    die;
}

/**
 * How a provider serves the weather forecast.
 *
 * Registered for a provider (elio_blocks_register_provider()) with
 * elio_blocks_register_weather_forecast_provider(): the provider holds the
 * name and the credentials, this fetches its weather forecast.
 */
interface WeatherForecastProviderInterface
{
    /**
     * Fetches weather forecast data for the given coordinates.
     *
     * $args holds:
     * - 'credentials' (array<string, string>): the credentials the provider
     *   declared (elio_blocks_register_provider()) that are set, by name; one
     *   not set is absent. Each comes from its ELIO_BLOCKS_{SLUG}_{NAME}
     *   constant (wp-config.php, uppercased, hyphens as underscores) when
     *   defined, else from the settings page. When a required one is not set,
     *   fetch() is not called.
     *
     * @param float                $latitude  Latitude.
     * @param float                $longitude Longitude.
     * @param string               $units     Unit system ('metric'|'imperial').
     * @param array<string, mixed> $args      Request arguments, see above.
     * @return array<string, mixed> Normalized weather forecast data.
     *
     * @throws \ElioBlocks\WeatherForecast\Exception\ProviderUnavailable     Network failure, timeout, HTTP error.
     * @throws \ElioBlocks\WeatherForecast\Exception\InvalidProviderResponse The answer is not a weather forecast.
     */
    public function fetch(float $latitude, float $longitude, string $units, array $args = array()): array;
}
