<?php

namespace ElioBlocks\RestApi\Endpoints;

use WP_REST_Controller;
use WP_REST_Request;
use WP_REST_Response;
use ElioBlocks\Provider\Provider;
use ElioBlocks\Settings\PluginSettings;
use ElioBlocks\WeatherForecast\WeatherForecastProviderRegistry;

if (!defined('ABSPATH')) {
    die;
}

/**
 * Handles /elio/v1/weather-forecast/providers requests: the providers that
 * serve the weather forecast, and which one is the site default.
 *
 * The block editor offers them in the Provider select of the report block,
 * the settings page in the select of the default one: anyone who can edit
 * content may list them.
 */
class WeatherForecastProvidersController extends WP_REST_Controller
{
    protected $namespace = 'elio/v1';
    protected $rest_base = 'weather-forecast/providers';

    public function __construct(
        private WeatherForecastProviderRegistry $weatherForecastProviders,
        private PluginSettings $settings,
    ) {
    }

    public function register_routes(): void
    {
        register_rest_route(
            $this->namespace,
            '/' . $this->rest_base,
            [
                [
                    'methods'             => 'GET',
                    'callback'            => [$this, 'get_items'],
                    'permission_callback' => [$this, 'get_items_permissions_check'],
                ],
            ]
        );
    }

    /**
     * Checks whether the request may list the providers.
     *
     * @param WP_REST_Request $request Full details about the request.
     * @return bool
     */
    public function get_items_permissions_check($request)
    {
        return current_user_can('edit_posts');
    }

    /**
     * Lists the providers that serve the weather forecast.
     *
     * @param WP_REST_Request $request Full details about the request.
     * @return WP_REST_Response
     */
    public function get_items($request): WP_REST_Response
    {
        $defaultProvider = $this->settings->getDefaultWeatherForecastProvider();

        return rest_ensure_response(
            array_map(
                static fn(Provider $provider): array => [
                    'slug'      => $provider->slug,
                    'label'     => $provider->label,
                    'isDefault' => $provider->slug === $defaultProvider,
                ],
                $this->weatherForecastProviders->getProviders()
            )
        );
    }
}
