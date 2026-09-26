/**
 * WordPress dependencies
 */
import { _x, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	CACHE_DURATION_PRESETS,
	DEFAULT_INTERVAL_PRESETS,
} from '../block-editor/components/interval-control';
import { CONFIG_SETTINGS_DEFAULTS } from './elio-blocks-config';

/**
 * Adds a "Default (…)" mark tooltip to the preset of the default value.
 *
 * @param {Array<{ label: string, value: number }>} presets             Preset list.
 * @param {number}                                  defaultValueSeconds Value that should show a "Default (…)" mark tooltip.
 * @return {Array<{ label: string, value: number, markTooltip?: string }>} Presets, the default one marked.
 */
function addDefaultMarkTooltips( presets, defaultValueSeconds ) {
	return presets.map( ( preset ) => ( {
		...preset,
		markTooltip:
			preset.value === defaultValueSeconds
				? sprintf(
						/* translators: %s: Short duration label (e.g. "15m"). */
						_x( 'Default (%s)', 'duration', 'elio-blocks' ),
						preset.label
					)
				: undefined,
	} ) );
}

// No 0: the toggle turns auto-refresh off, and PluginSettings reads a stored 0 as the default interval.
export const AUTO_REFRESH_INTERVAL_PRESETS = addDefaultMarkTooltips(
	DEFAULT_INTERVAL_PRESETS.filter( ( { value } ) => value > 0 ),
	CONFIG_SETTINGS_DEFAULTS.elio_blocks_refresh_interval
);

export const CACHE_DURATION_INTERVAL_PRESETS = addDefaultMarkTooltips(
	CACHE_DURATION_PRESETS,
	CONFIG_SETTINGS_DEFAULTS.elio_blocks_cache_time
);
