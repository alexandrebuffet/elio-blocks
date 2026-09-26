<?php

namespace ElioBlocks\RestApi\Endpoints;

use WP_Error;
use WP_REST_Controller;
use WP_REST_Request;
use WP_REST_Response;
use ElioBlocks\Settings\PluginSettings;
use ElioBlocks\Weather\Condition\Icons\ConditionIconCollectionResolver;
use ElioBlocks\Weather\Coordinates;
use ElioBlocks\WeatherForecast\Exception\ProviderNotConfigured;
use ElioBlocks\WeatherForecast\Exception\ProviderNotFound;
use ElioBlocks\WeatherForecast\WeatherForecastRequestSigner;
use ElioBlocks\WeatherForecast\WeatherForecastService;

// Exit if called directly.
if (! defined('ABSPATH')) {
    die;
}

/**
 * Handles GET /elio/v1/weather-forecast requests.
 */
class WeatherForecastController extends WP_REST_Controller
{
    /**
     * REST namespace.
     *
     * @var string
     */
    protected $namespace = 'elio/v1';

    /**
     * REST resource name.
     *
     * @var string
     */
    protected $rest_base = 'weather-forecast';

    /**
     * Constructor.
     *
     * @param WeatherForecastService          $weatherForecastService Weather forecast service instance.
     * @param PluginSettings                  $settings               Plugin settings instance.
     * @param WeatherForecastRequestSigner    $signer                 Verifies requests issued by rendered blocks.
     * @param ConditionIconCollectionResolver $iconCollections        Collections a request may ask the icons of.
     */
    public function __construct(
        private WeatherForecastService $weatherForecastService,
        private PluginSettings $settings,
        private WeatherForecastRequestSigner $signer,
        private ConditionIconCollectionResolver $iconCollections,
    ) {
    }

    /**
     * Registers the route.
     */
    public function register_routes(): void
    {
        register_rest_route(
            $this->namespace,
            '/' . $this->rest_base,
            array(
                array(
                    'methods'             => 'GET',
                    'callback'            => array( $this, 'get_items' ),
                    'permission_callback' => array( $this, 'get_items_permissions_check' ),
                    'args'                => $this->get_collection_params(),
                ),
            )
        );
    }

    /**
     * Checks whether the request may read a weather forecast.
     *
     * Editors can query any location (block editor). Anonymous visitors can only
     * replay the request their rendered block was signed for, so the endpoint
     * cannot be used as an open relay to the upstream API.
     *
     * @param WP_REST_Request $request Full details about the request.
     * @return bool
     */
    public function get_items_permissions_check($request)
    {
        if (current_user_can('edit_posts')) {
            return true;
        }

        /**
         * Filters whether the weather forecast endpoint accepts unsigned
         * anonymous requests.
         *
         * Enable it only for headless setups, behind your own rate limiting.
         *
         * @param bool $isPublic Default false.
         */
        if (true === apply_filters('elio_blocks/weather_forecast_public_access', false)) {
            return true;
        }

        $coordinates = Coordinates::tryFrom($request->get_param('latitude'), $request->get_param('longitude'));

        if (null === $coordinates) {
            return false;
        }

        return $this->signer->isValid(
            (string) $request->get_param('signature'),
            $coordinates,
            (string) $request->get_param('provider'),
            (string) $request->get_param('units')
        );
    }

    /**
     * Handles the GET request.
     *
     * @param WP_REST_Request $request Full details about the request.
     * @return WP_REST_Response|WP_Error
     */
    public function get_items($request)
    {
        $coordinates = Coordinates::tryFrom($request->get_param('latitude'), $request->get_param('longitude'));

        if (null === $coordinates) {
            return new WP_Error(
                'elio_blocks_invalid_coordinates',
                __('Invalid coordinates.', 'elio-blocks'),
                array( 'status' => 400 )
            );
        }

        $provider = (string) $request->get_param('provider');
        if ('' === $provider) {
            $provider = $this->settings->getDefaultWeatherForecastProvider();
        }

        // The editor leaves units empty for blocks that follow the site setting.
        $units = (string) $request->get_param('units') ?: $this->settings->getUnitSystem();

        try {
            // Same per-domain unit overrides as the SSR path, so refreshed data matches the first render.
            $data = $this->weatherForecastService->getWeatherForecast(
                $coordinates,
                $provider,
                $units,
                $this->settings->getUnitOverrides(),
                // Registered collections only; the site one when the request names none.
                $this->iconCollections->sanitizeRequested($request->get_param('icon_collections'))
            );
        } catch (ProviderNotFound $e) {
            return new WP_Error(
                'elio_blocks_provider_not_found',
                __('Unknown weather forecast provider.', 'elio-blocks'),
                array( 'status' => 404 )
            );
        } catch (ProviderNotConfigured $e) {
            return new WP_Error(
                'elio_blocks_provider_not_configured',
                __('The weather forecast provider needs credentials: set them in the Providers section of the Elio settings.', 'elio-blocks'),
                array( 'status' => 503 )
            );
        } catch (\Throwable $e) {
            // Providers are an extension point: whatever a third-party one throws is an
            // upstream failure, not a fatal error of the site. The message may expose
            // network details: keep it out of the public response.
            return new WP_Error(
                'elio_blocks_weather_forecast_error',
                __('Unable to fetch weather forecast data.', 'elio-blocks'),
                array( 'status' => 502 )
            );
        }

        return rest_ensure_response($data);
    }

    /**
     * Defines the query parameters for the collection.
     *
     * @return array<string, array<string, mixed>>
     */
    public function get_collection_params(): array
    {
        return array(
            'latitude'         => array(
                'required'          => true,
                'type'              => 'number',
                'minimum'           => -90,
                'maximum'           => 90,
                'sanitize_callback' => static fn($value) => floatval($value),
                'validate_callback' => 'rest_validate_request_arg',
                'description'       => __('Latitude coordinate.', 'elio-blocks'),
            ),
            'longitude'        => array(
                'required'          => true,
                'type'              => 'number',
                'minimum'           => -180,
                'maximum'           => 180,
                'sanitize_callback' => static fn($value) => floatval($value),
                'validate_callback' => 'rest_validate_request_arg',
                'description'       => __('Longitude coordinate.', 'elio-blocks'),
            ),
            'provider'         => array(
                'type'              => 'string',
                'default'           => '',
                'sanitize_callback' => 'sanitize_text_field',
                'description'       => __('Weather data provider slug. Defaults to the site-configured provider.', 'elio-blocks'),
            ),
            'units'            => array(
                'type'              => 'string',
                // Empty: the unit system of the site.
                'default'           => '',
                'enum'              => array( '', 'metric', 'imperial' ),
                'sanitize_callback' => 'sanitize_text_field',
                'validate_callback' => 'rest_validate_request_arg',
                'description'       => __('Unit system for the response.', 'elio-blocks'),
            ),
            'icon_collections' => array(
                'type'        => 'array',
                'items'       => array( 'type' => 'string' ),
                'default'     => array(),
                'description' => __('Icon collections the items name their icon in. Defaults to the collection of the site.', 'elio-blocks'),
            ),
            'signature'        => array(
                'type'              => 'string',
                'default'           => '',
                'sanitize_callback' => 'sanitize_text_field',
                'description'       => __('Signature issued with the rendered block. Required for anonymous requests.', 'elio-blocks'),
            ),
        );
    }
}
