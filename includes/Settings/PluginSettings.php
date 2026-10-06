<?php

namespace ElioBlocks\Settings;

use ElioBlocks\Provider\Provider;

// Exit if called directly.
if (! defined('ABSPATH')) {
    die;
}

/**
 * Reads global settings stored as WordPress options.
 */
class PluginSettings
{
    /**
     * Options names.
     */
    public const OPTION_CACHE_ENABLED             = 'elio_blocks_cache_enabled';
    public const OPTION_CACHE_TIME                = 'elio_blocks_cache_time';
    public const OPTION_CLEANUP_ON_DELETE         = 'elio_blocks_cleanup_on_delete';
    public const OPTION_UNIT_SYSTEM               = 'elio_blocks_unit_system';
    public const OPTION_TEMPERATURE_UNIT          = 'elio_blocks_unit_temperature';
    public const OPTION_WIND_UNIT                 = 'elio_blocks_unit_wind';
    public const OPTION_PRECIPITATION_UNIT        = 'elio_blocks_unit_precipitation';
    public const OPTION_PRESSURE_UNIT             = 'elio_blocks_unit_pressure';
    public const OPTION_DISTANCE_UNIT             = 'elio_blocks_unit_distance';
    public const OPTION_AUTO_REFRESH_ENABLED      = 'elio_blocks_auto_refresh_enabled';
    public const OPTION_REFRESH_INTERVAL          = 'elio_blocks_refresh_interval';
    public const OPTION_WEATHER_FORECAST_PROVIDER = 'elio_blocks_weather_forecast_provider';
    public const OPTION_PROVIDER_CREDENTIALS      = 'elio_blocks_provider_credentials';
    public const OPTION_CONDITION_ICON_COLLECTION = 'elio_blocks_condition_icon_collection';

    /**
     * Default values (must match register_setting and REST schema defaults).
     */
    public const DEFAULT_CACHE_ENABLED = true;

    public const DEFAULT_CACHE_TIME_SECONDS = 1800;

    public const DEFAULT_CLEANUP_ON_DELETE = true;

    /**
     * Effective unit system for API and display when the setting is empty or invalid.
     */
    public const DEFAULT_UNIT_SYSTEM = 'metric';

    /**
     * Stored settings value meaning "use DEFAULT_UNIT_SYSTEM" (matches admin Default (%s) option).
     */
    public const DEFAULT_UNIT_SYSTEM_OPTION = '';

    /**
     * Empty string means "use preset from unit system" for per-domain overrides.
     */
    public const DEFAULT_UNIT_OVERRIDE = '';

    public const DEFAULT_AUTO_REFRESH_ENABLED = true;

    /**
     * Default browser auto-refresh interval in seconds (15 minutes).
     */
    public const DEFAULT_REFRESH_INTERVAL_SECONDS = 900;

    public const DEFAULT_WEATHER_FORECAST_PROVIDER = 'open-meteo';

    /**
     * Slug of the icon collection the blocks show when neither the report nor the block picks one.
     */
    public const DEFAULT_CONDITION_ICON_COLLECTION = 'elio';

    /**
     * Returns the bootstrap payload for admin settings JS (`window.elioBlocksConfig`).
     * Extend with new top-level keys (e.g. `rest`, `assets`) as needed.
     *
     * @return array<string, mixed>
     */
    public static function getElioBlocksConfigForSettingsScript(): array
    {
        return array(
            'settings' => array(
                'defaults' => self::getPluginConfigDefaultsForScript(),
            ),
        );
    }

    /**
     * Returns the default option values for settings UI. Keys match REST / `register_setting` names.
     *
     * @return array<string, bool|int|string>
     */
    private static function getPluginConfigDefaultsForScript(): array
    {
        return array(
            self::OPTION_CACHE_ENABLED             => self::DEFAULT_CACHE_ENABLED,
            self::OPTION_CACHE_TIME                => self::DEFAULT_CACHE_TIME_SECONDS,
            self::OPTION_CLEANUP_ON_DELETE         => self::DEFAULT_CLEANUP_ON_DELETE,
            self::OPTION_UNIT_SYSTEM               => self::DEFAULT_UNIT_SYSTEM_OPTION,
            self::OPTION_TEMPERATURE_UNIT          => self::DEFAULT_UNIT_OVERRIDE,
            self::OPTION_WIND_UNIT                 => self::DEFAULT_UNIT_OVERRIDE,
            self::OPTION_PRECIPITATION_UNIT        => self::DEFAULT_UNIT_OVERRIDE,
            self::OPTION_PRESSURE_UNIT             => self::DEFAULT_UNIT_OVERRIDE,
            self::OPTION_DISTANCE_UNIT             => self::DEFAULT_UNIT_OVERRIDE,
            self::OPTION_AUTO_REFRESH_ENABLED      => self::DEFAULT_AUTO_REFRESH_ENABLED,
            self::OPTION_REFRESH_INTERVAL          => self::DEFAULT_REFRESH_INTERVAL_SECONDS,
            self::OPTION_WEATHER_FORECAST_PROVIDER => self::DEFAULT_WEATHER_FORECAST_PROVIDER,
            self::OPTION_CONDITION_ICON_COLLECTION => self::DEFAULT_CONDITION_ICON_COLLECTION,
        );
    }

