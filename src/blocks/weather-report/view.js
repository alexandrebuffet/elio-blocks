/**
 * WordPress dependencies
 */
import {
	store,
	getContext,
	getServerState,
	getElement,
} from '@wordpress/interactivity';

/**
 * Internal dependencies
 */
import {
	getForecastItemEnd,
	selectForecastItems,
} from '../../shared/forecast-window';
import { defineIcons } from '../../shared/icon-sprite';
import {
	getExpiresAt,
	getRefreshTime,
	setTimeoutAt,
} from '../../shared/refresh';
import { getNextQuarterHour } from '../../shared/weather-dates';

const FALLBACK_ERROR = 'Failed to fetch weather data.';

/**
 * Time after which a request is given up: one that never settles (sent as the
 * computer went to sleep) would keep query.isLoading, and every next request
 * of the block would wait for it.
 */
const REQUEST_TIMEOUT = 30000;

/**
 * How often relative dates ("5 minutes ago") are brought up to date.
 */
const RELATIVE_DATE_TICK = 30000;

/**
 * The one timer of the page behind state.now, and the number of blocks
 * showing a relative date that keep it running.
 */
const relativeDateClock = { blocks: 0, timer: 0 };

/**
 * The one timer of the page that brings state.now up to date at each quarter
 * hour, and the number of blocks that keep it running.
 */
const quarterHourClock = { blocks: 0, cancel: () => {} };

/**
 * Checks whether a coordinate is usable. 0 is valid (equator, prime meridian).
 *
 * @param {number|string|null|undefined} value Latitude or longitude.
 * @return {boolean} True for a finite number or numeric string.
 */
function isCoordinate( value ) {
	return (
		value !== null &&
		value !== undefined &&
		value !== '' &&
		Number.isFinite( Number( value ) )
	);
}

/**
 * Checks whether a request would return the weather forecast the block already holds.
 *
 * @param {Object} query Query state from context.
 * @return {boolean} True until the copy kept by the server expires.
 */
function isFresh( query ) {
	return Date.now() < getExpiresAt( query?.data, getServerState().dataTtl );
}

