<?php

namespace ElioBlocks\WeatherForecast\Hooks;

use ElioBlocks\Contracts\HookInterface;
use ElioBlocks\WeatherForecast\WeatherForecastProviderRegistry;
use ElioBlocks\WeatherForecast\OpenMeteoWeatherForecastProvider;

if (! defined('ABSPATH')) {
    die;
}

/**
 * Registers the built-in weather forecast provider, fires the elio_blocks_init
 * action for third-party registrations, then locks the registry.
 */
class RegisterWeatherForecastProviders implements HookInterface
{
    /**
     * Constructor.
     *
     * @param WeatherForecastProviderRegistry  $registry          Weather forecast provider registry.
     * @param OpenMeteoWeatherForecastProvider $openMeteoProvider Weather forecast provider of Open-Meteo.
     */
    public function __construct(
        private WeatherForecastProviderRegistry $registry,
        private OpenMeteoWeatherForecastProvider $openMeteoProvider,
    ) {
    }

    /**
     * {@inheritDoc}
     */
    public function initHooks(): void
    {
        // Priority 20: register the built-in weather forecast provider, once its provider is (15).
        add_action('init', array( $this, 'registerBuiltInProviders' ), 20);

        // Priority 25: allow third-party code to register via elio_blocks_init.
        add_action('init', array( $this, 'firePublicAction' ), 25);

        // Priority 26: lock the registry.
        add_action('init', array( $this, 'lockRegistry' ), 26);
    }

    /**
     * Registers the built-in weather forecast provider.
     */
    public function registerBuiltInProviders(): void
    {
        $this->registry->register('open-meteo', $this->openMeteoProvider);
    }

    /**
     * Fires the public action for third-party provider/icon registration.
     */
    public function firePublicAction(): void
    {
        /**
         * Fires once the built-in provider, its weather forecast provider and the
         * "elio" icon collection are registered.
         *
         * Register custom providers, what they serve, and condition icon collections
         * here: the registries are locked right after (init, priority 26). A
         * registration made anywhere else, like any invalid one, is refused with a
         * _doing_it_wrong() notice and false, as register_block_type() does.
         *
         *   add_action( 'elio_blocks_init', function() {
         *       elio_blocks_register_provider( 'my-provider', array(
         *           'label'       => 'My Provider',
         *           'credentials' => array(
         *               'api_key' => array( 'label' => __( 'API Key', 'my-plugin' ), 'required' => true, 'secret' => true ),
         *           ),
         *       ) );
         *       elio_blocks_register_weather_forecast_provider( 'my-provider', new MyWeatherForecastProvider() );
         *
         *       elio_blocks_register_condition_icon_collection( 'my-theme', array(
         *           'label'       => __( 'My Theme', 'my-theme' ),
         *           'description' => __( 'Weather icons drawn for My Theme.', 'my-theme' ),
         *       ) );
         *       elio_blocks_register_condition_icon( 'my-theme/sun', array(
         *           'file_path'  => get_theme_file_path( 'icons/sun.svg' ), // or 'content' => '<svg…>'
         *           'label'      => __( 'Sun', 'my-theme' ),
         *           'style'      => 'stroke', // 'fill' by default
         *           'conditions' => array( array( 'clear-sky', 'day' ), array( 'mainly-clear', 'day' ) ),
         *       ) );
         *   } );
         *
         * @since 0.1.0
         */
        do_action('elio_blocks_init');
    }

    /**
     * Locks the registry to prevent further registrations.
     */
    public function lockRegistry(): void
    {
        $this->registry->build();
    }
}
