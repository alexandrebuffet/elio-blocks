/**
 * External dependencies
 */
import { act } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * WordPress dependencies
 */
import { createRegistry } from '@wordpress/data';
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import { useProviders, useWeatherForecastProviders } from '../use-providers';
import { store as elioDataStore } from '../../stores/elio-data';
import { renderHook } from '../../test-utils/render-hook';

vi.mock( '@wordpress/api-fetch', () => ( { default: vi.fn() } ) );

const PROVIDERS = [
	{ slug: 'open-meteo', label: 'Open-Meteo', credentials: [] },
	{
		slug: 'acme-weather',
		label: 'Acme Weather',
		credentials: [
			{
				name: 'api_key',
				label: 'API Key',
				secret: true,
				isSet: false,
			},
		],
	},
];

const WEATHER_FORECAST_PROVIDERS = [
	{ slug: 'open-meteo', label: 'Open-Meteo', isDefault: true },
	{ slug: 'acme-weather', label: 'Acme Weather', isDefault: false },
];

const ignoreNotices = () => {};

function makeRegistry() {
	const registry = createRegistry();
	registry.register( elioDataStore );
	return registry;
}

// `@wordpress/data` starts a resolver on the next tick, which then awaits the request.
const settle = () =>
	act( () => new Promise( ( resolve ) => setTimeout( resolve ) ) );

async function renderUntilLoaded(
	useHook,
	addNotice = ignoreNotices,
	registry = makeRegistry()
) {
	const { result } = renderHook( registry, () => useHook( addNotice ) );

	await settle();

	return result;
}

describe( 'settings page: the providers', () => {
	beforeEach( () => {
		apiFetch.mockReset();
	} );

	it( 'lists every provider, and the credentials it declares, from the elio/data store', async () => {
		apiFetch.mockResolvedValue( PROVIDERS );
		const registry = makeRegistry();

		const result = await renderUntilLoaded(
			useProviders,
			ignoreNotices,
			registry
		);

		expect( apiFetch ).toHaveBeenCalledTimes( 1 );
		expect( apiFetch ).toHaveBeenCalledWith( {
			path: '/elio/v1/providers',
		} );
		expect( result.current ).toEqual( PROVIDERS );
		expect( registry.select( elioDataStore ).getProviders() ).toEqual(
			PROVIDERS
		);
	} );

	it( 'is empty while the providers load', async () => {
		apiFetch.mockReturnValue( new Promise( () => {} ) );

		const result = await renderUntilLoaded( useProviders );

		expect( apiFetch ).toHaveBeenCalledTimes( 1 );
		expect( result.current ).toEqual( [] );
	} );

	it( 'loads the providers again once their resolution is invalidated, as once credentials are saved', async () => {
		apiFetch.mockResolvedValue( PROVIDERS );
		const registry = makeRegistry();
		const result = await renderUntilLoaded(
			useProviders,
			ignoreNotices,
			registry
		);

		const saved = structuredClone( PROVIDERS );
		saved[ 1 ].credentials[ 0 ].isSet = true;
		apiFetch.mockResolvedValue( saved );
		await act( () =>
			registry
				.dispatch( elioDataStore )
				.invalidateResolution( 'getProviders' )
		);
		await settle();

		expect( apiFetch ).toHaveBeenCalledTimes( 2 );
		expect( result.current ).toEqual( saved );
	} );

	it( 'lists the providers that serve the weather forecast, those the report block offers', async () => {
		apiFetch.mockResolvedValue( WEATHER_FORECAST_PROVIDERS );
		const registry = makeRegistry();

		const result = await renderUntilLoaded(
			useWeatherForecastProviders,
			ignoreNotices,
			registry
		);

		expect( apiFetch ).toHaveBeenCalledTimes( 1 );
		expect( apiFetch ).toHaveBeenCalledWith( {
			path: '/elio/v1/weather-forecast/providers',
		} );
		expect( result.current ).toEqual( WEATHER_FORECAST_PROVIDERS );
		expect(
			registry.select( elioDataStore ).getWeatherForecastProviders()
		).toEqual( WEATHER_FORECAST_PROVIDERS );
	} );

	it.each( [
		[ 'useProviders', useProviders ],
		[ 'useWeatherForecastProviders', useWeatherForecastProviders ],
	] )(
		'%s says so once when the providers could not be loaded',
		async ( name, useHook ) => {
			apiFetch.mockRejectedValue( {
				message: 'Sorry, you are not allowed.',
			} );
			const notices = [];

			const result = await renderUntilLoaded( useHook, ( ...notice ) =>
				notices.push( notice )
			);
			await settle();

			expect( notices ).toEqual( [
				[ 'error', 'Sorry, you are not allowed.' ],
			] );
			expect( result.current ).toEqual( [] );
		}
	);

	it( 'says the providers could not be loaded when the request fails without a message', async () => {
		apiFetch.mockRejectedValue( {} );
		const notices = [];

		await renderUntilLoaded( useProviders, ( ...notice ) =>
			notices.push( notice )
		);

		expect( notices ).toEqual( [
			[ 'error', 'Failed to load providers.' ],
		] );
	} );
} );
