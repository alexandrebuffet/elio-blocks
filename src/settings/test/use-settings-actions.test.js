/**
 * External dependencies
 */
import { act } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * WordPress dependencies
 */
import { createRegistry, createReduxStore } from '@wordpress/data';
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import { useSaveSettings } from '../use-settings-actions';
import { renderHook } from '../../test-utils/render-hook';

vi.mock( '@wordpress/api-fetch', () => ( { default: vi.fn() } ) );
// The real package does not load under jsdom; only the name of its store is needed.
vi.mock( '@wordpress/core-data', () => ( { store: 'core' } ) );

/**
 * Creates a registry with a `core` store that saves like the real one: it only saves
 * the edits of the record asked for (the site settings have no ID), and a
 * failed save resolves quietly unless the caller asks for `throwOnError`.
 *
 * @param {boolean} saveFails Whether the REST request fails.
 * @return {Object} Registry.
 */
function makeRegistry( saveFails ) {
	const registry = createRegistry();
	registry.register(
		createReduxStore( 'core', {
			reducer: ( state = {} ) => state,
			actions: {
				saveEditedEntityRecord:
					( kind, name, recordId, options = {} ) =>
					async () => {
						if ( recordId !== undefined ) {
							// No edits for that record: nothing is sent.
							return undefined;
						}
						if ( saveFails && options.throwOnError ) {
							throw new Error( 'rest_forbidden' );
						}
						return saveFails ? undefined : { title: 'Site' };
					},
			},
		} )
	);
	return registry;
}

describe( 'settings page: saving the settings', () => {
	it( 'confirms a save that went through', async () => {
		const notices = [];
		const { result } = renderHook( makeRegistry( false ), () =>
			useSaveSettings( ( status, message ) =>
				notices.push( [ status, message ] )
			)
		);

		await act( () => result.current.save() );

		expect( notices ).toEqual( [ [ 'success', 'Settings saved.' ] ] );
		expect( result.current.isSaving ).toBe( false );
	} );

	it( 'does not claim the settings are saved when the request failed', async () => {
		const notices = [];
		const { result } = renderHook( makeRegistry( true ), () =>
			useSaveSettings( ( status, message ) =>
				notices.push( [ status, message ] )
			)
		);

		await act( () => result.current.save() );

		expect( notices ).toEqual( [
			[ 'error', 'Failed to save settings.' ],
		] );
		expect( result.current.isSaving ).toBe( false );
	} );
} );

describe( 'settings page: saving the provider credentials with the settings', () => {
	beforeEach( () => {
		apiFetch.mockReset();
	} );

	it( 'posts the credentials of each provider to its endpoint, and confirms once', async () => {
		apiFetch.mockResolvedValue( {} );
		const notices = [];
		const { result } = renderHook( makeRegistry( false ), () =>
			useSaveSettings( ( status, message ) =>
				notices.push( [ status, message ] )
			)
		);

		let saved;
		await act( async () => {
			saved = await result.current.save( {
				'acme-weather': { username: 'me', password: 's3cret' },
				'acme-air': { api_key: '' },
			} );
		} );

		expect( apiFetch ).toHaveBeenCalledTimes( 2 );
		expect( apiFetch ).toHaveBeenCalledWith( {
			path: '/elio/v1/providers/acme-weather/credentials',
			method: 'POST',
			data: { credentials: { username: 'me', password: 's3cret' } },
		} );
		expect( apiFetch ).toHaveBeenCalledWith( {
			path: '/elio/v1/providers/acme-air/credentials',
			method: 'POST',
			data: { credentials: { api_key: '' } },
		} );
		expect( saved ).toBe( true );
		expect( notices ).toEqual( [ [ 'success', 'Settings saved.' ] ] );
	} );

	it( 'posts the providers one after the other: each request rewrites the option of them all', async () => {
		let resolveFirst;
		apiFetch.mockImplementationOnce(
			() => new Promise( ( resolve ) => ( resolveFirst = resolve ) )
		);
		apiFetch.mockResolvedValue( {} );
		const { result } = renderHook( makeRegistry( false ), () =>
			useSaveSettings( () => {} )
		);

		let saving;
		await act( async () => {
			saving = result.current.save( {
				'acme-weather': { api_key: 'k3y' },
				'acme-air': { api_key: 'k3y' },
			} );
		} );
		expect( apiFetch ).toHaveBeenCalledTimes( 1 );

		await act( async () => {
			resolveFirst( {} );
			await saving;
		} );
		expect( apiFetch ).toHaveBeenCalledTimes( 2 );
	} );

	it( 'says so when credentials could not be saved', async () => {
		apiFetch.mockRejectedValue( {
			message: 'Sorry, you are not allowed.',
		} );
		const notices = [];
		const { result } = renderHook( makeRegistry( false ), () =>
			useSaveSettings( ( status, message ) =>
				notices.push( [ status, message ] )
			)
		);

		let saved;
		await act( async () => {
			saved = await result.current.save( {
				'acme-weather': { api_key: 'k3y' },
			} );
		} );

		expect( saved ).toBe( false );
		expect( notices ).toEqual( [
			[ 'error', 'Sorry, you are not allowed.' ],
		] );
	} );

	it( 'posts no credentials when the settings could not be saved', async () => {
		const { result } = renderHook( makeRegistry( true ), () =>
			useSaveSettings( () => {} )
		);

		await act( () =>
			result.current.save( { 'acme-weather': { api_key: 'k3y' } } )
		);

		expect( apiFetch ).not.toHaveBeenCalled();
	} );
} );
