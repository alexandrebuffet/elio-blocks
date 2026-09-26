/**
 * External dependencies
 */
import { act } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * WordPress dependencies
 */
import { createRegistry } from '@wordpress/data';

/**
 * Internal dependencies
 */
import Inspector from '../inspector';
import { renderWithRegistry } from '../../../test-utils/render-hook';

vi.mock( '@wordpress/block-editor', () => ( {
	InspectorControls: ( { children } ) => <div>{ children }</div>,
} ) );
vi.mock( '@wordpress/components', () => ( {
	__experimentalToolsPanel: ( { children } ) => <div>{ children }</div>,
	__experimentalToolsPanelItem: ( { children } ) => <div>{ children }</div>,
	CheckboxControl: () => null,
	RangeControl: () => null,
} ) );
// The collection buttons, as a select: the control has its own tests.
vi.mock( '../../../block-editor/components/icon-collection-control', () => ( {
	default: ( { label, collections, value, onChange } ) => (
		<select
			aria-label={ label }
			value={ value }
			onChange={ ( event ) => onChange( event.target.value ) }
		>
			{ collections.map( ( collection ) => (
				<option key={ collection.slug } value={ collection.slug }>
					{ collection.label }
				</option>
			) ) }
		</select>
	),
} ) );
vi.mock( '../../../block-editor/hooks', () => ( {
	useConditionIconCollections: () => ( {
		collections: [
			{ slug: 'elio', label: 'Elio' },
			{ slug: 'acme-icons', label: 'Acme Icons' },
		],
		defaultCollection: 'elio',
		isResolving: false,
	} ),
} ) );

let inspector;

function renderInspector( attributes, context, setAttributes = () => {} ) {
	inspector = renderWithRegistry(
		createRegistry(),
		<Inspector
			attributes={ attributes }
			setAttributes={ setAttributes }
			context={ context }
			isStroke={ false }
		/>
	);

	return inspector.container.querySelector(
		'select[aria-label="Collection"]'
	);
}

const change = ( select, value ) =>
	act( () => {
		select.value = value;
		select.dispatchEvent( new Event( 'change', { bubbles: true } ) );
	} );

describe( 'condition-icon inspector: collection', () => {
	afterEach( () => inspector.unmount() );

	it( 'names the collections only, the one of the weather block shown while the block has none', () => {
		const select = renderInspector(
			{},
			{ 'elio/reportIconCollection': 'acme-icons' }
		);

		expect(
			Array.from( select.options, ( { value, textContent } ) => [
				value,
				textContent,
			] )
		).toEqual( [
			[ 'elio', 'Elio' ],
			[ 'acme-icons', 'Acme Icons' ],
		] );
		expect( select.value ).toBe( 'acme-icons' );
	} );

	it( 'saves none for the inherited collection, and the site one when the weather block has another', () => {
		const setAttributes = vi.fn();
		const select = renderInspector(
			{ iconCollection: 'elio' },
			{ 'elio/reportIconCollection': 'acme-icons' },
			setAttributes
		);

		expect( select.value ).toBe( 'elio' );

		change( select, 'acme-icons' );
		expect( setAttributes ).toHaveBeenLastCalledWith( {
			iconCollection: undefined,
		} );

		change( select, 'elio' );
		expect( setAttributes ).toHaveBeenLastCalledWith( {
			iconCollection: 'elio',
		} );
	} );
} );
