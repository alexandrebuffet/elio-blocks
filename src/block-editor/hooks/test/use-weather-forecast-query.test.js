/**
 * External dependencies
 */
import { act } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * WordPress dependencies
 */
import { createRegistry } from '@wordpress/data';
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import { store } from '../../../stores/elio-data';
import { useWeatherForecastQuery } from '../use-weather-forecast-query';
import { renderHook, advance } from '../../../test-utils/render-hook';

vi.mock( '@wordpress/api-fetch', () => ( { default: vi.fn() } ) );

const PARIS = { latitude: 48.8566, longitude: 2.3522, provider: '', units: '' };

function makeRegistry() {
	const registry = createRegistry();
	registry.register( store );
	return registry;
}

const forecastCalls = () =>
	apiFetch.mock.calls.filter( ( [ { path } ] ) =>
		path.startsWith( '/elio/v1/weather-forecast' )
	);

function requestedLatitudes() {
	return forecastCalls().map( ( [ { path } ] ) =>
		new URLSearchParams( path.split( '?' )[ 1 ] ).get( 'latitude' )
	);
}

describe( 'useWeatherForecastQuery', () => {
	beforeEach( () => {
		vi.useFakeTimers();
		apiFetch.mockReset();
		apiFetch.mockResolvedValue( { current: { temperature: 21 } } );
	} );

	afterEach( () => {
		vi.useRealTimers();
	} );

	it( 'loads the weather forecast of the location', async () => {
		const { result } = renderHook(
			makeRegistry(),
			useWeatherForecastQuery,
			PARIS
		);

		expect( result.current ).toEqual( {
			data: null,
			isLoading: true,
			error: null,
		} );

		await advance( 1000 );

		expect( result.current ).toEqual( {
			data: { current: { temperature: 21 } },
			isLoading: false,
			error: null,
		} );
	} );

	it( 'does not ask anything without a location', async () => {
		const { result } = renderHook(
			makeRegistry(),
			useWeatherForecastQuery,
			{
				latitude: '',
				longitude: '',
			}
		);

		await advance( 1000 );

		expect( apiFetch ).not.toHaveBeenCalled();
		expect( result.current ).toEqual( {
			data: null,
			isLoading: false,
			error: null,
		} );
	} );

	it( 'loads a location on the equator and the prime meridian', async () => {
		renderHook( makeRegistry(), useWeatherForecastQuery, {
			latitude: 0,
			longitude: 0,
		} );

		await advance( 1000 );

		expect( requestedLatitudes() ).toEqual( [ '0' ] );
	} );

	it( 'waits for the coordinates to settle while they are being typed', async () => {
		const { result, rerender } = renderHook(
			makeRegistry(),
			useWeatherForecastQuery,
			PARIS
		);
		await advance( 1000 );

		rerender( { ...PARIS, latitude: 4 } );
		await advance( 100 );
		rerender( { ...PARIS, latitude: 45 } );
		await advance( 100 );
		rerender( { ...PARIS, latitude: 45.76 } );

		// Meanwhile the previous weather forecast stays on screen.
		expect( result.current ).toEqual( {
			data: { current: { temperature: 21 } },
			isLoading: true,
			error: null,
		} );

		await advance( 1000 );

		expect( requestedLatitudes() ).toEqual( [ '48.8566', '45.76' ] );
		expect( result.current.isLoading ).toBe( false );
	} );

	it( 'keeps the weather forecast shown until the next one is there', async () => {
		const { result, rerender } = renderHook(
			makeRegistry(),
			useWeatherForecastQuery,
			PARIS
		);
		await advance( 1000 );

		let answer;
		apiFetch.mockImplementation(
			() => new Promise( ( resolve ) => ( answer = resolve ) )
		);
		rerender( { ...PARIS, latitude: 45.76, longitude: 4.84 } );
		await advance( 1000 );

		expect( requestedLatitudes() ).toEqual( [ '48.8566', '45.76' ] );
		expect( result.current ).toEqual( {
			data: { current: { temperature: 21 } },
			isLoading: true,
			error: null,
		} );

		answer( { current: { temperature: 18 } } );
		await advance( 1 );

		expect( result.current ).toEqual( {
			data: { current: { temperature: 18 } },
			isLoading: false,
			error: null,
		} );
	} );

	it( 'does not keep the weather forecast of another location when the request fails', async () => {
		const { result, rerender } = renderHook(
			makeRegistry(),
			useWeatherForecastQuery,
			PARIS
		);
		await advance( 1000 );

		apiFetch.mockRejectedValue(
			new Error( 'Unable to fetch weather forecast data.' )
		);
		rerender( { ...PARIS, latitude: 45.76, longitude: 4.84 } );
		await advance( 1000 );

		expect( result.current ).toEqual( {
			data: null,
			isLoading: false,
			error: 'Unable to fetch weather forecast data.',
		} );
	} );

	it( 'keeps the weather forecast shown, without an error, when a refresh fails', async () => {
		const registry = makeRegistry();
		const { result } = renderHook(
			registry,
			useWeatherForecastQuery,
			PARIS
		);
		await advance( 1000 );

		// Asked again (the store refreshes it), before the network is back.
		apiFetch.mockRejectedValue(
			new Error(
				'Unable to connect. Please check your Internet connection.'
			)
		);
		act( () => {
			registry
				.dispatch( store )
				.invalidateResolution( 'getWeatherForecast', [
					PARIS.latitude,
					PARIS.longitude,
					PARIS.provider,
					PARIS.units,
				] );
		} );
		await advance( 1000 );

		expect( forecastCalls() ).toHaveLength( 2 );
		expect( result.current ).toEqual( {
			data: { current: { temperature: 21 } },
			isLoading: false,
			error: null,
		} );
	} );

	it( 'reports a failed request', async () => {
		apiFetch.mockRejectedValue(
			new Error( 'Unable to fetch weather forecast data.' )
		);
		const { result } = renderHook(
			makeRegistry(),
			useWeatherForecastQuery,
			PARIS
		);

		await advance( 1000 );

		expect( result.current ).toEqual( {
			data: null,
			isLoading: false,
			error: 'Unable to fetch weather forecast data.',
		} );
	} );

	it( 'shows the weather forecast right away when another block already loaded it', async () => {
		const registry = makeRegistry();
		renderHook( registry, useWeatherForecastQuery, PARIS );
		await advance( 1000 );

		const { result } = renderHook(
			registry,
			useWeatherForecastQuery,
			PARIS
		);

		expect( result.current.data ).toEqual( {
			current: { temperature: 21 },
		} );
		expect( result.current.isLoading ).toBe( false );
		expect( forecastCalls() ).toHaveLength( 1 );
	} );

	it( 'forgets the coordinates being typed when the block is removed', async () => {
		const { rerender, unmount } = renderHook(
			makeRegistry(),
			useWeatherForecastQuery,
			PARIS
		);
		await advance( 1000 );
		rerender( { ...PARIS, latitude: 4 } );

		unmount();
		await advance( 1000 );

		expect( requestedLatitudes() ).toEqual( [ '48.8566' ] );
	} );
} );
