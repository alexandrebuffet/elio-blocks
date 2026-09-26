/**
 * External dependencies
 */
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
import { useWeatherReport } from '../use-weather-report';
import { renderHook, advance } from '../../../test-utils/render-hook';

vi.mock( '@wordpress/api-fetch', () => ( { default: vi.fn() } ) );

const PARIS = { latitude: 48.8566, longitude: 2.3522, name: 'Paris' };
const TOKYO = { latitude: 35.6895, longitude: 139.6917, name: 'Tokyo' };

/**
 * Creates a registry with the elio/data store only. No block editor store: the hook
 * does not need one, and the block previews of a Forecast Template have one
 * without the report in it.
 *
 * @return {Object} Registry.
 */
function makeRegistry() {
	const registry = createRegistry();
	registry.register( store );
	return registry;
}

/**
 * Returns the block context a report provides to its inner blocks.
 *
 * @param {Object} attributes            Report attributes.
 * @param {Object} attributes.location   Location.
 * @param {string} [attributes.provider] Provider slug.
 * @param {string} [attributes.units]    Unit system.
 * @return {Object} Block context.
 */
const reportContext = ( { location, provider, units } ) => ( {
	'elio/reportLocation': location,
	'elio/reportProvider': provider,
	'elio/reportUnits': units,
} );

const useHook = ( { context } ) => useWeatherReport( context );

describe( 'useWeatherReport', () => {
	beforeEach( () => {
		vi.useFakeTimers();
		apiFetch.mockReset();
		apiFetch.mockImplementation( async ( { path } ) =>
			path.startsWith( '/elio/v1/condition-icon-collections' )
				? [ { slug: 'elio', label: 'Elio', is_default: true } ]
				: {
						current: {
							temperature: path.includes( '139.6917' ) ? 28 : 15,
						},
					}
		);
	} );

	afterEach( () => {
		vi.useRealTimers();
	} );

	it( 'gives a block the weather forecast of the report it sits in', async () => {
		const { result } = renderHook( makeRegistry(), useHook, {
			context: reportContext( { location: PARIS, units: 'imperial' } ),
		} );
		await advance( 1000 );

		expect( result.current ).toEqual( {
			data: { current: { temperature: 15 } },
			isLoading: false,
			error: null,
			item: { temperature: 15 },
		} );
		expect(
			apiFetch.mock.calls
				.map( ( [ { path } ] ) => path )
				.find( ( path ) =>
					path.startsWith( '/elio/v1/weather-forecast' )
				)
		).toContain( 'units=imperial' );
	} );

	it( 'loads the weather forecast once for all the blocks of a report', async () => {
		const registry = makeRegistry();
		const context = reportContext( { location: PARIS } );

		renderHook( registry, useHook, { context } );
		renderHook( registry, useHook, { context } );
		await advance( 1000 );

		expect(
			apiFetch.mock.calls.filter( ( [ { path } ] ) =>
				path.startsWith( '/elio/v1/weather-forecast' )
			)
		).toHaveLength( 1 );
	} );

	it( 'follows the location of the report', async () => {
		const { result, rerender } = renderHook( makeRegistry(), useHook, {
			context: reportContext( { location: PARIS } ),
		} );
		await advance( 1000 );

		rerender( { context: reportContext( { location: TOKYO } ) } );
		await advance( 1000 );

		expect( result.current.item ).toEqual( { temperature: 28 } );
	} );

	it( 'has nothing to show outside a report', async () => {
		const { result } = renderHook( makeRegistry(), useHook, {
			context: {},
		} );
		await advance( 1000 );

		expect( apiFetch ).not.toHaveBeenCalled();
		expect( result.current ).toEqual( {
			data: null,
			isLoading: false,
			error: null,
			item: null,
		} );
	} );
} );
