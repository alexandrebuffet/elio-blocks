<?php

namespace ElioBlocks\Weather\Geocoding;

use RuntimeException;
use ElioBlocks\Contracts\Http\HttpClientInterface;

// Exit if called directly.
if (! defined('ABSPATH')) {
    die;
}

/**
 * Geocodes location name using the Open-Meteo Geocoding API.
 */
class OpenMeteoGeocodingProvider implements GeocodingProviderInterface
{
    private const API_URL = 'https://geocoding-api.open-meteo.com/v1/search';

    /**
     * Constructor.
     *
     * @param HttpClientInterface $httpClient HTTP client instance.
     */
    public function __construct(private HttpClientInterface $httpClient)
    {
    }

    /**
     * {@inheritDoc}
     */
    public function geocode(string $query, int $limit): ?array
    {
        $url = self::API_URL . '?' . http_build_query(
            array(
                'name'  => $query,
                'limit' => $limit,
            )
        );

        $response = $this->httpClient->get($url, array( 'timeout' => 10 ));

        if (200 !== $response->getStatusCode()) {
            throw new RuntimeException(
                sprintf('Open-Meteo Geocoding API returned HTTP %d.', (int) $response->getStatusCode())
            );
        }

        $body = json_decode($response->getBody(), true);

        if (! is_array($body) || empty($body['results'])) {
            return null;
        }

        $results = array_slice($body['results'], 0, $limit);
        $result  = array();

        foreach ($results as $location) {
            $result[] = array(
                'name'      => $location['name'] ?? '',
                'latitude'  => $location['latitude'] ?? '',
                'longitude' => $location['longitude'] ?? '',
                'country'   => $location['country'] ?? '',
                'admin1'    => $location['admin1'] ?? '',
                'provider'  => 'open-meteo',
            );
        }

        return $result;
    }
}