    /**
     * Retrieves whether the transient cache is enabled.
     */
    public function isCacheEnabled(): bool
    {
        return (bool) get_option(self::OPTION_CACHE_ENABLED, self::DEFAULT_CACHE_ENABLED);
    }

    /**
     * Retrieves the cache TTL in seconds.
     */
    public function getCacheTime(): int
    {
        return (int) get_option(self::OPTION_CACHE_TIME, self::DEFAULT_CACHE_TIME_SECONDS);
    }

    /**
     * Retrieves whether to delete options and transients on plugin deletion.
     */
    public function isCleanupOnDeleteEnabled(): bool
    {
        return (bool) get_option(self::OPTION_CLEANUP_ON_DELETE, self::DEFAULT_CLEANUP_ON_DELETE);
    }

    /**
     * Retrieves the unit system ('metric' or 'imperial').
     *
     * Empty or invalid stored values resolve to DEFAULT_UNIT_SYSTEM.
     */
    public function getUnitSystem(): string
    {
        $raw   = get_option(self::OPTION_UNIT_SYSTEM, self::DEFAULT_UNIT_SYSTEM_OPTION);
        $value = is_string($raw) ? $raw : '';
        if ($value === '' || ! in_array($value, array( 'metric', 'imperial' ), true)) {
            return self::DEFAULT_UNIT_SYSTEM;
        }
        return $value;
    }

    /**
     * Retrieves the temperature unit override ('celsius', 'fahrenheit', or '' for preset).
     */
    public function getTemperatureUnit(): string
    {
        return (string) get_option(self::OPTION_TEMPERATURE_UNIT, self::DEFAULT_UNIT_OVERRIDE);
    }

    /**
     * Retrieves the wind unit override ('kmh', 'mph', 'ms', 'knots', 'beaufort', or '' for preset).
     */
    public function getWindUnit(): string
    {
        return (string) get_option(self::OPTION_WIND_UNIT, self::DEFAULT_UNIT_OVERRIDE);
    }

    /**
     * Retrieves the precipitation unit override ('mm', 'in', or '' for preset).
     */
    public function getPrecipitationUnit(): string
    {
        return (string) get_option(self::OPTION_PRECIPITATION_UNIT, self::DEFAULT_UNIT_OVERRIDE);
    }

    /**
     * Retrieves the pressure unit override ('hpa', 'inhg', 'mbar', or '' for preset).
     */
    public function getPressureUnit(): string
    {
        return (string) get_option(self::OPTION_PRESSURE_UNIT, self::DEFAULT_UNIT_OVERRIDE);
    }

    /**
     * Retrieves the distance unit override ('km', 'mi', 'm', or '' for system default).
     */
    public function getDistanceUnit(): string
    {
        return (string) get_option(self::OPTION_DISTANCE_UNIT, self::DEFAULT_UNIT_OVERRIDE);
    }

    /**
     * Retrieves every per-domain unit override. An empty string means "follow the unit system".
     *
     * @return array{temperature: string, wind: string, precipitation: string, pressure: string, distance: string}
     */
    public function getUnitOverrides(): array
    {
        return array(
            'temperature'   => $this->getTemperatureUnit(),
            'wind'          => $this->getWindUnit(),
            'precipitation' => $this->getPrecipitationUnit(),
            'pressure'      => $this->getPressureUnit(),
            'distance'      => $this->getDistanceUnit(),
        );
    }

    /**
     * Retrieves whether browser auto-refresh is enabled.
     */
    public function isAutoRefreshEnabled(): bool
    {
        return (bool) get_option(self::OPTION_AUTO_REFRESH_ENABLED, self::DEFAULT_AUTO_REFRESH_ENABLED);
    }

    /**
     * Retrieves the stored auto-refresh interval in seconds (preset "Off" is 0).
     */
    public function getRefreshInterval(): int
    {
        return (int) get_option(self::OPTION_REFRESH_INTERVAL, self::DEFAULT_REFRESH_INTERVAL_SECONDS);
    }

    /**
     * Resolves the interval passed to the Interactivity store: disabled when the toggle is off;
     * when on, 0 in storage is treated as the default interval.
     *
     * The browser waits for it only without a server copy ahead (cache off, failed request):
     * with the cache on, blocks refresh when the cache expires.
     */
    public function getEffectiveRefreshIntervalSeconds(): int
    {
        if (! $this->isAutoRefreshEnabled()) {
            return 0;
        }

        $seconds = $this->getRefreshInterval();

        return $seconds > 0 ? $seconds : self::DEFAULT_REFRESH_INTERVAL_SECONDS;
    }

    /**
     * Returns what the browser refreshes a weather forecast by, in milliseconds
     * (getRefreshTime() in src/shared/refresh.js): on the front and in the
     * editor alike, so both show the same one.
     *
     * @return array{dataTtl: int, refreshInterval: int} Cache duration (0 with
     *                                                   the cache off) and refresh
     *                                                   interval (0 with auto-refresh off).
     */
    public function getRefreshSettings(): array
    {
        return array(
            'dataTtl'         => $this->isCacheEnabled() ? $this->getCacheTime() * 1000 : 0,
            'refreshInterval' => $this->getEffectiveRefreshIntervalSeconds() * 1000,
        );
    }

