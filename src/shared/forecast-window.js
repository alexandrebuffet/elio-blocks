/**
 * Rows a forecast list shows: the next N days, or the next N hours starting at
 * the hour in progress.
 *
 * Shared by the front (weather-report view script) and the editor, and mirrored
 * server-side by ElioBlocks\Interactivity\Blocks\Forecast\ForecastWindow: the
 * server renders the rows, the browser must land on the same ones.
 */

const HOUR_IN_MS = 3600000;

/**
 * Selects the rows a forecast list shows.
 *
 * @param {Object|null} forecast Forecast: meta, current, hourly, daily.
 * @param {string}      type     'daily' or 'hourly'.
 * @param {number}      count    Number of rows.
 * @param {number}      now      Current time in ms. Defaults to Date.now().
 * @return {Array|null} Rows, or null when the forecast has no such section
 *                      (the page only holds the current conditions until the first fetch).
 */
export function selectForecastItems( forecast, type, count, now = Date.now() ) {
	const items = forecast?.[ type ];

	if ( ! Array.isArray( items ) ) {
		return null;
	}

	if ( type !== 'hourly' ) {
		return items.slice( 0, count );
	}

	// Start at the hour in progress. Timestamps carry their UTC offset, so
	// instants are compared: right for a visitor in another timezone,
	// half-hour offsets included.
	const startIndex = items.findIndex(
		( item ) => new Date( item.timestamp ).getTime() + HOUR_IN_MS > now
	);
	const from = startIndex === -1 ? 0 : startIndex;

	return items.slice( from, from + count );
}
