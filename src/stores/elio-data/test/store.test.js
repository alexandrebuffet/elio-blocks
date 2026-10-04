/**
 * External dependencies
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * WordPress dependencies
 */
import { createRegistry } from '@wordpress/data';
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import { store } from '..';

vi.mock( '@wordpress/api-fetch', () => ( { default: vi.fn() } ) );

const PARIS = [ 48.8566, 2.3522, '', 'metric' ];
const TOKYO = [ 35.6895, 139.6917, '', 'metric' ];

const COLLECTIONS = [
	{ slug: 'elio', label: 'Elio', is_default: true },
	{ slug: 'theme', label: 'Theme', is_default: false },
];

function makeRegistry() {
	const registry = createRegistry();
	registry.register( store );
	return registry;
}

// `@wordpress/data` starts a resolver on the next tick.
const tick = () => new Promise( ( resolve ) => setTimeout( resolve ) );

// The requests of weather forecasts, not of the collections or providers.
const forecastCalls = () =>
	apiFetch.mock.calls.filter( ( [ { path } ] ) =>
		path.startsWith( '/elio/v1/weather-forecast?' )
	);

function requestedQuery( call = 0 ) {
	const { path } = forecastCalls()[ call ][ 0 ];
	return new URLSearchParams( path.split( '?' )[ 1 ] );
}

/**
 * Answers the collections endpoint with the collections, the weather forecast
 * endpoint with `weatherForecast`.
 *
 * @param {Object} weatherForecast Weather forecast to answer.
 * @param {Array}  collections     Collections to answer.
 */
function respondWith( weatherForecast, collections = COLLECTIONS ) {
	apiFetch.mockImplementation( ( { path } ) =>
		path.startsWith( '/elio/v1/condition-icon-collections' )
			? Promise.resolve( collections )
			: Promise.resolve( weatherForecast )
	);
}

