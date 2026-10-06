/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

/**
 * Returns a short duration label: "30m", "1h 30m", "1d".
 *
 * @param {number} seconds Duration in seconds.
 * @return {string} Label.
 */
export function formatDuration( seconds ) {
	const units = [
		/* translators: %d: Number of days. */
		[ 86400, __( '%dd', 'elio-blocks' ) ],
		/* translators: %d: Number of hours. */
		[ 3600, __( '%dh', 'elio-blocks' ) ],
		/* translators: %d: Number of minutes. */
		[ 60, __( '%dm', 'elio-blocks' ) ],
		/* translators: %d: Number of seconds. */
		[ 1, __( '%ds', 'elio-blocks' ) ],
	];
	const parts = [];
	let rest = Math.max( 0, Math.round( seconds ) );

	for ( const [ size, format ] of units ) {
		if ( rest >= size ) {
			parts.push( sprintf( format, Math.floor( rest / size ) ) );
			rest %= size;
		}
	}

	return (
		parts.join( ' ' ) ||
		// translators: %d: Number of seconds.
		sprintf( __( '%ds', 'elio-blocks' ), 0 )
	);
}

/**
 * Tells how often the blocks update in the browser: when the server cache
 * expires, the only time it has newer data, or at the refresh interval when
 * the server keeps no copy.
 *
 * @param {Object} settings Plugin settings, as edited.
 * @return {string} Help text of the auto-refresh toggle.
 */
export function getAutoRefreshHelp( settings ) {
	const {
		elio_blocks_cache_enabled: cacheEnabled,
		elio_blocks_cache_time: cacheTime,
	} = settings;

	if ( ! cacheEnabled ) {
		return __(
			'Update the data shown on the site and in the editor, without reloading the page, at the interval below.',
			'elio-blocks'
		);
	}

	return sprintf(
		/* translators: %s: Cache duration (e.g. "30m"). */
		__(
			'Update the data shown on the site and in the editor, without reloading the page, every %s: when the server cache expires (Cache Duration, in the Advanced section).',
			'elio-blocks'
		),
		formatDuration( cacheTime )
	);
}

/**
 * Tells whether the refresh interval sets the pace of auto-refresh: only when the
 * server keeps no copy. With the cache on, the blocks update when it expires,
 * and the interval only spaces the retries after a failed request.
 *
 * @param {Object} settings Plugin settings, as edited.
 * @return {boolean} True when the settings page should show the interval.
 */
export function isRefreshIntervalUsed( settings ) {
	const {
		elio_blocks_auto_refresh_enabled: autoRefresh,
		elio_blocks_cache_enabled: cacheEnabled,
	} = settings;

	return !! autoRefresh && ! cacheEnabled;
}
