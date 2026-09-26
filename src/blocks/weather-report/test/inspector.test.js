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
import Inspector from '../inspector';
import { store as elioDataStore } from '../../../stores/elio-data';
import { renderWithRegistry } from '../../../test-utils/render-hook';

vi.mock( '@wordpress/api-fetch', () => ( { default: vi.fn() } ) );
vi.mock( '@wordpress/block-editor', () => ( {
	InspectorControls: ( { children } ) => <div>{ children }</div>,
} ) );
vi.mock( '@wordpress/components', () => ( {
	__experimentalToolsPanel: ( { children } ) => <div>{ children }</div>,
	__experimentalToolsPanelItem: ( { children } ) => <div>{ children }</div>,
	SelectControl: ( { label, value, options, onChange } ) => (
		<select
			aria-label={ label }
			value={ value }
			onChange={ ( event ) => onChange( event.target.value ) }
		>
			{ options.map( ( option ) => (
				<option key={ option.value } value={ option.value }>
					{ option.label }
				</option>
			) ) }
		</select>
	),
} ) );
vi.mock( '../../../block-editor/components/location-control', () => ( {
	default: () => null,
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

function makeRegistry() {
	const registry = createRegistry();
	registry.register( elioDataStore );
	return registry;
}

async function renderInspector( attributes, setAttributes = () => {} ) {
	const { container } = renderWithRegistry(
		makeRegistry(),
		<Inspector attributes={ attributes } setAttributes={ setAttributes } />
	);
	// The providers resolver starts on the next tick, then its request settles.
	await act( () => new Promise( ( resolve ) => setTimeout( resolve ) ) );

	return container;
}

const providerSelect = ( container ) =>
	container.querySelector( 'select[aria-label="Provider"]' );

const collectionSelect = ( container ) =>
	container.querySelector( 'select[aria-label="Icons Collection"]' );

const change = ( select, value ) =>
	act( () => {
		select.value = value;
		select.dispatchEvent( new Event( 'change', { bubbles: true } ) );
	} );

const optionsOf = ( select ) =>
	Array.from( select.options, ( { value, textContent } ) => [
		value,
		textContent,
	] );

describe( 'weather-report inspector: provider', () => {
	beforeEach( () => {
		apiFetch.mockReset();
		apiFetch.mockResolvedValue( [
			{ slug: 'open-meteo', label: 'Open-Meteo', isDefault: true },
			{ slug: 'acme-weather', label: 'Acme Weather', isDefault: false },
		] );
	} );

	it( 'offers the providers a third party registered, after the named site default', async () => {
		const select = providerSelect( await renderInspector( {} ) );

		expect( apiFetch ).toHaveBeenCalledWith( {
			path: '/elio/v1/weather-forecast/providers',
		} );
		expect( optionsOf( select ) ).toEqual( [
			[ '', 'Default (Open-Meteo)' ],
			[ 'open-meteo', 'Open-Meteo' ],
			[ 'acme-weather', 'Acme Weather' ],
		] );
		expect( select.value ).toBe( '' );
	} );

	it( 'shows the provider the block uses and saves the one picked', async () => {
		const setAttributes = vi.fn();
		const select = providerSelect(
			await renderInspector( { provider: 'acme-weather' }, setAttributes )
		);

		expect( select.value ).toBe( 'acme-weather' );

		change( select, 'open-meteo' );

		expect( setAttributes ).toHaveBeenCalledWith( {
			provider: 'open-meteo',
		} );
	} );
} );

describe( 'weather-report inspector: condition icons', () => {
	beforeEach( () => {
		apiFetch.mockReset();
		apiFetch.mockResolvedValue( [] );
	} );

	it( 'names the collections only, the site one shown while the block has none', async () => {
		const select = collectionSelect( await renderInspector( {} ) );

		expect( optionsOf( select ) ).toEqual( [
			[ 'elio', 'Elio' ],
			[ 'acme-icons', 'Acme Icons' ],
		] );
		expect( select.value ).toBe( 'elio' );
	} );

	it( 'saves the collection picked, and none for the site one', async () => {
		const setAttributes = vi.fn();
		const select = collectionSelect(
			await renderInspector(
				{ iconCollection: 'acme-icons' },
				setAttributes
			)
		);

		expect( select.value ).toBe( 'acme-icons' );

		change( select, 'elio' );
		expect( setAttributes ).toHaveBeenLastCalledWith( {
			iconCollection: undefined,
		} );

		change( select, 'acme-icons' );
		expect( setAttributes ).toHaveBeenLastCalledWith( {
			iconCollection: 'acme-icons',
		} );
	} );

	it( 'shows the site collection when the block names one no longer registered', async () => {
		const select = collectionSelect(
			await renderInspector( { iconCollection: 'gone' } )
		);

		expect( select.value ).toBe( 'elio' );
	} );
} );