describe( 'elio/data store: weather forecasts', () => {
	beforeEach( () => {
		apiFetch.mockReset();
	} );

	it( 'has no weather forecast before the request resolves', async () => {
		apiFetch.mockReturnValue( new Promise( () => {} ) );
		const registry = makeRegistry();

		expect(
			registry.select( store ).getWeatherForecast( ...PARIS )
		).toBeNull();
		// The resolver now awaits the collections resolver first, which
		// itself starts a tick later: wait until it actually calls out.
		await vi.waitFor( () => expect( apiFetch ).toHaveBeenCalled() );
		expect(
			registry.select( store ).isResolving( 'getWeatherForecast', PARIS )
		).toBe( true );
	} );

	it( 'asks the weather forecast endpoint for the location, provider and units of the report', async () => {
		respondWith( { current: { temperature: 21 } } );
		const registry = makeRegistry();

		const weatherForecast = await registry
			.resolveSelect( store )
			.getWeatherForecast( 48.8566, 2.3522, 'open-meteo', 'imperial' );

		expect( weatherForecast ).toEqual( { current: { temperature: 21 } } );
		expect( forecastCalls()[ 0 ][ 0 ].path ).toMatch(
			/^\/elio\/v1\/weather-forecast\?/
		);
		expect( Object.fromEntries( requestedQuery() ) ).toEqual( {
			latitude: '48.8566',
			longitude: '2.3522',
			provider: 'open-meteo',
			units: 'imperial',
			'icon_collections[0]': 'elio',
			'icon_collections[1]': 'theme',
		} );
	} );

	it( 'fetches a location once, however many blocks ask for it', async () => {
		respondWith( { current: { temperature: 21 } } );
		const registry = makeRegistry();

		await Promise.all( [
			registry.resolveSelect( store ).getWeatherForecast( ...PARIS ),
			registry.resolveSelect( store ).getWeatherForecast( ...PARIS ),
		] );
		await registry.resolveSelect( store ).getWeatherForecast( ...PARIS );

		expect( forecastCalls() ).toHaveLength( 1 );
	} );

	it( 'keeps the weather forecasts of two reports apart, whichever answers first', async () => {
		const answers = {};
		apiFetch.mockImplementation( ( { path } ) => {
			if ( path.startsWith( '/elio/v1/condition-icon-collections' ) ) {
				return Promise.resolve( COLLECTIONS );
			}
			return new Promise( ( resolve ) => {
				answers[ path.includes( '139.6917' ) ? 'tokyo' : 'paris' ] =
					resolve;
			} );
		} );
		const registry = makeRegistry();
		const paris = registry
			.resolveSelect( store )
			.getWeatherForecast( ...PARIS );
		const tokyo = registry
			.resolveSelect( store )
			.getWeatherForecast( ...TOKYO );
		// The collections resolver runs first, a tick later: wait for both
		// weather forecast requests to be in flight before answering them.
		await vi.waitFor( () => {
			expect( answers.tokyo ).toBeDefined();
			expect( answers.paris ).toBeDefined();
		} );

		// The request sent first answers last: it must not overwrite the other one.
		answers.tokyo( { current: { temperature: 28 } } );
		answers.paris( { current: { temperature: 15 } } );
		await Promise.all( [ paris, tokyo ] );

		const select = registry.select( store );
		expect(
			select.getWeatherForecast( ...PARIS ).current.temperature
		).toBe( 15 );
		expect(
			select.getWeatherForecast( ...TOKYO ).current.temperature
		).toBe( 28 );
	} );

	it( 'fetches a location on the equator and the prime meridian', async () => {
		respondWith( { current: { temperature: 27 } } );
		const registry = makeRegistry();

		await registry
			.resolveSelect( store )
			.getWeatherForecast( 0, 0, '', '' );

		expect( requestedQuery().get( 'latitude' ) ).toBe( '0' );
		expect( requestedQuery().get( 'longitude' ) ).toBe( '0' );
	} );

	it( 'reports a failed request, and fetches again once the resolution is invalidated', async () => {
		let fail = true;
		apiFetch.mockImplementation( ( { path } ) => {
			if ( path.startsWith( '/elio/v1/condition-icon-collections' ) ) {
				return Promise.resolve( COLLECTIONS );
			}
			if ( fail ) {
				fail = false;
				return Promise.reject(
					new Error( 'Unable to fetch weather forecast data.' )
				);
			}
			return Promise.resolve( { current: { temperature: 21 } } );
		} );
		const registry = makeRegistry();

		await expect(
			registry.resolveSelect( store ).getWeatherForecast( ...PARIS )
		).rejects.toThrow( 'Unable to fetch weather forecast data.' );
		expect(
			registry
				.select( store )
				.getResolutionError( 'getWeatherForecast', PARIS ).message
		).toBe( 'Unable to fetch weather forecast data.' );
		expect(
			registry.select( store ).getWeatherForecast( ...PARIS )
		).toBeNull();

		registry
			.dispatch( store )
			.invalidateResolution( 'getWeatherForecast', PARIS );
		await registry.resolveSelect( store ).getWeatherForecast( ...PARIS );

		expect(
			registry.select( store ).getWeatherForecast( ...PARIS ).current
				.temperature
		).toBe( 21 );
	} );
} );

describe( 'elio/data store: weather forecast providers', () => {
	const PROVIDERS = [
		{ slug: 'open-meteo', label: 'Open-Meteo', isDefault: true },
		{ slug: 'acme-weather', label: 'Acme Weather', isDefault: false },
	];

	beforeEach( () => {
		apiFetch.mockReset();
	} );

	it( 'has no providers before the request resolves', async () => {
		apiFetch.mockReturnValue( new Promise( () => {} ) );
		const registry = makeRegistry();

		expect(
			registry.select( store ).getWeatherForecastProviders()
		).toBeNull();
		await tick();

		expect(
			registry
				.select( store )
				.isResolving( 'getWeatherForecastProviders' )
		).toBe( true );
	} );

	it( 'lists the providers that serve the weather forecast, fetched once for every block', async () => {
		apiFetch.mockResolvedValue( PROVIDERS );
		const registry = makeRegistry();

		await Promise.all( [
			registry.resolveSelect( store ).getWeatherForecastProviders(),
			registry.resolveSelect( store ).getWeatherForecastProviders(),
		] );

		expect(
			registry.select( store ).getWeatherForecastProviders()
		).toEqual( PROVIDERS );
		expect( apiFetch ).toHaveBeenCalledTimes( 1 );
		expect( apiFetch ).toHaveBeenCalledWith( {
			path: '/elio/v1/weather-forecast/providers',
		} );
	} );

	it( 'reports a failed request', async () => {
		apiFetch.mockRejectedValue(
			new Error( 'Sorry, you are not allowed.' )
		);
		const registry = makeRegistry();

		await expect(
			registry.resolveSelect( store ).getWeatherForecastProviders()
		).rejects.toThrow( 'Sorry, you are not allowed.' );
		expect(
			registry
				.select( store )
				.getResolutionError( 'getWeatherForecastProviders' ).message
		).toBe( 'Sorry, you are not allowed.' );
		expect(
			registry.select( store ).getWeatherForecastProviders()
		).toBeNull();
	} );
} );

