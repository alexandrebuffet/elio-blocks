<?php

namespace ElioBlocks\WeatherForecast\Hooks;

use ElioBlocks\Contracts\HookInterface;
use ElioBlocks\WeatherForecast\WeatherForecastAdapterRegistry;
use ElioBlocks\WeatherForecast\OpenMeteoWeatherForecastAdapter;

if (! defined('ABSPATH')) {
    die;
}

/**
 * Registers the built-in weather forecast adapter, fires the elio_blocks_init
 * action for third-party registrations, then locks the registry.
 */
class RegisterWeatherForecastAdapters implements HookInterface
{
    /**
     * Constructor.
     *
     * @param WeatherForecastAdapterRegistry  $registry         Weather forecast adapter registry.
     * @param OpenMeteoWeatherForecastAdapter $openMeteoAdapter Weather forecast adapter of Open-Meteo.
     */
    public function __construct(
        private WeatherForecastAdapterRegistry $registry,
        private OpenMeteoWeatherForecastAdapter $openMeteoAdapter,
    ) {
    }

    /**
     * {@inheritDoc}
     */
    public function initHooks(): void
    {
        // Priority 20: register the built-in weather forecast adapter, once its provider is (15).
        add_action('init', array( $this, 'registerBuiltInAdapters' ), 20);

        // Priority 25: allow third-party code to register via elio_blocks_init.
        add_action('init', array( $this, 'firePublicAction' ), 25);

        // Priority 26: lock the registry.
        add_action('init', array( $this, 'lockRegistry' ), 26);
    }

    /**
     * Registers the built-in weather forecast adapter.
     */
    public function registerBuiltInAdapters(): void
    {
        $this->registry->register('open-meteo', $this->openMeteoAdapter);
    }

    /**
     * Fires the public action for third-party provider/icon registration.
     */
    public function firePublicAction(): void
    {
        /**
         * Fires once the built-in provider, its weather forecast adapter and the
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
         *       elio_blocks_register_weather_forecast_adapter( 'my-provider', new MyWeatherForecastAdapter() );
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
