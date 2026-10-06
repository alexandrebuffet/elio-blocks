/**
 * External dependencies
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Internal dependencies
 */
import {
	getStore,
	runAction,
	setContext,
	setElement,
	setServerState,
} from '../../../test-utils/interactivity';
import '../view';

vi.mock( '@wordpress/interactivity', async () => {
	const { mockInteractivity } =
		await import( '../../../test-utils/interactivity' );
	return mockInteractivity;
} );

const store = () => getStore( 'elio/weather-report' );

const PARIS = { latitude: 48.8566, longitude: 2.3522, name: 'Paris' };

const MINUTE = 60000;

/**
 * Formats a time as an ISO 8601 date-time.
 *
 * @param {number} ms Milliseconds since the epoch.
 * @return {string} ISO 8601 date-time, like meta.fetched_at.
 */
const iso = ( ms ) => new Date( ms ).toISOString();

function makeContext( overrides = {} ) {
	return {
		location: PARIS,
		provider: '',
		units: 'metric',
		iconCollections: [ 'elio' ],
		signature: 'abc123',
		item: { temperature: 12 },
		query: {
			isLoading: false,
			data: {
				meta: { fetched_at: iso( Date.now() ) },
				current: { temperature: 12 },
			},
			error: '',
			requestedAt: Date.now(),
		},
		...overrides,
	};
}

/**
 * Builds the context of a block whose weather forecast the provider sent `age`
 * ms ago, and which last asked the server `requestedAgo` ms ago (the page
 * render, at first).
 *
 * @param {Object} ages              Ages.
 * @param {number} ages.age          Age of the weather forecast.
 * @param {number} ages.requestedAgo Time since the last request.
 * @return {Object} Block context.
 */
function contextWith( { age, requestedAgo = 0 } ) {
	const context = makeContext();
	context.query.data.meta.fetched_at = iso( Date.now() - age );
	context.query.requestedAt = Date.now() - requestedAgo;
	return context;
}

function respondWith( body, { ok = true } = {} ) {
	global.fetch = vi.fn().mockResolvedValue( {
		ok,
		json: async () => body,
	} );
}

function requestedUrl() {
	return new URL( global.fetch.mock.calls[ 0 ][ 0 ] );
}

