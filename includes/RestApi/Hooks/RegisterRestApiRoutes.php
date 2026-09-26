<?php

namespace ElioBlocks\RestApi\Hooks;

use ElioBlocks\Contracts\HookInterface;
use ElioBlocks\RestApi\Endpoints\WeatherForecastController;
use ElioBlocks\RestApi\Endpoints\ConditionIconCollectionsController;
use ElioBlocks\RestApi\Endpoints\GeocodingController;
use ElioBlocks\RestApi\Endpoints\ProvidersController;
use ElioBlocks\RestApi\Endpoints\WeatherForecastProvidersController;

// Exit if called directly.
if (! defined('ABSPATH')) {
    die;
}

/**
 * Registers REST API routes for weather forecast, geocoding, condition icon
 * collections and providers.
 */
class RegisterRestApiRoutes implements HookInterface
{
    /**
     * Constructor.
     *
     * @param WeatherForecastController          $weatherForecast          Weather forecast REST controller.
     * @param ConditionIconCollectionsController $iconCollections          Condition icon collections REST controller.
     * @param GeocodingController                $geocoding                Geocoding REST controller.
     * @param ProvidersController                $providers                Providers REST controller.
     * @param WeatherForecastProvidersController $weatherForecastProviders Weather forecast providers REST controller.
     */
    public function __construct(
        private WeatherForecastController $weatherForecast,
        private ConditionIconCollectionsController $iconCollections,
        private GeocodingController $geocoding,
        private ProvidersController $providers,
        private WeatherForecastProvidersController $weatherForecastProviders,
    ) {
    }

    /**
     * {@inheritDoc}
     */
    public function initHooks(): void
    {
        add_action('rest_api_init', array( $this, 'registerRestApiRoutes' ));
    }

    /**
     * Registers REST API routes.
     */
    public function registerRestApiRoutes(): void
    {
        $this->weatherForecast->register_routes();
        $this->iconCollections->register_routes();
        $this->geocoding->register_routes();
        $this->providers->register_routes();
        $this->weatherForecastProviders->register_routes();
    }
}
