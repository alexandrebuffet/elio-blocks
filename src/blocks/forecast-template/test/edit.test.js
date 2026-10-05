/**
 * External dependencies
 */
import { act } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * WordPress dependencies
 */
import { createRegistry, createReduxStore } from '@wordpress/data';

/**
 * Internal dependencies
 */
import ForecastTemplateEdit from '../edit';
import { useWeatherReport } from '../../../block-editor/hooks';
import { renderWithRegistry } from '../../../test-utils/render-hook';

// vi.mock() factories run before the module body: share the array through vi.hoisted().
const mockContexts = vi.hoisted( () => [] );

vi.mock( '@wordpress/block-editor', () => ( {
	BlockContextProvider: ( { value, children } ) => {
		mockContexts.push( value );
		return children;
	},
	__experimentalUseBlockPreview: ( { props } ) => props,
	useBlockProps: ( props ) => props ?? {},
	useInnerBlocksProps: ( props ) => ( { ...props, 'data-editable': '' } ),
} ) );
vi.mock( '../../../block-editor/hooks', () => ( {
	useWeatherReport: vi.fn(),
} ) );

const day = ( d ) => ( { timestamp: `2026-07-0${ d }T00:00:00+02:00` } );
const FORECAST = { daily: [ day( 1 ), day( 2 ), day( 3 ), day( 4 ) ] };
const INNER_BLOCKS = [ { clientId: 'datetime', name: 'elio/datetime' } ];

function makeRegistry( forecastAttributes = { type: 'daily', count: 3 } ) {
	const registry = createRegistry();
	registry.register(
		createReduxStore( 'core/block-editor', {
			reducer: ( state = {} ) => state,
			selectors: {
				getBlockParentsByBlockName: ( state, clientId, blockName ) =>
					blockName === 'elio/forecast' ? [ 'forecast' ] : [],
				getBlockAttributes: () => forecastAttributes,
				getBlocks: () => INNER_BLOCKS,
			},
		} )
	);
	return registry;
}

const rows = ( container ) => [ ...container.querySelectorAll( 'li' ) ];
const previews = ( container ) =>
	rows( container ).filter( ( li ) => li.getAttribute( 'role' ) );

describe( 'forecast-template edit', () => {
	beforeEach( () => {
		mockContexts.length = 0;
		useWeatherReport.mockReturnValue( { data: FORECAST } );
		// The morning of 1 July in Paris: the rows start at the day in progress.
		vi.useFakeTimers( { toFake: [ 'Date' ] } ).setSystemTime(
			new Date( '2026-07-01T10:00:00+02:00' )
		);
	} );

	afterEach( () => {
		vi.useRealTimers();
	} );

	it( 'repeats its inner blocks for as many rows as the forecast block asks', () => {
		renderWithRegistry(
			makeRegistry(),
			<ForecastTemplateEdit clientId="template" />
		);

		expect( mockContexts ).toEqual( [
			{ 'elio/forecastItem': day( 1 ), 'elio/forecastItemIndex': 0 },
			{ 'elio/forecastItem': day( 2 ), 'elio/forecastItemIndex': 1 },
			{ 'elio/forecastItem': day( 3 ), 'elio/forecastItemIndex': 2 },
		] );
	} );

	it( 'stays editable, with an empty row, while there is no weather forecast', () => {
		useWeatherReport.mockReturnValue( { data: null } );

		const { container } = renderWithRegistry(
			makeRegistry(),
			<ForecastTemplateEdit clientId="template" />
		);

		expect( rows( container ) ).toHaveLength( 1 );
		expect( rows( container )[ 0 ].hasAttribute( 'data-editable' ) ).toBe(
			true
		);
		expect( mockContexts ).toEqual( [
			{ 'elio/forecastItem': null, 'elio/forecastItemIndex': 0 },
		] );
	} );

	it( 'hands rows the same context on every render, so inner blocks do not re-render for nothing', () => {
		const { rerender } = renderWithRegistry(
			makeRegistry(),
			<ForecastTemplateEdit clientId="template" />
		);
		const first = [ ...mockContexts ];
		mockContexts.length = 0;

		rerender( <ForecastTemplateEdit clientId="template" /> );

		expect( mockContexts ).toHaveLength( 3 );
		mockContexts.forEach( ( context, index ) =>
			expect( context ).toBe( first[ index ] )
		);
	} );

	it( 'makes a row editable with Enter or Space, not with any key', () => {
		const { container } = renderWithRegistry(
			makeRegistry(),
			<ForecastTemplateEdit clientId="template" />
		);
		const isEditable = ( index ) =>
			previews( container )[ index ].style.display === 'none';
		const press = ( index, key ) =>
			act( () => {
				previews( container )[ index ].dispatchEvent(
					new KeyboardEvent( 'keydown', { key, bubbles: true } )
				);
			} );

		expect( isEditable( 0 ) ).toBe( true );

		press( 1, 'Tab' );
		expect( isEditable( 0 ) ).toBe( true );

		press( 1, 'Enter' );
		expect( isEditable( 1 ) ).toBe( true );

		press( 2, ' ' );
		expect( isEditable( 2 ) ).toBe( true );
	} );
} );
