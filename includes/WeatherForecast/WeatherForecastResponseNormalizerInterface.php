<?php

namespace ElioBlocks\WeatherForecast;

if (! defined('ABSPATH')) {
    die;
}

/**
 * Contract for normalizing a raw provider API response into the plugin's standard format.
 *
 * Implementations are responsible for:
 * - Mapping provider-native fields to the standard field names.
 * - Mapping provider-native condition codes to WMO condition codes (integers).
 * - Returning the 'meta' envelope with location/provider/units.
 */
interface WeatherForecastResponseNormalizerInterface
{
    /**
     * Normalizes a raw provider response into the plugin's standard array structure.
     *
     * @param array<string, mixed> $rawResponse Raw decoded JSON from the provider.
     * @param string               $units       Unit system used for the request ('metric'|'imperial').
     * @return array<string, mixed> Normalized weather forecast data.
     */
    public function normalize(array $rawResponse, string $units): array;
}
