/**
 * External dependencies
 */
import { describe, expect, it, vi } from 'vitest';

/**
 * Internal dependencies
 */
import {
	getStore,
	setContext,
	setElement,
} from '../../../test-utils/interactivity';
import '../view';

vi.mock( '@wordpress/interactivity', async () => {
	const { mockInteractivity } =
		await import( '../../../test-utils/interactivity' );
	return mockInteractivity;
} );

const store = () => getStore( 'elio/weather-report' );
const state = () => store().state;

/*
 * The block is an <svg><use href="#symbol"></use></svg> in a wrapper that
 * names it: directives bind attributes only, so the server prints them in
 * every forecast row and the browser has no markup to write. Same values as
 * DerivedState (PHP).
 */
function makeContext( overrides = {} ) {
	return {
		isDecorative: false,
		iconCollection: 'elio',
		item: {
			condition_icons: {
				elio: 'elio/partly-cloudy',
				theme: 'theme/cloud',
			},
			condition_description: 'Partly cloudy',
		},
		query: {
			data: {
				icons: {
					'elio/partly-cloudy': { style: 'stroke' },
					'elio/sun': { style: 'fill' },
					'theme/cloud': { style: 'fill' },
				},
			},
		},
		...overrides,
	};
}

describe( 'condition-icon view', () => {
	it( 'points at the symbol of the icon of the item', () => {
		setContext( makeContext() );

		expect( state().hasConditionIcon ).toBe( true );
		expect( state().conditionIconHref ).toBe(
			'#elio-condition-icon-elio--partly-cloudy'
		);
	} );

	it( 'shows the icon of the collection of the block', () => {
		setContext( makeContext( { iconCollection: 'theme' } ) );

		expect( state().conditionIconHref ).toBe(
			'#elio-condition-icon-theme--cloud'
		);
		expect( state().isStrokeConditionIcon ).toBe( false );
	} );

	it( 'points at nothing for an item without icon', () => {
		setContext(
			makeContext( { item: { condition_icons: { elio: null } } } )
		);

		expect( state().hasConditionIcon ).toBe( false );
		expect( state().conditionIconHref ).toBeNull();
	} );

	it( 'flags a stroke icon so the block strokes it', () => {
		setContext( makeContext() );
		expect( state().isStrokeConditionIcon ).toBe( true );

		setContext(
			makeContext( {
				item: {
					condition_icons: { elio: 'elio/sun' },
					condition_description: 'Clear',
				},
			} )
		);
		expect( state().isStrokeConditionIcon ).toBe( false );
	} );

	it( 'labels the icon with the condition unless it is decorative', () => {
		setContext( makeContext() );
		expect( state().conditionIconRole ).toBe( 'img' );
		expect( state().conditionIconLabel ).toBe( 'Partly cloudy' );

		for ( const overrides of [
			{ isDecorative: true },
			{
				item: {
					condition_icons: { elio: 'elio/sun' },
					condition_description: '',
				},
			},
			// Nothing on screen: a screen reader must not announce an image either.
			{
				item: {
					condition_icons: { elio: null },
					condition_description: 'Partly cloudy',
				},
			},
		] ) {
			setContext( makeContext( overrides ) );
			expect( state().conditionIconRole ).toBeNull();
			expect( state().conditionIconLabel ).toBeNull();
		}
	} );

	it( 'points the icon of the block at the symbol of its item after a refresh', () => {
		const ref = document.createElement( 'div' );
		ref.innerHTML =
			'<svg><use href="#elio-condition-icon-elio--sun"></use></svg>';
		setElement( { ref } );
		setContext( makeContext() );

		store().callbacks.linkConditionIcon();
		expect( ref.querySelector( 'use' ).getAttribute( 'href' ) ).toBe(
			'#elio-condition-icon-elio--partly-cloudy'
		);

		setContext(
			makeContext( { item: { condition_icons: { elio: null } } } )
		);
		store().callbacks.linkConditionIcon();
		expect( ref.querySelector( 'use' ).hasAttribute( 'href' ) ).toBe(
			false
		);
	} );

	it( 'writes no markup in the browser: nothing to replace once scripts run', () => {
		expect( store().callbacks?.renderConditionIcon ).toBeUndefined();
	} );
} );