const { state, actions } = store( 'elio/weather-report', {
	state: {
		/**
		 * Milliseconds since the epoch: now, which the date blocks count
		 * relative dates and their "Now"/"Today" labels from, and the forecast
		 * lists their rows. Kept current by callbacks.startRelativeDateClock
		 * while a block shows a relative date, by
		 * callbacks.startQuarterHourClock while a list or a label is on the
		 * page.
		 */
		now: Date.now(),
		/**
		 * Returns the forecast items sliced to the count defined by the
		 * nearest forecast-template context (forecastType / forecastCount).
		 *
		 * Null when the weather forecast in context has no such section: the
		 * server only puts the current conditions in the page (the rows are
		 * already rendered), the hourly/daily sections arrive with the first
		 * fetch. See selectForecastItems(), mirrored server-side by
		 * ForecastWindow.
		 *
		 * Counted from state.now, like the "Now" and "Today" labels of the
		 * date blocks: the rows move with them.
		 */
		get forecastItems() {
			const context = getContext();

			return selectForecastItems(
				context.query?.data,
				context.forecastType || 'daily',
				context.forecastCount || 7,
				state.now
			);
		},
		/**
		 * Returns the weather forecast request URL for the block in context,
		 * or null without a location.
		 *
		 * Built with URL so it stays valid with plain permalinks, where the
		 * endpoint already carries a query string (?rest_route=…). The signature
		 * issued at render time authorises exactly this request for anonymous
		 * visitors; unlike a nonce it does not expire in cached pages.
		 */
		get weatherForecastRequestUrl() {
			const {
				location = {},
				provider = '',
				units = '',
				iconCollections = [],
				signature = '',
			} = getContext();
			const { weatherForecastUrl = '' } = getServerState();

			if (
				! weatherForecastUrl ||
				! isCoordinate( location?.latitude ) ||
				! isCoordinate( location?.longitude )
			) {
				return null;
			}

			const url = new URL( weatherForecastUrl, window.location.href );
			url.searchParams.set( 'latitude', location.latitude );
			url.searchParams.set( 'longitude', location.longitude );
			url.searchParams.set( 'provider', provider || '' );
			url.searchParams.set( 'units', units || 'metric' );
			url.searchParams.set( 'signature', signature );
			// The collections the report and its blocks show: the server names the
			// icon of each item in every one of them.
			for ( const slug of iconCollections ) {
				url.searchParams.append( 'icon_collections[]', slug );
			}

			return url.toString();
		},
	},
	callbacks: {
		/**
		 * Schedules the next refresh of the block (data-wp-watch on the
		 * block wrapper), at the time getRefreshTime() gives: when the server
		 * copy expires, else the interval set by the site after the last
		 * request.
		 *
		 * One timer per run: the callback reads query.requestedAt and the
		 * weather forecast, which every request changes, so the runtime cleans
		 * the timer up and runs the callback again to schedule the next one.
		 *
		 * A custom DOM event rather than a direct call: the
		 * data-wp-on--weather-refresh directive runs actions.fetch() inside
		 * the scope of the block, where its context is.
		 *
		 * A callback and not an action: only a synchronous callback can
		 * return a cleanup function. The runtime also calls it when the block
		 * leaves the page (client-side navigation), which stops the timer.
		 *
		 * @return {(() => void)|undefined} Cleanup, when a timer was started.
		 */
		startAutoRefresh() {
			const { ref } = getElement();
			const { query } = getContext();
			const refreshAt = getRefreshTime(
				query?.data,
				query?.requestedAt ?? 0,
				getServerState()
			);

			if ( refreshAt === null || ! ref ) {
				return undefined;
			}

			return setTimeoutAt( () => {
				ref.dispatchEvent(
					new CustomEvent( 'weather-refresh', { bubbles: false } )
				);
			}, refreshAt );
		},
		/**
		 * Keeps state.now current while a date block shows a relative date
		 * ("5 minutes ago"), so it does not go stale on an open page
		 * (data-wp-watch on the datetime, sun-event and last-updated blocks
		 * whose format is "human-diff"). One timer for the page, however many
		 * blocks: the first one starts it, the last one to leave the page
		 * (client-side navigation) stops it.
		 *
		 * @return {() => void} Cleanup.
		 */
		startRelativeDateClock() {
			if ( relativeDateClock.blocks++ === 0 ) {
				relativeDateClock.timer = setInterval( () => {
					state.now = Date.now();
				}, RELATIVE_DATE_TICK );
			}

			return () => {
				if ( --relativeDateClock.blocks === 0 ) {
					clearInterval( relativeDateClock.timer );
				}
			};
		},
		/**
		 * Brings state.now up to date at each quarter hour while a forecast
		 * list or a date labelled "Now"/"Today" is on the page (data-wp-watch
		 * on the forecast-template block and on the datetime blocks with
		 * currentAsLabel): the rows of a list and those labels move together,
		 * as soon as the hour or the day in progress changes at the location
		 * (getNextQuarterHour()). One timer for the page, however many blocks:
		 * the first one starts it, the last one to leave the page stops it.
		 *
		 * @return {() => void} Cleanup.
		 */
		startQuarterHourClock() {
			if ( quarterHourClock.blocks++ === 0 ) {
				// Never reads state.now: the watch would run again on each tick.
				const tick = () => {
					const now = Date.now();

					state.now = now;
					quarterHourClock.cancel = setTimeoutAt(
						tick,
						getNextQuarterHour( now )
					);
				};

				// From now: the page may have been open for a while before
				// (client-side navigation).
				tick();
			}

			return () => {
				if ( --quarterHourClock.blocks === 0 ) {
					quarterHourClock.cancel();
				}
			};
		},
		/**
		 * Syncs the computed forecastItems into the nearest forecast-template
		 * context so that data-wp-each can use a plain context array (SSR-safe).
		 * Called via data-wp-watch on the forecast-template wrapper.
		 *
		 * The rows rendered by the server stay in place until a fetched weather
		 * forecast brings the hourly/daily sections to rebuild them from. Once
		 * the first of them has ended, the report fetches the weather forecast,
		 * even if the server would send the copy the page was rendered from:
		 * it answers from its cache, and the page gets the sections.
		 *
		 * Once per ended row: the watch runs again at each tick of state.now
		 * (every 30 seconds with a relative date on the page), and while the
		 * provider is down every request would reach it, the server caching
		 * no failure. A failed request is retried at the pace of the
		 * auto-refresh (startAutoRefresh).
		 */
		syncForecastItems() {
			const ctx = getContext();
			const items = state.forecastItems;

			if ( items !== null ) {
				ctx.forecastItems = items;
				return;
			}

			const firstRowEnd = getForecastItemEnd(
				ctx.forecastItems ?? [],
				0,
				ctx.forecastType || 'daily'
			);

			if (
				firstRowEnd <= state.now &&
				( ctx.query?.requestedAt ?? 0 ) < firstRowEnd
			) {
				getElement()
					.ref?.closest( '.wp-block-elio-weather-report' )
					?.dispatchEvent( new CustomEvent( 'weather-refresh' ) );
			}
		},
	},
	actions: {
		/**
		 * Initializes the weather report.
		 * Called automatically via data-wp-init directive.
		 * Skips the fetch while the server would send the weather forecast the
		 * page already holds; fetches at once in a page served from a page cache.
		 */
		*init() {
			if ( ! isFresh( getContext().query ) ) {
				yield actions.fetch();
			}
		},
		/**
		 * Handles data-wp-on-document--visibilitychange.
		 * Refreshes weather data when the user returns to the page (timers of
		 * hidden tabs may be frozen), unless the server would send the same
		 * weather forecast again, and brings relative dates up to date.
		 */
		*handleVisibilityChange() {
			if ( document.hidden ) {
				return;
			}

			// Timers of hidden tabs are slowed down: relative dates catch up at once.
			state.now = Date.now();

			if ( isFresh( getContext().query ) ) {
				return;
			}

			yield actions.fetch();
		},
		/**
		 * Fetches weather data from the REST API.
		 * Keeps existing query.data intact during loading to avoid flash.
		 * Items point at their icon by slug; the SVGs come once, in data.icons,
		 * and become symbols of the page (shared/icon-sprite).
		 */
		*fetch() {
			const context = getContext();
			const url = state.weatherForecastRequestUrl;

			// One request at a time per block: init, the refresh interval and
			// a tab coming back to the foreground can overlap.
			if ( ! url || context.query.isLoading ) {
				return;
			}

			context.query.isLoading = true;
			context.query.error = '';

			try {
				const response = yield fetch( url, {
					signal: AbortSignal.timeout( REQUEST_TIMEOUT ),
				} );

				if ( ! response.ok ) {
					let message = '';
					try {
						message = ( yield response.json() )?.message;
					} catch {
						// Not JSON (e.g. an HTML error page from a proxy).
					}
					throw new Error( message || FALLBACK_ERROR );
				}

				const data = yield response.json();

				// Condition icons point at symbols: define the new ones before
				// the blocks show the new weather forecast.
				defineIcons( data?.icons, getElement().ref );
				context.query.data = data;
				// Leaf blocks outside a forecast-template read context.item.
				context.item = data?.current ?? null;
			} catch ( error ) {
				context.query.error = error.message || FALLBACK_ERROR;
			} finally {
				context.query.isLoading = false;
				// Successful or not: the next refresh is counted from here.
				context.query.requestedAt = Date.now();
			}
		},
	},
} );
