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
import LocationToolbar from '../edit/location-toolbar';
import { renderWithRegistry } from '../../../test-utils/render-hook';

vi.mock( '@wordpress/block-editor', () => ( {
	BlockControls: ( { group, children } ) => (
		<div data-testid="block-controls" data-group={ group }>
			{ children }
		</div>
	),
} ) );
vi.mock( '@wordpress/components', () => ( {
	ToolbarButton: ( { icon, children, onClick } ) => (
		<button data-icon={ icon ? 'yes' : 'no' } onClick={ onClick }>
			{ children }
		</button>
	),
} ) );
vi.mock( '../../../block-editor/components/search-location-modal', () => ( {
	default: ( { isOpen, onSelect } ) =>
		isOpen ? (
			<button
				data-testid="modal"
				onClick={ () =>
					onSelect( {
						latitude: '45.76',
						longitude: '4.84',
						name: 'Lyon',
					} )
				}
			/>
		) : null,
} ) );

const PARIS = { latitude: '48.86', longitude: '2.35', name: 'Paris' };

function renderToolbar( location, setAttributes = () => {} ) {
	return renderWithRegistry(
		createRegistry(),
		<LocationToolbar
			location={ location }
			setAttributes={ setAttributes }
		/>
	).container;
}

const click = ( element ) => act( () => element.click() );

describe( 'weather-report location toolbar', () => {
	it( 'offers to search a location while the report has none', () => {
		const button = renderToolbar( {} ).querySelector( 'button' );

		expect( button.textContent ).toBe( 'Search a location' );
		expect( button.getAttribute( 'data-icon' ) ).toBe( 'no' );
	} );

	it( 'offers to edit the location once the report has one', () => {
		const button = renderToolbar( PARIS ).querySelector( 'button' );

		expect( button.textContent ).toBe( 'Edit location' );
	} );

	it( 'opens the location search from the toolbar', () => {
		const container = renderToolbar( PARIS );

		expect( container.querySelector( '[data-testid="modal"]' ) ).toBeNull();
		click( container.querySelector( 'button' ) );

		expect(
			container.querySelector( '[data-testid="modal"]' )
		).not.toBeNull();
	} );

	it( 'keeps the custom name when another place is picked', () => {
		const setAttributes = vi.fn();
		const container = renderToolbar(
			{ ...PARIS, customName: 'Home' },
			setAttributes
		);

		click( container.querySelector( 'button' ) );
		click( container.querySelector( '[data-testid="modal"]' ) );

		expect( setAttributes ).toHaveBeenCalledWith( {
			location: {
				latitude: '45.76',
				longitude: '4.84',
				name: 'Lyon',
				customName: 'Home',
			},
		} );
	} );
} );
