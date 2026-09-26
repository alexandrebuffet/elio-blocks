/**
 * External dependencies
 */
import { act } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * WordPress dependencies
 */
import { createRegistry, createReduxStore } from '@wordpress/data';

/**
 * Internal dependencies
 */
import IconCollectionControl from '..';
import { renderWithRegistry } from '../../../../test-utils/render-hook';

// The block editor package only for the name of its store.
vi.mock( '@wordpress/block-editor', () => ( { store: 'core/block-editor' } ) );

const COLLECTIONS = [
	{
		slug: 'elio',
		label: 'Elio',
		preview: [
			{
				content:
					'<svg viewBox="0 0 24 24"><circle r="4"></circle></svg>',
				style: 'stroke',
			},
			null,
		],
	},
	{ slug: 'acme-icons', label: 'Acme Icons', preview: [] },
	{ slug: 'third', label: 'Third', preview: [] },
];

const SETTINGS = {
	styles: [ { css: 'body{color:tomato}' }, { assets: '<svg></svg>' } ],
};

function makeRegistry() {
	const registry = createRegistry();
	registry.register(
		createReduxStore( 'core/block-editor', {
			reducer: ( state = {} ) => state,
			selectors: { getSettings: () => SETTINGS },
		} )
	);
	return registry;
}

describe( 'IconCollectionControl', () => {
	let control;

	afterEach( () => control?.unmount() );

	// Composite settles its items after the first render.
	const render = async ( props ) => {
		control = renderWithRegistry(
			makeRegistry(),
			<IconCollectionControl
				label="Collection"
				collections={ COLLECTIONS }
				value="acme-icons"
				onChange={ () => {} }
				{ ...props }
			/>
		);
		document.body.appendChild( control.container );
		await act( async () => {} );
		return control.container;
	};

	const radios = ( container ) => [
		...container.querySelectorAll( '[role="radio"]' ),
	];

	it( 'names each collection in a radio, two a row, the value checked', async () => {
		const container = await render();

		expect(
			radios( container ).map( ( radio ) => [
				radio.textContent,
				radio.getAttribute( 'aria-checked' ),
			] )
		).toEqual( [
			[ 'Elio', 'false' ],
			[ 'Acme Icons', 'true' ],
			[ 'Third', 'false' ],
		] );
		expect(
			[
				...container.querySelectorAll(
					'.elio-icon-collection-control__row'
				),
			].map( ( row ) => row.children.length )
		).toEqual( [ 2, 1 ] );
		expect(
			container
				.querySelector( '[role="radiogroup"]' )
				.getAttribute( 'aria-label' )
		).toBe( 'Collection' );
	} );

	it( 'calls onChange with the slug clicked', async () => {
		const onChange = vi.fn();
		const container = await render( { onChange } );

		await act( async () => radios( container )[ 0 ].click() );

		expect( onChange ).toHaveBeenCalledWith( 'elio' );
	} );

	it( 'previews the icons of the collection hovered in a sandboxed iframe holding the theme styles', async () => {
		const container = await render();

		// Focus would check it: arrow keys move the choice.
		await act( async () =>
			radios( container )[ 0 ].dispatchEvent(
				new window.MouseEvent( 'mouseover', { bubbles: true } )
			)
		);
		expect( document.querySelector( '[data-iframe]' ) ).toBeNull();

		// The preview waits for the pointer or the focus to settle (250 ms).
		await act(
			() => new Promise( ( resolve ) => setTimeout( resolve, 300 ) )
		);

		const iframe = document.querySelector(
			'iframe.elio-icon-collection-control__iframe'
		);
		expect( iframe.getAttribute( 'title' ) ).toBe( 'Elio' );
		expect( iframe.getAttribute( 'sandbox' ) ).toBe( '' );
		const srcdoc = iframe.getAttribute( 'srcdoc' );
		expect( srcdoc ).toContain( '<style>body{color:tomato}\n</style>' );
		expect( srcdoc ).toContain( 'class="editor-styles-wrapper is-row"' );
		expect( srcdoc ).toContain(
			'<div class="icon is-stroke"><svg viewBox="0 0 24 24"><circle r="4"></circle></svg></div><div class="icon is-empty"></div>'
		);
	} );
} );
