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
import { useLocationSearch } from '../use-location-search';
import { renderHook, advance } from '../../../test-utils/render-hook';

vi.mock( '@wordpress/api-fetch', () => ( { default: vi.fn() } ) );

const useHook = ( { query, enabled = true } ) =>
	useLocationSearch( query, { enabled } );

const PARIS = { name: 'Paris', latitude: 48.85, longitude: 2.35 };
const PARAY = { name: 'Paray-le-Monial', latitude: 46.45, longitude: 4.12 };

/** Requests in flight, by search term: resolve or reject them when the test decides. */
let pending;

describe( 'useLocationSearch', () => {
	beforeEach( () => {
		vi.useFakeTimers();
		pending = {};
		apiFetch.mockReset();
		apiFetch.mockImplementation(
			( { path, signal } ) =>
				new Promise( ( resolve, reject ) => {
					const term = new URLSearchParams(
						path.split( '?' )[ 1 ]
					).get( 'search' );
					pending[ term ] = { resolve, reject, signal };
				} )
		);
	} );

	afterEach( () => {
		vi.useRealTimers();
	} );

	it( 'searches once typing pauses', async () => {
		const { result, rerender } = renderHook( createRegistry(), useHook, {
			query: 'P',
		} );
		await advance( 100 );
		rerender( { query: 'Pa' } );
		await advance( 100 );
		rerender( { query: 'Par' } );
		await advance( 400 );

		expect( Object.keys( pending ) ).toEqual( [ 'Par' ] );
		expect( result.current.isSearching ).toBe( true );

		pending.Par.resolve( { success: true, data: [ PARIS ] } );
		await advance( 1 );

		expect( result.current ).toEqual( {
			results: [ PARIS ],
			isSearching: false,
			error: null,
		} );
	} );

	it( 'never shows the results of a previous term, even when they arrive last', async () => {
		const { result, rerender } = renderHook( createRegistry(), useHook, {
			query: 'Par',
		} );
		await advance( 400 );
		rerender( { query: 'Paray' } );
		await advance( 400 );

		pending.Paray.resolve( { success: true, data: [ PARAY ] } );
		await advance( 1 );
		pending.Par.resolve( { success: true, data: [ PARIS ] } );
		await advance( 1 );

		expect( result.current.results ).toEqual( [ PARAY ] );
	} );

	it( 'cancels the request of a term that is no longer wanted', async () => {
		const { rerender } = renderHook( createRegistry(), useHook, {
			query: 'Par',
		} );
		await advance( 400 );
		const { signal } = pending.Par;

		rerender( { query: 'Paray' } );
		await advance( 1 );

		expect( signal.aborted ).toBe( true );
	} );

	it( 'cancels the request when the modal closes, without reporting an error', async () => {
		const { result, unmount, rerender } = renderHook(
			createRegistry(),
			useHook,
			{ query: 'Par' }
		);
		await advance( 400 );
		const { signal, reject } = pending.Par;

		rerender( { query: 'Par', enabled: false } );
		reject(
			new DOMException( 'The user aborted a request.', 'AbortError' )
		);
		await advance( 1 );

		expect( signal.aborted ).toBe( true );
		expect( result.current ).toEqual( {
			results: [],
			isSearching: false,
			error: null,
		} );
		unmount();
	} );

	it( 'does not search for an empty term', async () => {
		const { result } = renderHook( createRegistry(), useHook, {
			query: '   ',
		} );
		await advance( 400 );

		expect( apiFetch ).not.toHaveBeenCalled();
		expect( result.current.results ).toEqual( [] );
	} );

	it( 'reports a failed search', async () => {
		const { result } = renderHook( createRegistry(), useHook, {
			query: 'Par',
		} );
		await advance( 400 );

		pending.Par.reject( { message: 'Unable to search locations.' } );
		await advance( 1 );

		expect( result.current ).toEqual( {
			results: [],
			isSearching: false,
			error: 'Unable to search locations.',
		} );
	} );

	it( 'encodes the term in the request', async () => {
		renderHook( createRegistry(), useHook, {
			query: 'Saint-Étienne & co',
		} );
		await advance( 400 );

		expect( Object.keys( pending ) ).toEqual( [ 'Saint-Étienne & co' ] );
		expect( apiFetch.mock.calls[ 0 ][ 0 ].path ).toMatch(
			/^\/elio\/v1\/geocoding\?/
		);
	} );
} );
