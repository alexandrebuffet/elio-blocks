/**
 * External dependencies
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

/**
 * Internal dependencies
 */
import { defineIcons, symbolId } from '../icon-sprite';

const SUN =
	'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" width="24" class="x" stroke-width="1.5"><path d="M1 1"></path></svg>';
const MOON = '<svg viewBox="0 0 24 24"><path d="M2 2"></path></svg>';
const SUN_WITH_GRADIENT =
	'<svg viewBox="0 0 24 24"><linearGradient id="a"><stop offset="0" stop-color="#fff"></stop></linearGradient>' +
	'<path fill="url(#a)" d="M1 1"></path></svg>';
const MOON_WITH_GRADIENT =
	'<svg viewBox="0 0 24 24"><linearGradient id="a"><stop offset="0" stop-color="#000"></stop></linearGradient>' +
	'<path fill="url(#a)" d="M2 2"></path></svg>';

describe( 'defineIcons', () => {
	let block;

	beforeEach( () => {
		block = document.createElement( 'section' );
		document.body.appendChild( block );
	} );

	afterEach( () => {
		document.body.innerHTML = '';
	} );

	it( 'defines a symbol for each icon the page does not have yet', () => {
		defineIcons(
			{
				'elio/sun': { content: SUN },
				'elio/moon': { content: MOON },
			},
			block
		);

		const symbol = document.getElementById(
			'elio-condition-icon-elio--moon'
		);
		expect( symbol.tagName ).toBe( 'symbol' );
		expect( symbol.namespaceURI ).toBe( 'http://www.w3.org/2000/svg' );
		expect( symbol.querySelector( 'path' ).getAttribute( 'd' ) ).toBe(
			'M2 2'
		);
	} );

	it( 'leaves alone the symbols the server printed', () => {
		block.innerHTML =
			'<svg class="wp-block-elio-weather-report__condition-icons-sprite"><symbol id="elio-condition-icon-elio--sun"><svg><path d="SERVER"></path></svg></symbol></svg>';

		defineIcons( { 'elio/sun': { content: SUN } }, block );

		expect(
			document.querySelectorAll( '#elio-condition-icon-elio--sun' )
		).toHaveLength( 1 );
		expect( document.querySelector( 'path' ).getAttribute( 'd' ) ).toBe(
			'SERVER'
		);
	} );

	it( 'keeps the drawing of the icon, not what belongs to the block', () => {
		defineIcons( { 'elio/sun': { content: SUN } }, block );

		const svg = document.querySelector(
			'#elio-condition-icon-elio--sun > svg'
		);
		expect( svg.getAttribute( 'viewBox' ) ).toBe( '0 0 24 24' );
		expect( svg.getAttribute( 'fill' ) ).toBe( 'none' );
		for ( const name of [ 'width', 'class', 'stroke-width' ] ) {
			expect( svg.hasAttribute( name ) ).toBe( false );
		}
	} );

	it( 'puts them in one sprite of the block, first in it and hidden from assistive technology', () => {
		block.innerHTML = '<p>inner blocks</p>';

		defineIcons( { 'elio/sun': { content: SUN } }, block );
		defineIcons( { 'elio/moon': { content: MOON } }, block );

		const sprites = block.querySelectorAll( 'svg:not(symbol svg)' );
		expect( sprites ).toHaveLength( 1 );
		expect( block.firstElementChild ).toBe( sprites[ 0 ] );
		expect( sprites[ 0 ].getAttribute( 'class' ) ).toBe(
			'wp-block-elio-weather-report__condition-icons-sprite'
		);
		expect( sprites[ 0 ].getAttribute( 'aria-hidden' ) ).toBe( 'true' );
		// Hidden by the stylesheet of the block, not inline.
		expect( sprites[ 0 ].hasAttribute( 'style' ) ).toBe( false );
		expect( sprites[ 0 ].children ).toHaveLength( 2 );
	} );

	it( 'adds them to the sprite the server printed in the block', () => {
		block.innerHTML =
			'<svg class="wp-block-elio-weather-report__condition-icons-sprite"><symbol id="elio-condition-icon-elio--sun"></symbol></svg><p>inner blocks</p>';

		defineIcons( { 'elio/moon': { content: MOON } }, block );

		expect(
			document.getElementById( 'elio-condition-icon-elio--moon' )
				.parentElement
		).toBe( block.firstElementChild );
		expect( block.querySelectorAll( 'svg:not(symbol svg)' ) ).toHaveLength(
			1
		);
	} );

	it( 'ignores what is not an SVG icon', () => {
		defineIcons(
			{
				a: null,
				b: { content: '' },
				c: { content: '<p>x</p>' },
			},
			block
		);
		defineIcons( null, block );

		expect( block.innerHTML ).toBe( '' );
	} );

	it( 'prefixes inner ids per symbol so two icons do not share a gradient', () => {
		defineIcons(
			{
				'elio/sun': { content: SUN_WITH_GRADIENT },
				'elio/moon': { content: MOON_WITH_GRADIENT },
			},
			block
		);

		const sun = document.querySelector(
			'#elio-condition-icon-elio--sun svg'
		);
		const moon = document.querySelector(
			'#elio-condition-icon-elio--moon svg'
		);

		expect(
			sun.querySelector( 'linearGradient' ).getAttribute( 'id' )
		).toBe( 'elio-condition-icon-elio--sun-a' );
		expect( sun.querySelector( 'path' ).getAttribute( 'fill' ) ).toBe(
			'url(#elio-condition-icon-elio--sun-a)'
		);
		expect(
			moon.querySelector( 'linearGradient' ).getAttribute( 'id' )
		).toBe( 'elio-condition-icon-elio--moon-a' );
		expect( moon.querySelector( 'path' ).getAttribute( 'fill' ) ).toBe(
			'url(#elio-condition-icon-elio--moon-a)'
		);
	} );

	it( 'rewrites href and xlink:href references to inner ids too', () => {
		defineIcons(
			{
				'elio/sun': {
					content:
						'<svg viewBox="0 0 24 24"><mask id="m"><rect></rect></mask>' +
						'<use href="#m" xlink:href="#m"></use></svg>',
				},
			},
			block
		);

		const use = document.querySelector(
			'#elio-condition-icon-elio--sun use'
		);

		expect(
			document
				.querySelector( '#elio-condition-icon-elio--sun mask' )
				.getAttribute( 'id' )
		).toBe( 'elio-condition-icon-elio--sun-m' );
		expect( use.getAttribute( 'href' ) ).toBe(
			'#elio-condition-icon-elio--sun-m'
		);
		expect( use.getAttribute( 'xlink:href' ) ).toBe(
			'#elio-condition-icon-elio--sun-m'
		);
	} );
} );

describe( 'symbolId', () => {
	it( 'gives the id IconSprite gives, from the qualified name, safe in an href', () => {
		expect( symbolId( 'elio/sun' ) ).toBe(
			'elio-condition-icon-elio--sun'
		);
		expect( symbolId( 'sun cloud">' ) ).toBe(
			'elio-condition-icon-sun_cloud__'
		);
	} );
} );