    /**
     * Retrieves the slug of the default weather forecast provider.
     * Falls back to the built-in default if not configured.
     *
     * @return string
     */
    public function getDefaultWeatherForecastProvider(): string
    {
        $value = (string) get_option(self::OPTION_WEATHER_FORECAST_PROVIDER, self::DEFAULT_WEATHER_FORECAST_PROVIDER);
        return '' !== $value ? $value : self::DEFAULT_WEATHER_FORECAST_PROVIDER;
    }

    /**
     * Retrieves the slug of the icon collection of the site. Falls back to the
     * plugin one when unset; whether it is registered is the resolver's business.
     */
    public function getConditionIconCollection(): string
    {
        $value = (string) get_option(self::OPTION_CONDITION_ICON_COLLECTION, self::DEFAULT_CONDITION_ICON_COLLECTION);

        return '' !== $value ? $value : self::DEFAULT_CONDITION_ICON_COLLECTION;
    }

    /**
     * Returns every option the plugin stores, for cleanup on uninstall.
     *
     * @return list<string>
     */
    public static function optionNames(): array
    {
        return array_merge(
            array_keys(self::getPluginConfigDefaultsForScript()),
            array( self::OPTION_PROVIDER_CREDENTIALS )
        );
    }

    /**
     * Returns the constant a credential can be set with in wp-config.php:
     * ELIO_BLOCKS_{SLUG}_{NAME}, uppercased, hyphens of the slug as underscores
     * (ELIO_BLOCKS_OPEN_METEO_API_KEY).
     *
     * @param string $slug Provider slug.
     * @param string $name Credential name.
     * @return string
     */
    public static function getProviderCredentialConstant(string $slug, string $name): string
    {
        return strtoupper('ELIO_BLOCKS_' . str_replace('-', '_', $slug) . '_' . $name);
    }

    /**
     * Checks whether a credential is set in wp-config.php: the settings page then
     * shows it cannot be changed there.
     *
     * @param string $slug Provider slug.
     * @param string $name Credential name.
     * @return bool
     */
    public function isProviderCredentialDefinedInConfig(string $slug, string $name): bool
    {
        $constantName = self::getProviderCredentialConstant($slug, $name);

        return defined($constantName) && '' !== (string) constant($constantName);
    }

    /**
     * Retrieves a credential of a provider, or null when it is not set.
     *
     * Priority:
     *   1. wp-config constant (getProviderCredentialConstant()). Recommended in
     *      production: the value stays out of the database.
     *   2. Value saved from the settings page.
     *
     * @param string $slug Provider slug.
     * @param string $name Credential name.
     * @return string|null
     */
    public function getProviderCredential(string $slug, string $name): ?string
    {
        if ($this->isProviderCredentialDefinedInConfig($slug, $name)) {
            return (string) constant(self::getProviderCredentialConstant($slug, $name));
        }

        $value = $this->getStoredProviderCredentials()[ $slug ][ $name ] ?? '';

        return '' !== $value ? $value : null;
    }

    /**
     * Retrieves the credentials of a provider that are set, by name: what it declared
     * only, never what another provider stored.
     *
     * @param Provider $provider Provider.
     * @return array<string, string>
     */
    public function getProviderCredentials(Provider $provider): array
    {
        $values = array();

        foreach (array_keys($provider->credentials) as $name) {
            $value = $this->getProviderCredential($provider->slug, $name);
            if (null !== $value) {
                $values[ $name ] = $value;
            }
        }

        return $values;
    }

    /**
     * Saves credentials of a provider, keeping the ones not given: an empty
     * value forgets the saved one.
     *
     * @param string                $slug   Provider slug.
     * @param array<string, string> $values Values by credential name.
     */
    public function setProviderCredentials(string $slug, array $values): void
    {
        $stored   = $this->getStoredProviderCredentials();
        $provider = $stored[ $slug ] ?? array();

        foreach ($values as $name => $value) {
            if ('' === $value) {
                unset($provider[ $name ]);
            } else {
                $provider[ $name ] = $value;
            }
        }

        if (array() === $provider) {
            unset($stored[ $slug ]);
        } else {
            $stored[ $slug ] = $provider;
        }

        // Not autoloaded: only read when a provider fetches data, and by the settings page.
        update_option(self::OPTION_PROVIDER_CREDENTIALS, $stored, false);
    }

    /**
     * Retrieves the credentials saved from the settings page, by provider slug then name.
     *
     * @return array<string, array<string, string>>
     */
    private function getStoredProviderCredentials(): array
    {
        $stored = get_option(self::OPTION_PROVIDER_CREDENTIALS, array());
        if (! is_array($stored)) {
            return array();
        }

        $credentials = array();
        foreach ($stored as $slug => $values) {
            if (is_array($values)) {
                $credentials[ (string) $slug ] = array_map('strval', $values);
            }
        }

        return $credentials;
    }
}
