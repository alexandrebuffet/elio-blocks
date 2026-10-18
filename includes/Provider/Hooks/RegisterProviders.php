<?php

namespace ElioBlocks\Provider\Hooks;

use ElioBlocks\Contracts\HookInterface;
use ElioBlocks\Provider\OpenMeteo;
use ElioBlocks\Provider\ProviderRegistry;
use ElioBlocks\WeatherForecast\OpenMeteoWeatherForecastAdapter;

if (! defined('ABSPATH')) {
    die;
}

/**
 * Registers the built-in provider, fires the elio_blocks_init action for
 * third-party registrations, then locks the registry.
 */
class RegisterProviders implements HookInterface
{
    /**
     * Constructor.
     *
     * @param ProviderRegistry                $registry                        Provider registry.
     * @param OpenMeteoWeatherForecastAdapter $openMeteoWeatherForecastAdapter Weather forecast adapter of Open-Meteo.
     */
    public function __construct(
        private ProviderRegistry $registry,
        private OpenMeteoWeatherForecastAdapter $openMeteoWeatherForecastAdapter,
    ) {
    }

    /**
     * {@inheritDoc}
     */
    public function initHooks(): void
    {
        // Priority 20: the built-in provider, on init since its credentials are translated.
        add_action('init', array( $this, 'registerBuiltInProviders' ), 20);

        // Priority 25: allow third-party code to register via elio_blocks_init.
        add_action('init', array( $this, 'firePublicAction' ), 25);

        // Priority 26: lock the registry.
        add_action('init', array( $this, 'lockRegistry' ), 26);
    }

    /**
     * Registers the built-in providers.
     */
    public function registerBuiltInProviders(): void
    {
        $this->registry->register(new OpenMeteo($this->openMeteoWeatherForecastAdapter));
    }

    /**
     * Fires the public action for third-party provider/icon registration.
     */
    public function firePublicAction(): void
    {
        /**
         * Fires once the built-in provider and the "elio" icon collection are
         * registered.
         *
         * Register custom providers and condition icon collections here: the
         * registries are locked right after (init, priority 26). A registration
         * made anywhere else, like any invalid one, is refused with a
         * _doing_it_wrong() notice and false, as register_block_type() does.
         *
         * A provider holds what it serves, one adapter per domain: a
         * WeatherForecastAdapterInterface for the weather forecast.
         *
         *   add_action( 'elio_blocks_init', function() {
         *       elio_blocks_register_provider( new \ElioBlocks\Provider\Provider(
         *           'my-provider',
         *           'My Provider',
         *           array(
         *               new \ElioBlocks\Provider\ProviderCredential( 'api_key', __( 'API Key', 'my-plugin' ), required: true, secret: true ),
         *           ),
         *           new \ElioBlocks\Provider\ProviderAttribution( 'https://my-provider.example/' ),
         *           array( new MyWeatherForecastAdapter() ),
         *       ) );
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
