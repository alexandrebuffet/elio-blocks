/**
 * Rows a forecast list shows: the next N days or hours, starting at the day or
 * the hour in progress.
 *
 * Shared by the front (weather-report view script) and the editor, and mirrored
 * server-side by ElioBlocks\Interactivity\Blocks\Forecast\ForecastWindow: the
 * server renders the rows, the browser must land on the same ones.
 */

/**
 * How long an item lasts when no item follows it.
 */
const PERIOD_IN_MS = { hourly: 3600000, daily: 86400000 };

/**
 * Returns when the hour or the day of a forecast item ends: when the next item
 * starts (a day of a change of daylight saving time lasts 23 or 25 hours),
 * else one hour or one day after its own start.
 *
 * Timestamps carry their UTC offset, so instants are compared: no timezone of
 * the visitor gets in the way, half-hour offsets included.
 *
 * @param {Array}  items Items of a forecast section, or rows of a list.
 * @param {number} index Index of the item.
 * @param {string} type  'daily' or 'hourly'.
 * @return {number} Milliseconds since the epoch, NaN without a valid timestamp.
 */
export function getForecastItemEnd( items, index, type ) {
	const start = Date.parse( items[ index ]?.timestamp ?? '' );

	if ( Number.isNaN( start ) ) {
		return NaN;
	}

	const next = Date.parse( items[ index + 1 ]?.timestamp ?? '' );

	return next > start ? next : start + ( PERIOD_IN_MS[ type ] ?? NaN );
}

/**
 * Selects the rows a forecast list shows: from the first item that has not
 * ended yet, so the hour or the day in progress comes first.
 *
 * @param {Object|null} forecast Forecast: meta, current, hourly, daily.
 * @param {string}      type     'daily' or 'hourly'.
 * @param {number}      count    Number of rows.
 * @param {number}      now      Current time in ms. Defaults to Date.now().
 * @return {Array|null} Rows, empty when every item has ended, or null when the
 *                      forecast has no such section (the page only holds the
 *                      current conditions until the first fetch).
 */
export function selectForecastItems( forecast, type, count, now = Date.now() ) {
	const items = forecast?.[ type ];

	if ( ! Array.isArray( items ) ) {
		return null;
	}

	const from = items.findIndex(
		( item, index ) => getForecastItemEnd( items, index, type ) > now
	);

	return from === -1 ? [] : items.slice( from, from + count );
}
