<?php

namespace ElioBlocks\Weather\Geocoding;

// Exit if called directly.
if (! defined('ABSPATH')) {
    die;
}

/**
 * Interface for geocoding API providers.
 */
interface GeocodingProviderInterface
{
    /**
     * Geocodes a location query.
     *
     * @param string $query Location query (could be a city name, a postal code according to the provider).
     * @param int    $limit Number of results to return.
     * @return list<array{name: string, latitude: float, longitude: float, country: string, admin1: string, provider: string}>|null
     *         List of location results, or null if none.
     *
     * @throws \RuntimeException If geocoding fails.
     */
    public function geocode(string $query, int $limit): ?array;
}
