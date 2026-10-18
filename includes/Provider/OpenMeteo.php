<?php

declare(strict_types=1);

namespace ElioBlocks\Provider;

use ElioBlocks\WeatherForecast\OpenMeteoWeatherForecastAdapter;

// Exit if called directly.
if (! defined('ABSPATH')) {
    die;
}

/**
 * Open-Meteo, the built-in provider: free and without a key for non-commercial
 * use, its customer API with one. Each of its APIs Elio asks is an adapter.
 *
 * Built on init: its credentials are translated.
 */
final class OpenMeteo extends Provider
{
    /**
     * Constructor.
     *
     * @param OpenMeteoWeatherForecastAdapter $weatherForecastAdapter Asks its Weather Forecast API.
     */
    public function __construct(OpenMeteoWeatherForecastAdapter $weatherForecastAdapter)
    {
        parent::__construct(
            'open-meteo',
            'Open-Meteo',
            array(
                // Optional: the free access needs none, a commercial subscription comes with one.
                new ProviderCredential(
                    'api_key',
                    __('API Key', 'elio-blocks'),
                    __('Only with an Open-Meteo subscription, required for commercial use: weather data then comes from its customer API. Leave empty for the free, non-commercial access.', 'elio-blocks'),
                    secret: true,
                ),
            ),
            // Its data is licensed under CC BY 4.0, free access and subscriptions alike:
            // https://open-meteo.com/en/licence asks for a credit, a link to it and to the license.
            new ProviderAttribution('https://open-meteo.com/', 'CC BY 4.0', 'https://creativecommons.org/licenses/by/4.0/'),
            array( $weatherForecastAdapter ),
        );
    }
}
