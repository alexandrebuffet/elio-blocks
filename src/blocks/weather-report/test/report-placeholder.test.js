/**
 * External dependencies
 */
import { act } from 'react';
import { describe, expect, it, vi } from 'vitest';

/**
 * WordPress dependencies
 */
import { createRegistry, createReduxStore } from '@wordpress/data';

/**
 * Internal dependencies
 */
import ReportPlaceholder from '../edit/report-placeholder';
import { renderWithRegistry } from '../../../test-utils/render-hook';

vi.mock( '@wordpress/block-editor', () => ( {
	store: 'core/block-editor',
	useBlockProps: ( props ) => props ?? {},
	__experimentalBlockVariationPicker: ( { variations, onSelect } ) =>
		variations.map( ( variation ) => (
			<button
				key={ variation.name }
				data-variation={ variation.name }
				onClick={ () => onSelect( variation ) }
			>
				{ variation.title }
			</button>
		) ),
} ) );
vi.mock( '@wordpress/blocks', () => ( {
	store: 'core/blocks',
	createBlocksFromInnerBlocksTemplate: ( template ) =>
		template.map( ( [ name ] ) => ( { name } ) ),
} ) );
vi.mock( '@wordpress/components', () => ( {
	Button: ( { children, onClick } ) => (
		<button onClick={ onClick }>{ children }</button>
	),
	Placeholder: ( { children } ) => <div>{ children }</div>,
} ) );
vi.mock( '@wordpress/compose', () => ( {
	useResizeObserver: () => undefined,
} ) );
vi.mock( '../../../block-editor/components/search-location-modal', () => ( {
	default: ( { isOpen, onSelect } ) =>
		isOpen ? (
			<button
				data-testid="modal"
				onClick={ () =>
					onSelect( {
						latitude: 48.8566,
						longitude: 2.3522,
						name: 'Paris',
					} )
				}
			/>
		) : null,
} ) );

const BLOCK_TYPE = { title: 'Weather' };

const VARIATIONS = [
	{
		name: 'elio/current-weather',
		title: 'Default',
		attributes: {},
		innerBlocks: [ [ 'elio/location' ], [ 'elio/temperature' ] ],
	},
	{
		name: 'elio/current-weather-minimalist',
		title: 'Minimal',
		attributes: {
			layout: {
				type: 'flex',
				flexWrap: 'nowrap',
				justifyContent: 'center',
			},
		},
		innerBlocks: [ [ 'elio/condition-icon' ], [ 'elio/temperature' ] ],
	},
];

function makeRegistry( replaceInnerBlocks ) {
	const registry = createRegistry();
	registry.register(
		createReduxStore( 'core/blocks', {
			reducer: ( state = {} ) => state,
			selectors: {
				getBlockType: () => BLOCK_TYPE,
				getActiveBlockVariation: () => undefined,
				getBlockVariations: () => VARIATIONS,
			},
		} )
	);
	registry.register(
		createReduxStore( 'core/block-editor', {
			reducer: ( state = {} ) => state,
			actions: {
				replaceInnerBlocks: ( ...args ) => {
					replaceInnerBlocks( ...args );
					return { type: 'REPLACE_INNER_BLOCKS' };
				},
			},
		} )
	);
	return registry;
}

function renderPlaceholder() {
	const setAttributes = vi.fn();
	const replaceInnerBlocks = vi.fn();
	const { container } = renderWithRegistry(
		makeRegistry( replaceInnerBlocks ),
		<ReportPlaceholder
			clientId="report"
			attributes={ {} }
			setAttributes={ setAttributes }
		/>
	);
	return { container, setAttributes, replaceInnerBlocks };
}

const click = ( element ) => act( () => element.click() );

const button = ( container, text ) =>
	[ ...container.querySelectorAll( 'button' ) ].find(
		( element ) => element.textContent === text
	);

describe( 'weather-report placeholder', () => {
	it( 'gives the report the layout of the variation picked after "Start blank"', () => {
		const { container, setAttributes, replaceInnerBlocks } =
			renderPlaceholder();

		click( button( container, 'Start blank' ) );
		click( button( container, 'Minimal' ) );

		// Minimal lays the icon and the temperature out in a row, as its icon shows.
		expect( setAttributes ).toHaveBeenCalledWith( {
			layout: {
				type: 'flex',
				flexWrap: 'nowrap',
				justifyContent: 'center',
			},
		} );
		expect( replaceInnerBlocks ).toHaveBeenCalledWith(
			'report',
			[ { name: 'elio/condition-icon' }, { name: 'elio/temperature' } ],
			false
		);
	} );

	it( 'fills the report with the default variation once a location is picked', () => {
		const { container, setAttributes, replaceInnerBlocks } =
			renderPlaceholder();

		click( button( container, 'Search a location' ) );
		click( container.querySelector( '[data-testid="modal"]' ) );

		expect( setAttributes ).toHaveBeenCalledWith( {
			location: { latitude: 48.8566, longitude: 2.3522, name: 'Paris' },
		} );
		expect( replaceInnerBlocks ).toHaveBeenCalledWith(
			'report',
			[ { name: 'elio/location' }, { name: 'elio/temperature' } ],
			false
		);
	} );
} );
