<?php

namespace ElioBlocks\Settings\Hooks;

use ElioBlocks\Contracts\HookInterface;
use ElioBlocks\Settings\PluginSettings;

// Exit if called directly.
if (! defined('ABSPATH')) {
    die;
}

/**
 * Registers plugin settings with WordPress and exposes them via the REST API.
 */
class RegisterGlobalSettings implements HookInterface
{
    /**
     * {@inheritDoc}
     */
    public function initHooks(): void
    {
        add_action('init', array( $this, 'registerSettings' ));
    }

    /**
     * Registers plugin options with WordPress.
     *
     * Setting show_in_rest to true exposes them via /wp-json/wp/v2/settings,
     * which is consumed by the React settings page.
     */
    public function registerSettings(): void
    {
        register_setting(
            'elio_blocks',
            PluginSettings::OPTION_CACHE_ENABLED,
            array(
                'type'              => 'boolean',
                'default'           => PluginSettings::DEFAULT_CACHE_ENABLED,
                'show_in_rest'      => true,
                'sanitize_callback' => 'rest_sanitize_boolean',
            )
        );

        register_setting(
            'elio_blocks',
            PluginSettings::OPTION_CACHE_TIME,
            array(
                'type'              => 'integer',
                'default'           => PluginSettings::DEFAULT_CACHE_TIME_SECONDS,
                'show_in_rest'      => true,
                'sanitize_callback' => 'absint',
            )
        );

        register_setting(
            'elio_blocks',
            PluginSettings::OPTION_CLEANUP_ON_DELETE,
            array(
                'type'              => 'boolean',
                'default'           => PluginSettings::DEFAULT_CLEANUP_ON_DELETE,
                'show_in_rest'      => true,
                'sanitize_callback' => 'rest_sanitize_boolean',
            )
        );

        register_setting(
            'elio_blocks',
            PluginSettings::OPTION_UNIT_SYSTEM,
            array(
                'type'              => 'string',
                'default'           => PluginSettings::DEFAULT_UNIT_SYSTEM_OPTION,
                'show_in_rest'      => true,
                'sanitize_callback' => static function ($value) {
                    $value = is_string($value) ? $value : '';
                    return in_array($value, array( '', 'metric', 'imperial' ), true)
                        ? $value
                        : PluginSettings::DEFAULT_UNIT_SYSTEM_OPTION;
                },
            )
        );

        register_setting(
            'elio_blocks',
            PluginSettings::OPTION_TEMPERATURE_UNIT,
            array(
                'type'              => 'string',
                'default'           => PluginSettings::DEFAULT_UNIT_OVERRIDE,
                'show_in_rest'      => true,
                'sanitize_callback' => static function ($value) {
                    return in_array($value, array( '', 'celsius', 'fahrenheit' ), true)
                        ? $value
                        : PluginSettings::DEFAULT_UNIT_OVERRIDE;
                },
            )
        );

        register_setting(
            'elio_blocks',
            PluginSettings::OPTION_WIND_UNIT,
            array(
                'type'              => 'string',
                'default'           => PluginSettings::DEFAULT_UNIT_OVERRIDE,
                'show_in_rest'      => true,
                'sanitize_callback' => static function ($value) {
                    return in_array($value, array( '', 'kmh', 'mph', 'ms', 'knots', 'beaufort' ), true)
                        ? $value
                        : PluginSettings::DEFAULT_UNIT_OVERRIDE;
                },
            )
        );

        register_setting(
            'elio_blocks',
            PluginSettings::OPTION_PRECIPITATION_UNIT,
            array(
                'type'              => 'string',
                'default'           => PluginSettings::DEFAULT_UNIT_OVERRIDE,
                'show_in_rest'      => true,
                'sanitize_callback' => static function ($value) {
                    return in_array($value, array( '', 'mm', 'in' ), true)
                        ? $value
                        : PluginSettings::DEFAULT_UNIT_OVERRIDE;
                },
            )
        );

        register_setting(
            'elio_blocks',
            PluginSettings::OPTION_PRESSURE_UNIT,
            array(
                'type'              => 'string',
                'default'           => PluginSettings::DEFAULT_UNIT_OVERRIDE,
                'show_in_rest'      => true,
                'sanitize_callback' => static function ($value) {
                    return in_array($value, array( '', 'hpa', 'inhg', 'mbar' ), true)
                        ? $value
                        : PluginSettings::DEFAULT_UNIT_OVERRIDE;
                },
            )
        );

        register_setting(
            'elio_blocks',
            PluginSettings::OPTION_DISTANCE_UNIT,
            array(
                'type'              => 'string',
                'default'           => PluginSettings::DEFAULT_UNIT_OVERRIDE,
                'show_in_rest'      => true,
                'sanitize_callback' => static function ($value) {
                    return in_array($value, array( '', 'km', 'mi', 'm' ), true)
                        ? $value
                        : PluginSettings::DEFAULT_UNIT_OVERRIDE;
                },
            )
        );

        register_setting(
            'elio_blocks',
            PluginSettings::OPTION_AUTO_REFRESH_ENABLED,
            array(
                'type'              => 'boolean',
                'default'           => PluginSettings::DEFAULT_AUTO_REFRESH_ENABLED,
                'show_in_rest'      => true,
                'sanitize_callback' => 'rest_sanitize_boolean',
            )
        );

        register_setting(
            'elio_blocks',
            PluginSettings::OPTION_REFRESH_INTERVAL,
            array(
                'type'              => 'integer',
                'default'           => PluginSettings::DEFAULT_REFRESH_INTERVAL_SECONDS,
                'show_in_rest'      => true,
                'sanitize_callback' => 'absint',
            )
        );

        register_setting(
            'elio_blocks',
            PluginSettings::OPTION_WEATHER_FORECAST_PROVIDER,
            array(
                'type'              => 'string',
                'default'           => PluginSettings::DEFAULT_WEATHER_FORECAST_PROVIDER,
                'show_in_rest'      => true,
                'sanitize_callback' => 'sanitize_text_field',
            )
        );

        register_setting(
            'elio_blocks',
            PluginSettings::OPTION_CONDITION_ICON_COLLECTION,
            array(
                'type'              => 'string',
                'default'           => PluginSettings::DEFAULT_CONDITION_ICON_COLLECTION,
                'show_in_rest'      => true,
                'sanitize_callback' => 'sanitize_key',
            )
        );
    }
}
