<?php

namespace ElioBlocks\Weather\Geocoding;

use ElioBlocks\Contracts\Cache\CacheInterface;

// Exit if called directly.
if (! defined('ABSPATH')) {
    die;
}

/**
 * Delegates geocoding queries to the configured provider.
 */
class GeocodingService
{
    /**
     * Constructor.
     *
     * @param GeocodingProviderInterface $provider Geocoding provider.
     * @param CacheInterface             $cache    Cache instance.
     */
    public function __construct(
        private GeocodingProviderInterface $provider,
        private CacheInterface $cache,
    ) {
    }

    /**
     * Geocodes a location query.
     *
     * @param string $query Location query (could be a city name, a postal code according to the provider).
     * @param int    $limit Number of results to return.
     * @return list<array{name: string, latitude: float, longitude: float, country: string, admin1: string, provider: string}>
     *         Matching locations, empty when there is none.
     *
     * @throws \RuntimeException If geocoding fails.
     */
    public function geocode(string $query, int $limit): array
    {
        $key    = $this->cache->key('geocoding', $query, (string) $limit);
        $cached = $this->cache->get($key);

        if (is_array($cached)) {
            return array_values($cached);
        }

        $result = $this->provider->geocode($query, $limit);

        // No results is a valid outcome; return empty list.
        if (null === $result) {
            return array();
        }

        $this->cache->set($key, $result, CacheInterface::TTL_FROM_SETTINGS);

        return $result;
    }
}