describe( 'weather-report view: fetch', () => {
	beforeEach( () => {
		setServerState( {
			weatherForecastUrl:
				'https://example.test/wp-json/elio/v1/weather-forecast',
			dataTtl: 1800000,
			refreshInterval: 0,
		} );
		setElement( { ref: document.createElement( 'section' ) } );
	} );

	it( 'gives up a request that never settles, so the next ones of the block are not held up', async () => {
		// A request sent as the computer went to sleep may never settle.
		const timeout = new AbortController();
		const timeoutSpy = vi
			.spyOn( AbortSignal, 'timeout' )
			.mockReturnValue( timeout.signal );
		global.fetch = vi.fn(
			( url, { signal } ) =>
				new Promise( ( resolve, reject ) =>
					signal.addEventListener( 'abort', () =>
						reject( signal.reason )
					)
				)
		);
		const context = makeContext();
		setContext( context );

		const request = runAction( store().actions.fetch() );
		expect( context.query.isLoading ).toBe( true );

		timeout.abort( new Error( 'The operation timed out.' ) );
		await request;

		expect( timeoutSpy ).toHaveBeenCalledWith( 30000 );
		expect( context.query.isLoading ).toBe( false );
		timeoutSpy.mockRestore();
	} );

	it( 'asks nothing for a hidden page, which catches up when it is shown again', async () => {
		const hidden = vi.spyOn( document, 'hidden', 'get' );
		hidden.mockReturnValue( true );
		respondWith( { current: { temperature: 21 } } );
		setContext( contextWith( { age: 40 * MINUTE } ) );

		await runAction( store().actions.fetch() );
		expect( global.fetch ).not.toHaveBeenCalled();

		hidden.mockReturnValue( false );
		await runAction( store().actions.catchUp() );
		expect( global.fetch ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'refreshes the current item that leaf blocks read, not only query.data', async () => {
		const context = makeContext();
		setContext( context );
		respondWith( { current: { temperature: 21 } } );

		await runAction( store().actions.fetch() );

		expect( context.query.data.current.temperature ).toBe( 21 );
		expect( context.item ).toEqual( { temperature: 21 } );
	} );

	it( 'sends the signature issued at render time and no nonce (nonces go stale in cached pages)', async () => {
		setContext( makeContext() );
		respondWith( { current: {} } );

		await runAction( store().actions.fetch() );

		const url = requestedUrl();
		expect( url.searchParams.get( 'signature' ) ).toBe( 'abc123' );
		expect( url.searchParams.get( 'latitude' ) ).toBe( '48.8566' );
		expect( url.searchParams.get( 'longitude' ) ).toBe( '2.3522' );
		expect( url.searchParams.get( 'units' ) ).toBe( 'metric' );
		expect( url.searchParams.has( 'cache' ) ).toBe( false );

		const options = global.fetch.mock.calls[ 0 ][ 1 ] ?? {};
		expect( options.headers?.[ 'X-WP-Nonce' ] ).toBeUndefined();
	} );

	it( 'asks for the icons of every collection the report and its blocks show', async () => {
		setContext( makeContext( { iconCollections: [ 'elio', 'theme' ] } ) );
		respondWith( { current: {} } );

		await runAction( store().actions.fetch() );

		expect(
			requestedUrl().searchParams.getAll( 'icon_collections[]' )
		).toEqual( [ 'elio', 'theme' ] );
	} );

	it( 'builds a valid URL when the site uses plain permalinks', async () => {
		setServerState( {
			weatherForecastUrl:
				'https://example.test/index.php?rest_route=/elio/v1/weather-forecast',
		} );
		setContext( makeContext() );
		respondWith( { current: {} } );

		await runAction( store().actions.fetch() );

		const url = requestedUrl();
		expect( url.searchParams.get( 'rest_route' ) ).toBe(
			'/elio/v1/weather-forecast'
		);
		expect( url.searchParams.get( 'latitude' ) ).toBe( '48.8566' );
		expect( global.fetch.mock.calls[ 0 ][ 0 ].split( '?' ) ).toHaveLength(
			2
		);
	} );

	it( 'fetches a location on the equator and prime meridian', async () => {
		setContext(
			makeContext( { location: { latitude: 0, longitude: 0 } } )
		);
		respondWith( { current: {} } );

		await runAction( store().actions.fetch() );

		expect( global.fetch ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'does not fetch without a location', async () => {
		setContext( makeContext( { location: {} } ) );
		respondWith( { current: {} } );

		await runAction( store().actions.fetch() );

		expect( global.fetch ).not.toHaveBeenCalled();
	} );

	it( 'keeps the previous data and reports the API message when the request fails', async () => {
		const context = makeContext();
		setContext( context );
		respondWith(
			{ message: 'Unable to fetch weather forecast data.' },
			{ ok: false }
		);

		await runAction( store().actions.fetch() );

		expect( context.query.error ).toBe(
			'Unable to fetch weather forecast data.'
		);
		expect( context.query.data.current.temperature ).toBe( 12 );
		expect( context.query.isLoading ).toBe( false );
	} );

	it( 'reports a readable error when the failure response is not JSON (e.g. HTML 502)', async () => {
		const context = makeContext();
		setContext( context );
		global.fetch = vi.fn().mockResolvedValue( {
			ok: false,
			json: async () => {
				throw new SyntaxError( 'Unexpected token < in JSON' );
			},
		} );

		await runAction( store().actions.fetch() );

		expect( context.query.error ).toBe( 'Failed to fetch weather data.' );
	} );

	it( 'defines the icons a refresh brings before the blocks point at them', async () => {
		const block = document.createElement( 'section' );
		document.body.appendChild( block );
		setElement( { ref: block } );
		const context = makeContext();
		setContext( context );
		let data = context.query.data;
		let symbolWhenShown = null;
		Object.defineProperty( context.query, 'data', {
			get: () => data,
			set: ( value ) => {
				symbolWhenShown = document.getElementById(
					'elio-condition-icon-elio--storm'
				);
				data = value;
			},
		} );
		respondWith( {
			current: { condition_icons: { elio: 'elio/storm' } },
			icons: {
				'elio/storm': {
					content:
						'<svg viewBox="0 0 24 24"><path d="M3 3"></path></svg>',
					style: 'stroke',
				},
			},
		} );

		await runAction( store().actions.fetch() );

		expect( symbolWhenShown?.tagName ).toBe( 'symbol' );
		// In the sprite of the report block, as the server prints it.
		expect( symbolWhenShown.parentElement ).toBe(
			block.querySelector(
				':scope > .wp-block-elio-weather-report__condition-icons-sprite'
			)
		);

		block.remove();
	} );

	it( 'records when it asked, even when the request fails, so refreshes stay spaced', async () => {
		const context = contextWith( { age: 0, requestedAgo: 60 * MINUTE } );
		setContext( context );
		respondWith( { message: 'Bad gateway' }, { ok: false } );

		await runAction( store().actions.fetch() );

		expect( Date.now() - context.query.requestedAt ).toBeLessThan( 1000 );
	} );
} );

describe( 'weather-report view: refresh policy', () => {
	const visibility = vi.spyOn( document, 'hidden', 'get' );

	beforeEach( () => {
		// The server keeps a weather forecast for 30 minutes.
		setServerState( {
			weatherForecastUrl:
				'https://example.test/wp-json/elio/v1/weather-forecast',
			dataTtl: 30 * MINUTE,
		} );
		setElement( { ref: document.createElement( 'section' ) } );
		respondWith( { current: {} } );
	} );

	it( 'does not refetch when the visitor comes back while the server copy is still valid', async () => {
		visibility.mockReturnValue( false );
		setContext( contextWith( { age: MINUTE, requestedAgo: MINUTE } ) );

		await runAction( store().actions.catchUp() );

		expect( global.fetch ).not.toHaveBeenCalled();
	} );

	it( 'refetches when the visitor comes back after the server copy expired', async () => {
		visibility.mockReturnValue( false );
		setContext( contextWith( { age: 31 * MINUTE, requestedAgo: MINUTE } ) );

		await runAction( store().actions.catchUp() );

		expect( global.fetch ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'judges freshness by the age of the weather forecast, not by when the page was rendered', async () => {
		// Rendered a moment ago, from a weather forecast the server cached 31
		// minutes ago.
		setContext( contextWith( { age: 31 * MINUTE, requestedAgo: 0 } ) );

		await runAction( store().actions.init() );

		expect( global.fetch ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'does not refetch on load a weather forecast the server would send again', async () => {
		setContext( contextWith( { age: 10 * MINUTE, requestedAgo: 0 } ) );

		await runAction( store().actions.init() );

		expect( global.fetch ).not.toHaveBeenCalled();
	} );

	it( 'does not start a second request while one is in flight', async () => {
		const context = makeContext();
		context.query.isLoading = true;
		setContext( context );

		await runAction( store().actions.fetch() );

		expect( global.fetch ).not.toHaveBeenCalled();
	} );
} );

describe( 'weather-report view: relative date clock', () => {
	const visibility = vi.spyOn( document, 'hidden', 'get' );
	const start = () => store().callbacks.startRelativeDateClock();

	beforeEach( () => {
		vi.useFakeTimers().setSystemTime( new Date( '2026-09-21T14:00:00Z' ) );
	} );

	afterEach( () => {
		vi.useRealTimers();
	} );

	it( 'keeps now current with one timer, however many blocks show a relative date', () => {
		const stops = [ start(), start() ];

		expect( vi.getTimerCount() ).toBe( 1 );

		vi.advanceTimersByTime( 30000 );

		expect( store().state.now ).toBe(
			Date.parse( '2026-09-21T14:00:30Z' )
		);

		stops[ 0 ]();
		expect( vi.getTimerCount() ).toBe( 1 );

		stops[ 1 ]();
		expect( vi.getTimerCount() ).toBe( 0 );
	} );

	it( 'catches up at once when the visitor comes back to the page', async () => {
		visibility.mockReturnValue( false );
		setContext( { query: {} } );
		vi.setSystemTime( new Date( '2026-09-21T15:00:00Z' ) );

		await runAction( store().actions.catchUp() );

		expect( store().state.now ).toBe(
			Date.parse( '2026-09-21T15:00:00Z' )
		);
	} );
} );

describe( 'weather-report view: quarter-hour clock', () => {
	const start = () => store().callbacks.startQuarterHourClock();

	beforeEach( () => {
		vi.useFakeTimers().setSystemTime( new Date( '2026-09-21T14:50:00Z' ) );
	} );

	afterEach( () => {
		vi.useRealTimers();
	} );

	it( 'brings now up to date at once, then at each quarter hour, with one timer however many blocks', () => {
		const stops = [ start(), start() ];

		expect( store().state.now ).toBe(
			Date.parse( '2026-09-21T14:50:00Z' )
		);
		expect( vi.getTimerCount() ).toBe( 1 );

		vi.advanceTimersByTime( 10 * MINUTE - 1 );
		expect( store().state.now ).toBe(
			Date.parse( '2026-09-21T14:50:00Z' )
		);

		vi.advanceTimersByTime( 1 );
		expect( store().state.now ).toBe(
			Date.parse( '2026-09-21T15:00:00Z' )
		);

		vi.advanceTimersByTime( 15 * MINUTE );
		expect( store().state.now ).toBe(
			Date.parse( '2026-09-21T15:15:00Z' )
		);

		stops[ 0 ]();
		expect( vi.getTimerCount() ).toBe( 1 );

		stops[ 1 ]();
		expect( vi.getTimerCount() ).toBe( 0 );
	} );

	it( 'catches up within a minute of the computer waking up, however long it slept', () => {
		const stop = start();

		// Asleep all night: the clock moves on, the timers do not.
		vi.setSystemTime( new Date( '2026-09-22T08:30:00Z' ) );
		vi.advanceTimersByTime( MINUTE );

		expect( store().state.now ).toBe(
			Date.parse( '2026-09-22T08:31:00Z' )
		);
		stop();
	} );

	it( 'reaches the start of an hour at a half-hour offset too (Kolkata, UTC+05:30)', () => {
		vi.setSystemTime( new Date( '2026-07-01T13:50:00+05:30' ) );
		const stop = start();

		vi.advanceTimersByTime( 10 * MINUTE );

		expect( store().state.now ).toBe(
			Date.parse( '2026-07-01T14:00:00+05:30' )
		);
		stop();
	} );
} );

describe( 'weather-report view: forecast rows', () => {
	const sync = () => store().callbacks.syncForecastItems();
	const day = ( n ) => ( { timestamp: `2026-07-0${ n }T00:00:00+02:00` } );
	const hour = ( h ) => ( { timestamp: `2026-07-01T${ h }:00:00+02:00` } );

	beforeEach( () => {
		// The morning of 1 July in Paris, the clock the rows count from.
		store().state.now = Date.parse( '2026-07-01T10:00:00+02:00' );
	} );

	afterEach( () => {
		store().state.now = Date.now();
		setElement( { ref: null } );
	} );

	it( 'keeps the server-rendered rows while the page only holds the trimmed weather forecast', () => {
		const rows = [ day( 1 ), day( 2 ), day( 3 ) ];
		const context = {
			forecastType: 'daily',
			forecastCount: 3,
			forecastItems: rows,
			// What the server puts in the page: no hourly/daily sections.
			query: { data: { current: { temperature: 12 }, icons: {} } },
		};
		setContext( context );

		sync();

		expect( context.forecastItems ).toBe( rows );
	} );

	it( 'rebuilds the rows from a freshly fetched weather forecast', () => {
		const context = {
			forecastType: 'daily',
			forecastCount: 2,
			forecastItems: [ day( 1 ), day( 2 ) ],
			query: { data: { daily: [ day( 2 ), day( 3 ), day( 4 ) ] } },
		};
		setContext( context );

		sync();

		expect( context.forecastItems ).toEqual( [ day( 2 ), day( 3 ) ] );
	} );

	it( 'empties the rows when the fetched weather forecast has none', () => {
		const context = {
			forecastType: 'hourly',
			forecastCount: 2,
			forecastItems: [ day( 1 ) ],
			query: { data: { hourly: [] } },
		};
		setContext( context );

		sync();

		expect( context.forecastItems ).toEqual( [] );
	} );

	it( 'starts hourly rows at the hour in progress at the location, whatever the timezone of the visitor', () => {
		// 13:45 in Kolkata (UTC+05:30): the 13:00 row is the hour in progress.
		store().state.now = Date.parse( '2026-07-01T13:45:00+05:30' );
		const kolkata = ( h ) => ( {
			timestamp: `2026-07-01T${ h }:00:00+05:30`,
		} );
		const context = {
			forecastType: 'hourly',
			forecastCount: 2,
			forecastItems: [],
			query: {
				data: {
					hourly: [
						kolkata( 12 ),
						kolkata( 13 ),
						kolkata( 14 ),
						kolkata( 15 ),
					],
				},
			},
		};
		setContext( context );

		sync();

		expect( context.forecastItems ).toEqual( [
			kolkata( 13 ),
			kolkata( 14 ),
		] );
	} );

	it( 'counts the rows from the clock the "Now" labels count from, not from the time of the last fetch', () => {
		const context = {
			forecastType: 'hourly',
			forecastCount: 2,
			forecastItems: [],
			query: { data: { hourly: [ hour( 14 ), hour( 15 ), hour( 16 ) ] } },
		};
		setContext( context );

		store().state.now = Date.parse( '2026-07-01T14:50:00+02:00' );
		sync();
		expect( context.forecastItems ).toEqual( [ hour( 14 ), hour( 15 ) ] );

		// Back on the page at 15:05: no fetch, the rows move with the labels.
		store().state.now = Date.parse( '2026-07-01T15:05:00+02:00' );
		sync();
		expect( context.forecastItems ).toEqual( [ hour( 15 ), hour( 16 ) ] );
	} );

	describe( 'until the first fetch', () => {
		let report;
		let refreshes;

		beforeEach( () => {
			refreshes = 0;
			report = document.createElement( 'div' );
			report.className = 'wp-block-elio-weather-report';
			report.addEventListener( 'weather-refresh', () => refreshes++ );
			const list = document.createElement( 'ol' );
			report.append( list );
			setElement( { ref: list } );
		} );

		const serverRows = () => ( {
			forecastType: 'hourly',
			forecastCount: 2,
			forecastItems: [ hour( 14 ), hour( 15 ) ],
			// What the server puts in the page: no hourly/daily sections.
			query: { data: { current: { temperature: 12 } } },
		} );

		it( 'keeps the rows the server rendered while the first one is in progress', () => {
			const context = serverRows();
			setContext( context );
			store().state.now = Date.parse( '2026-07-01T14:59:00+02:00' );

			sync();

			expect( context.forecastItems ).toEqual( [
				hour( 14 ),
				hour( 15 ),
			] );
			expect( refreshes ).toBe( 0 );
		} );

		it( 'has the report fetch the weather forecast to rebuild them from once the first one has ended', () => {
			setContext( serverRows() );
			store().state.now = Date.parse( '2026-07-01T15:00:00+02:00' );

			sync();

			expect( refreshes ).toBe( 1 );
		} );

		it( 'asks once per ended row: a failed request is retried at the pace of the auto-refresh, not at each tick of the clock', () => {
			const context = serverRows();
			setContext( context );
			store().state.now = Date.parse( '2026-07-01T15:00:00+02:00' );
			sync();

			// The request failed: still no sections, and the clock ticks on.
			context.query.requestedAt = Date.parse(
				'2026-07-01T15:00:01+02:00'
			);
			store().state.now = Date.parse( '2026-07-01T15:00:30+02:00' );
			sync();
			store().state.now = Date.parse( '2026-07-01T15:01:00+02:00' );
			sync();

			expect( refreshes ).toBe( 1 );
		} );

		it( 'does the same for a day that has ended (daily rows rendered before midnight)', () => {
			setContext( {
				...serverRows(),
				forecastType: 'daily',
				forecastItems: [ day( 1 ), day( 2 ) ],
			} );
			store().state.now = Date.parse( '2026-07-02T00:05:00+02:00' );

			sync();

			expect( refreshes ).toBe( 1 );
		} );
	} );
} );

describe( 'weather-report view: auto-refresh', () => {
	let element;
	let refreshes;
	let random;

	const start = () => store().callbacks.startAutoRefresh();

	beforeEach( () => {
		vi.useFakeTimers().setSystemTime( new Date( '2026-09-21T14:00:00Z' ) );
		// No spread past the expiry, unless a test sets one.
		random = vi.spyOn( Math, 'random' ).mockReturnValue( 0 );
		refreshes = 0;
		element = document.createElement( 'section' );
		element.addEventListener( 'weather-refresh', () => refreshes++ );
		setElement( { ref: element } );
	} );

	afterEach( () => {
		random.mockRestore();
		vi.useRealTimers();
	} );

	it( 'refreshes as soon as the server has newer data, even on a page rendered just before its copy expires', () => {
		// Rendered now, from a weather forecast the server cached 29 minutes
		// ago.
		setServerState( {
			refreshInterval: 15 * MINUTE,
			dataTtl: 30 * MINUTE,
		} );
		setContext( contextWith( { age: 29 * MINUTE } ) );

		start();
		vi.advanceTimersByTime( MINUTE + 5000 - 1 );
		expect( refreshes ).toBe( 0 );

		vi.advanceTimersByTime( 1 );
		expect( refreshes ).toBe( 1 );
	} );

	it( 'refreshes within a minute of the computer waking up, however long it slept', () => {
		setServerState( {
			refreshInterval: 15 * MINUTE,
			dataTtl: 30 * MINUTE,
		} );
		setContext( contextWith( { age: 10 * MINUTE } ) );

		start();
		// Asleep all night: the clock moves on, the timers do not.
		vi.setSystemTime( new Date( '2026-09-22T08:30:00Z' ) );
		vi.advanceTimersByTime( MINUTE );

		expect( refreshes ).toBe( 1 );
	} );

	it( 'spreads the pages open on a location over the seconds past the expiry, so one request refills the server cache for the others', () => {
		random.mockReturnValue( 0.5 );
		setServerState( {
			refreshInterval: 15 * MINUTE,
			dataTtl: 30 * MINUTE,
		} );
		setContext( contextWith( { age: 10 * MINUTE } ) );

		start();
		vi.advanceTimersByTime( 20 * MINUTE + 5000 + 15000 - 1 );
		expect( refreshes ).toBe( 0 );

		vi.advanceTimersByTime( 1 );
		expect( refreshes ).toBe( 1 );
	} );

	it( 'retries at the interval set by the site when a refresh brought no newer data (failed request)', () => {
		// The copy of the server expired a minute ago, the block asked just now.
		setServerState( {
			refreshInterval: 15 * MINUTE,
			dataTtl: 30 * MINUTE,
		} );
		setContext( contextWith( { age: 31 * MINUTE } ) );

		start();
		vi.advanceTimersByTime( 15 * MINUTE - 1 );
		expect( refreshes ).toBe( 0 );

		vi.advanceTimersByTime( 1 );
		expect( refreshes ).toBe( 1 );
	} );

	it( 'refreshes at the interval set by the site when the server keeps no copy (cache off)', () => {
		// Cache off: the server has newer data at any time.
		setServerState( { refreshInterval: 15 * MINUTE, dataTtl: 0 } );
		setContext( contextWith( { age: 0 } ) );

		start();
		vi.advanceTimersByTime( 15 * MINUTE - 1 );
		expect( refreshes ).toBe( 0 );

		vi.advanceTimersByTime( 1 );
		expect( refreshes ).toBe( 1 );
	} );

	it( 'waits for the server copy to expire instead of fetching the same weather forecast again', () => {
		// Every minute, but the server keeps a weather forecast 30 minutes: it
		// was cached 10 minutes ago.
		setServerState( { refreshInterval: MINUTE, dataTtl: 30 * MINUTE } );
		setContext( contextWith( { age: 10 * MINUTE } ) );

		start();
		vi.advanceTimersByTime( 20 * MINUTE - 1 );
		expect( refreshes ).toBe( 0 );

		vi.advanceTimersByTime( 10000 );
		expect( refreshes ).toBe( 1 );
	} );

	it( 'gives the server a few seconds past the expiry of its copy, so the refresh brings new data', () => {
		// WordPress counts transients in whole seconds: at the second of the
		// expiry it still serves its copy (seen live: one request for nothing).
		setServerState( { refreshInterval: MINUTE, dataTtl: 30 * MINUTE } );
		setContext( contextWith( { age: 10 * MINUTE } ) );

		start();
		vi.advanceTimersByTime( 20 * MINUTE + 1000 );
		expect( refreshes ).toBe( 0 );

		vi.advanceTimersByTime( 4000 );
		expect( refreshes ).toBe( 1 );
	} );

	it( 'refreshes at once a page served long after it was rendered (page cache)', () => {
		setServerState( {
			refreshInterval: 15 * MINUTE,
			dataTtl: 30 * MINUTE,
		} );
		setContext(
			contextWith( {
				age: 2 * 60 * MINUTE,
				requestedAgo: 2 * 60 * MINUTE,
			} )
		);

		start();
		vi.advanceTimersByTime( 0 );

		expect( refreshes ).toBe( 1 );
	} );

	it( 'asks once: the runtime schedules the next refresh when the request changes the context', () => {
		setServerState( { refreshInterval: 15 * MINUTE, dataTtl: 0 } );
		setContext( contextWith( { age: 0 } ) );

		start();
		vi.advanceTimersByTime( 60 * MINUTE );

		expect( refreshes ).toBe( 1 );
	} );

	it( 'stops when the block leaves the page, e.g. on a client-side navigation', () => {
		setServerState( { refreshInterval: 15 * MINUTE, dataTtl: 0 } );
		setContext( contextWith( { age: 0 } ) );

		const stop = start();
		stop();
		vi.advanceTimersByTime( 60 * MINUTE );

		expect( refreshes ).toBe( 0 );
	} );

	it( 'does not run when auto-refresh is off', () => {
		setServerState( { refreshInterval: 0, dataTtl: 0 } );
		setContext( contextWith( { age: 0 } ) );

		expect( start() ).toBeUndefined();
		vi.advanceTimersByTime( 60 * MINUTE );

		expect( refreshes ).toBe( 0 );
	} );

	it( 'is not started by init, which cannot hand a cleanup back', async () => {
		setServerState( {
			refreshInterval: 15 * MINUTE,
			dataTtl: 30 * MINUTE,
		} );
		setContext( contextWith( { age: 0 } ) );

		await runAction( store().actions.init() );
		vi.advanceTimersByTime( 60 * MINUTE );

		expect( refreshes ).toBe( 0 );
	} );
} );

describe( 'weather-report view: production build', () => {
	it( 'ships no debug callbacks', () => {
		expect( store().callbacks.logState ).toBeUndefined();
		expect( store().callbacks.logContext ).toBeUndefined();
	} );
} );
