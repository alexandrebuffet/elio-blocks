<?php

namespace ElioBlocks\WeatherForecast;

use ElioBlocks\Contracts\Http\HttpClientInterface;
use ElioBlocks\WeatherForecast\Exception\InvalidProviderResponse;
use ElioBlocks\WeatherForecast\Exception\ProviderUnavailable;

// Exit if called directly.
if (! defined('ABSPATH')) {
    die;
}

/**
 * Fetches weather forecast data from the Open-Meteo API.
 */
class OpenMeteoWeatherForecastProvider implements WeatherForecastProviderInterface
{
    private const API_URL = 'https://api.open-meteo.com/v1/forecast';

    /**
     * Endpoint of the commercial subscriptions: same parameters and answer,
     * plus the apikey parameter.
     */
    private const CUSTOMER_API_URL = 'https://customer-api.open-meteo.com/v1/forecast';

    /**
     * Current weather variables to request.
     */
    private const CURRENT_VARS = array(
        'temperature_2m',
        'relative_humidity_2m',
        'apparent_temperature',
        'is_day',
        'precipitation',
        'weather_code',
        'cloud_cover',
        'pressure_msl',
        'wind_speed_10m',
        'wind_direction_10m',
        'wind_gusts_10m',
        'uv_index',
    );

    /**
     * Hourly weather variables to request.
     */
    private const HOURLY_VARS = array(
        'temperature_2m',
        'relative_humidity_2m',
        'apparent_temperature',
        'precipitation_probability',
        'precipitation',
        'weather_code',
        'cloud_cover',
        'pressure_msl',
        'wind_speed_10m',
        'wind_direction_10m',
        'uv_index',
        'is_day',
    );

    /**
     * Daily weather variables to request.
     */
    private const DAILY_VARS = array(
        'weather_code',
        'temperature_2m_max',
        'temperature_2m_min',
        'apparent_temperature_max',
        'apparent_temperature_min',
        'sunrise',
        'sunset',
        'uv_index_max',
        'precipitation_sum',
        'precipitation_probability_max',
        'wind_speed_10m_max',
        'wind_gusts_10m_max',
        'wind_direction_10m_dominant',
    );

    /**
     * Constructor.
     *
     * @param HttpClientInterface                        $httpClient HTTP client instance.
     * @param WeatherForecastResponseNormalizerInterface $normalizer Response normalizer.
     */
    public function __construct(
        private HttpClientInterface $httpClient,
        private WeatherForecastResponseNormalizerInterface $normalizer,
    ) {
    }

    /**
     * {@inheritDoc}
     *
     * The free access needs no API key. With the key of a subscription
     * ($args['credentials']['api_key']), the customer API is asked instead.
     */
    public function fetch(float $latitude, float $longitude, string $units, array $args = array()): array
    {
        $query = array(
            'latitude'      => $latitude,
            'longitude'     => $longitude,
            'current'       => implode(',', self::CURRENT_VARS),
            'hourly'        => implode(',', self::HOURLY_VARS),
            'daily'         => implode(',', self::DAILY_VARS),
            'timezone'      => 'auto',
            'forecast_days' => 7,
        );

        if ('imperial' === $units) {
            $query['temperature_unit']   = 'fahrenheit';
            $query['wind_speed_unit']    = 'mph';
            $query['precipitation_unit'] = 'inch';
        }

        $apiKey = $args['credentials']['api_key'] ?? '';
        if ('' !== $apiKey) {
            $query['apikey'] = $apiKey;
        }

        $url = ( '' !== $apiKey ? self::CUSTOMER_API_URL : self::API_URL ) . '?' . http_build_query($query);

        try {
            $response = $this->httpClient->get($url, array( 'timeout' => 10 ));
        } catch (\RuntimeException $e) {
            // The cause goes into the message, escaped, rather than chained: an exception passed
            // on as is cannot be escaped. Callers keep the message out of responses and pages.
            throw new ProviderUnavailable(
                sprintf('Open-Meteo API could not be reached: %s', esc_html($e->getMessage()))
            );
        }

        if (200 !== $response->getStatusCode()) {
            throw new ProviderUnavailable(
                sprintf('Open-Meteo API returned HTTP %d.', (int) $response->getStatusCode())
            );
        }

        $body = json_decode($response->getBody(), true);

        if (! is_array($body)) {
            throw new InvalidProviderResponse('Invalid JSON from Open-Meteo API.');
        }

        return $this->normalizer->normalize($body, $units);
    }
}
