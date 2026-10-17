/**
 * External dependencies
 */
import { act } from 'react';
import { describe, expect, it, vi } from 'vitest';

/**
 * WordPress dependencies
 */
import { createRegistry } from '@wordpress/data';

/**
 * Internal dependencies
 */
import SearchLocationModal from '..';
import { useLocationSearch } from '../../../hooks/use-location-search';
import { renderWithRegistry } from '../../../../test-utils/render-hook';

vi.mock( '../../../hooks/use-location-search', () => ( {
	useLocationSearch: vi.fn(),
} ) );

const PARIS = {
	name: 'Paris',
	admin1: 'Île-de-France',
	country: 'France',
	latitude: 48.85,
	longitude: 2.35,
};

/**
 * Types in an input as a user would: React reads the value from its own tracker.
 *
 * @param {HTMLInputElement} input Input.
 * @param {string}           value Text typed.
 */
async function type( input, value ) {
	await act( async () => {
		input.focus();
		Object.getOwnPropertyDescriptor(
			window.HTMLInputElement.prototype,
			'value'
		).set.call( input, value );
		// Base UI takes an input without `inputType` for autofill, and opens nothing.
		input.dispatchEvent(
			new window.InputEvent( 'input', {
				bubbles: true,
				inputType: 'insertText',
			} )
		);
	} );
}

describe( 'SearchLocationModal', () => {
	it( 'suggests the results of the search and selects the one picked', async () => {
		useLocationSearch.mockImplementation( ( query ) => ( {
			results: query ? [ PARIS ] : [],
			isSearching: false,
			error: null,
		} ) );
		const onSelect = vi.fn();
		const onRequestClose = vi.fn();

		renderWithRegistry(
			createRegistry(),
			<SearchLocationModal
				isOpen
				onSelect={ onSelect }
				onRequestClose={ onRequestClose }
			/>
		);
		await type( document.querySelector( '[role="combobox"]' ), 'Par' );

		// The endpoint matched the result: "Paris" is suggested for "Par" and
		// would be for a postal code too, no filter of its own drops it.
		const option = document.querySelector( '[role="option"]' );
		expect( option.textContent ).toContain( 'Île-de-France, France' );

		act( () => option.click() );

		expect( onSelect ).toHaveBeenCalledWith( {
			latitude: '48.85',
			longitude: '2.35',
			name: 'Paris',
		} );
		expect( onRequestClose ).toHaveBeenCalled();
	} );
} );
