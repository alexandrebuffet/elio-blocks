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
import { renderHook } from '../../test-utils/render-hook';

vi.mock( '@wordpress/api-fetch', () => ( { default: vi.fn() } ) );

const PROVIDERS = [
	{ slug: 'open-meteo', label: 'Open-Meteo', credentials: [] },
	{
		slug: 'acme-weather',
		label: 'Acme Weather',
		credentials: [ { name: 'api_key', label: 'API Key', secret: true } ],
	},
];

const WEATHER_FORECAST_PROVIDERS = [
	{ slug: 'open-meteo', label: 'Open-Meteo', isDefault: true },
	{ slug: 'acme-weather', label: 'Acme Weather', isDefault: false },
];

// Stable, like the page's useCallback: a new one would fetch again.
const ignoreNotices = () => {};

async function renderUntilLoaded( useHook, addNotice = ignoreNotices ) {
	const { result } = renderHook( createRegistry(), () =>
		useHook( addNotice )
	);

	// Lets the request settle.
	await act( async () => {} );

	return result;
}

describe( 'settings page: the providers', () => {
	beforeEach( () => {
		apiFetch.mockReset();
	} );

	it( 'lists every provider, and the credentials it declares', async () => {
		apiFetch.mockResolvedValue( PROVIDERS );

		const result = await renderUntilLoaded( useProviders );

		expect( apiFetch ).toHaveBeenCalledTimes( 1 );
		expect( apiFetch ).toHaveBeenCalledWith( {
			path: '/elio/v1/providers',
			signal: expect.any( AbortSignal ),
		} );
		expect( result.current ).toEqual( PROVIDERS );
	} );

	it( 'loads the providers again when asked, once credentials are saved', async () => {
		apiFetch.mockResolvedValue( PROVIDERS );
		const { rerender } = renderHook(
			createRegistry(),
			( { version } ) => useProviders( ignoreNotices, version ),
			{ version: 0 }
		);
		await act( async () => {} );

		rerender( { version: 0 } );
		await act( async () => {} );
		expect( apiFetch ).toHaveBeenCalledTimes( 1 );

		rerender( { version: 1 } );
		await act( async () => {} );
		expect( apiFetch ).toHaveBeenCalledTimes( 2 );
	} );

	it( 'lists the providers that serve the weather forecast, for the default one', async () => {
		apiFetch.mockResolvedValue( WEATHER_FORECAST_PROVIDERS );

		const result = await renderUntilLoaded( useWeatherForecastProviders );

		expect( apiFetch ).toHaveBeenCalledTimes( 1 );
		expect( apiFetch ).toHaveBeenCalledWith( {
			path: '/elio/v1/weather-forecast/providers',
			signal: expect.any( AbortSignal ),
		} );
		expect( result.current ).toEqual( WEATHER_FORECAST_PROVIDERS );
	} );

	it.each( [
		[ 'useProviders', useProviders ],
		[ 'useWeatherForecastProviders', useWeatherForecastProviders ],
	] )(
		'%s says so when the providers could not be loaded',
		async ( name, useHook ) => {
			apiFetch.mockRejectedValue( {
				message: 'Sorry, you are not allowed.',
			} );
			const notices = [];

			const result = await renderUntilLoaded( useHook, ( ...notice ) =>
				notices.push( notice )
			);

			expect( notices ).toEqual( [
				[ 'error', 'Sorry, you are not allowed.' ],
			] );
			expect( result.current ).toEqual( [] );
		}
	);
} );
