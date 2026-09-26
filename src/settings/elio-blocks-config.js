/**
 * Reads `window.elioBlocksConfig` injected before this bundle (`wp_add_inline_script`).
 * Shape is defined by `PluginSettings::getElioBlocksConfigForSettingsScript()`; extend
 * the PHP array with new top-level keys as the admin UI grows (e.g. `rest`, `nonce`).
 */

/**
 * Fallback when `settings.defaults` is not injected (tests, wrong context).
 * Keep in sync with `PluginSettings::getPluginConfigDefaultsForScript()` in PHP (`elio_blocks_unit_system` is '' for « Default » in admin).
 */
const CONFIG_SETTINGS_DEFAULTS_FALLBACK = {
	elio_blocks_cache_enabled: true,
	elio_blocks_cache_time: 1800,
	elio_blocks_cleanup_on_delete: true,
	elio_blocks_unit_system: '',
	elio_blocks_unit_temperature: '',
	elio_blocks_unit_wind: '',
	elio_blocks_unit_precipitation: '',
	elio_blocks_unit_pressure: '',
	elio_blocks_unit_distance: '',
	elio_blocks_auto_refresh_enabled: true,
	elio_blocks_refresh_interval: 900,
	elio_blocks_weather_forecast_provider: 'open-meteo',
	elio_blocks_condition_icon_collection: 'elio',
};

/**
 * Returns the full bootstrap object from PHP. Empty plain object when not injected (e.g. wrong context).
 *
 * @return {Record<string, unknown>} The injected bootstrap object, or an empty object.
 */
export function getElioBlocksConfig() {
	if (
		typeof window !== 'undefined' &&
		window.elioBlocksConfig &&
		typeof window.elioBlocksConfig === 'object'
	) {
		return window.elioBlocksConfig;
	}
	return {};
}

/**
 * Returns the `config.settings.defaults` slice — registered option defaults for the settings screen.
 * Merges injected defaults over PHP-aligned fallbacks so missing injection still yields valid UI defaults.
 *
 * @return {Record<string, unknown>} Option defaults for the settings UI.
 */
export function getConfigSettingsDefaults() {
	const injected = getElioBlocksConfig().settings?.defaults;
	if ( injected && typeof injected === 'object' ) {
		return { ...CONFIG_SETTINGS_DEFAULTS_FALLBACK, ...injected };
	}
	return { ...CONFIG_SETTINGS_DEFAULTS_FALLBACK };
}

/** Snapshot at module load; in admin, matches the injected `elioBlocksConfig` plus fallbacks. */
export const CONFIG_SETTINGS_DEFAULTS = getConfigSettingsDefaults();