describe( 'elio/data store: providers', () => {
	const PROVIDERS = [
		{ slug: 'open-meteo', label: 'Open-Meteo', credentials: [] },
		{
			slug: 'acme-weather',
			label: 'Acme Weather',
			credentials: [ { name: 'api_key', secret: true, isSet: false } ],
		},
	];

	beforeEach( () => {
		apiFetch.mockReset();
	} );

	it( 'lists every provider with its credentials, fetched once', async () => {
		apiFetch.mockResolvedValue( PROVIDERS );
		const registry = makeRegistry();

		expect( registry.select( store ).getProviders() ).toBeNull();
		await Promise.all( [
			registry.resolveSelect( store ).getProviders(),
			registry.resolveSelect( store ).getProviders(),
		] );

		expect( registry.select( store ).getProviders() ).toEqual( PROVIDERS );
		expect( apiFetch ).toHaveBeenCalledTimes( 1 );
		expect( apiFetch ).toHaveBeenCalledWith( {
			path: '/elio/v1/providers',
		} );
	} );

	it( 'keeps the providers while they are fetched again once the resolution is invalidated', async () => {
		apiFetch.mockResolvedValue( PROVIDERS );
		const registry = makeRegistry();
		await registry.resolveSelect( store ).getProviders();

		let answer;
		apiFetch.mockReturnValue(
			new Promise( ( resolve ) => ( answer = resolve ) )
		);
		registry.dispatch( store ).invalidateResolution( 'getProviders' );
		const refetch = registry.resolveSelect( store ).getProviders();
		await vi.waitFor( () => expect( apiFetch ).toHaveBeenCalledTimes( 2 ) );

		expect( registry.select( store ).getProviders() ).toEqual( PROVIDERS );

		const saved = structuredClone( PROVIDERS );
		saved[ 1 ].credentials[ 0 ].isSet = true;
		answer( saved );
		await refetch;

		expect( registry.select( store ).getProviders() ).toEqual( saved );
	} );

	it( 'reports a failed request', async () => {
		apiFetch.mockRejectedValue(
			new Error( 'Sorry, you are not allowed.' )
		);
		const registry = makeRegistry();

		await expect(
			registry.resolveSelect( store ).getProviders()
		).rejects.toThrow( 'Sorry, you are not allowed.' );
		expect(
			registry.select( store ).getResolutionError( 'getProviders' )
				.message
		).toBe( 'Sorry, you are not allowed.' );
		expect( registry.select( store ).getProviders() ).toBeNull();
	} );
} );

describe( 'elio/data store: condition icon collections', () => {
	beforeEach( () => {
		apiFetch.mockReset();
	} );

	it( 'lists the collections once, from the collections endpoint', async () => {
		respondWith( {} );
		const registry = makeRegistry();

		expect(
			registry.select( store ).getConditionIconCollections()
		).toBeNull();
		const collections = await registry
			.resolveSelect( store )
			.getConditionIconCollections();
		await registry.resolveSelect( store ).getConditionIconCollections();

		expect( collections ).toEqual( COLLECTIONS );
		expect( apiFetch ).toHaveBeenCalledTimes( 1 );
		expect( apiFetch.mock.calls[ 0 ][ 0 ].path ).toBe(
			'/elio/v1/condition-icon-collections'
		);
	} );

	it( 'still fetches a weather forecast when the collections cannot be listed', async () => {
		apiFetch.mockImplementation( ( { path } ) =>
			path.startsWith( '/elio/v1/condition-icon-collections' )
				? Promise.reject( new Error( 'Not ready' ) )
				: Promise.resolve( { current: { temperature: 21 } } )
		);
		const registry = makeRegistry();

		const weatherForecast = await registry
			.resolveSelect( store )
			.getWeatherForecast( ...PARIS );

		expect( weatherForecast ).toEqual( { current: { temperature: 21 } } );
		expect( requestedQuery().has( 'icon_collections[0]' ) ).toBe( false );
	} );
} );
