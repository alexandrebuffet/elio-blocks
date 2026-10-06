/**
 * When a weather forecast is asked for again: one rule for the front (the
 * weather-report view script) and the editor (the elio/data store), so both
 * show the same weather forecast.
 */

/**
 * Time past the expiry of the server copy before it counts as expired: the
 * server stamps meta.fetched_at to the second and WordPress keeps a transient
 * through the second it expires; the clocks of the browser and the server may
 * differ a little too.
 */
const EXPIRY_MARGIN = 5000;

/**
 * Time over which the pages open on a location spread their refreshes past the
 * expiry of the server copy: the first request asks the provider and refills
 * the cache, the next ones read it. Without it, every page would ask at once,
 * before the cache holds the new weather forecast, and each request would reach
 * the provider.
 */
const REFRESH_SPREAD = 30000;

/**
 * Longest a timer of setTimeoutAt() waits before it reads the clock again.
 */
const LONGEST_WAIT = 60000;

/**
 * Time after which a request is given up: one that never settles (sent as the
 * computer went to sleep) would keep its block waiting, query.isLoading on the
 * front, the resolution in the editor, and no refresh would follow.
 */
const REQUEST_TIMEOUT = 30000;

/**
 * Returns when the server will have newer data than the weather forecast held:
 * it keeps a weather forecast for the cache duration (dataTtl) after asking
 * the provider (meta.fetched_at). Until then, a request returns the same one.
 *
 * @param {Object|null} weatherForecast Weather forecast held.
 * @param {number}      dataTtl         Cache duration in ms, 0 with the cache off.
 * @return {number} Milliseconds since the epoch, 0 when unknown.
 */
export function getExpiresAt( weatherForecast, dataTtl = 0 ) {
	const fetchedAt = Date.parse( weatherForecast?.meta?.fetched_at ?? '' );

	return Number.isNaN( fetchedAt ) ? 0 : fetchedAt + dataTtl + EXPIRY_MARGIN;
}

/**
 * Returns when to ask for the weather forecast again.
 *
 * While the server keeps a copy of it, when that copy expires: before, the
 * server would send the same weather forecast again; after, the block would
 * show old data for nothing. The pages open on a location spread their
 * requests over the next seconds (REFRESH_SPREAD).
 *
 * Without a copy ahead (cache off, or a request that brought no newer data,
 * e.g. a failed one), the interval set by the site after the last request.
 *
 * @param {Object|null} weatherForecast          Weather forecast held.
 * @param {number}      requestedAt              When it was last asked for, in ms.
 * @param {Object}      settings                 Settings of the site.
 * @param {number}      settings.dataTtl         Cache duration in ms, 0 with the cache off.
 * @param {number}      settings.refreshInterval Interval in ms, 0 with auto-refresh off.
 * @return {number|null} Milliseconds since the epoch, null with auto-refresh off.
 */
export function getRefreshTime(
	weatherForecast,
	requestedAt,
	{ dataTtl = 0, refreshInterval = 0 } = {}
) {
	if ( ! ( refreshInterval > 0 ) ) {
		return null;
	}

	const expiresAt = getExpiresAt( weatherForecast, dataTtl );

	return dataTtl > 0 && expiresAt > Date.now()
		? expiresAt + Math.random() * REFRESH_SPREAD
		: requestedAt + refreshInterval;
}

/**
 * Returns the signal that gives up a request after REQUEST_TIMEOUT, for
 * fetch() on the front and apiFetch() in the editor.
 *
 * None where the browser has no AbortSignal.timeout(): Chrome 89 to 102 run
 * the script modules without it. The request then has no time limit, rather
 * than failing.
 *
 * @return {AbortSignal|undefined} Signal of the request.
 */
export function getRequestTimeoutSignal() {
	return AbortSignal.timeout?.( REQUEST_TIMEOUT );
}

/**
 * Calls back now, or once the page is shown again: a page nobody looks at
 * asks for nothing, it catches up when it is shown.
 *
 * @param {() => void} callback Called once.
 */
export function whenVisible( callback ) {
	if ( ! document.hidden ) {
		callback();
		return;
	}

	const onChange = () => {
		if ( ! document.hidden ) {
			document.removeEventListener( 'visibilitychange', onChange );
			callback();
		}
	};

	document.addEventListener( 'visibilitychange', onChange );
}

/**
 * Calls back once the clock reaches a time, even after the computer slept.
 *
 * A timeout counts no time while the computer sleeps: one set for 30 minutes
 * at night still has its 30 minutes to go in the morning, and the page shows
 * the night's weather until then. This one reads the clock at least once a
 * minute, so it is a minute late at most.
 *
 * @param {() => void} callback Called once.
 * @param {number}     time     Milliseconds since the epoch.
 * @return {() => void} Cancels it.
 */
export function setTimeoutAt( callback, time ) {
	// Never for a time that is not one: the clock would be read in a loop.
	if ( ! Number.isFinite( time ) ) {
		return () => {};
	}

	let timeoutId;

	function check() {
		if ( Date.now() >= time ) {
			callback();
		} else {
			wait();
		}
	}

	function wait() {
		timeoutId = setTimeout(
			check,
			Math.min( Math.max( 0, time - Date.now() ), LONGEST_WAIT )
		);
	}

	wait();

	return () => clearTimeout( timeoutId );
}
