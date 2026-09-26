/**
 * External dependencies
 */
import { act } from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

/**
 * WordPress dependencies
 */
import { Page } from '@wordpress/admin-ui';
import { createRegistry } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { SectionLink, useSettingsSections } from '../settings-sections';
import { renderWithRegistry } from '../../test-utils/render-hook';

const SECTIONS = [
	{ name: 'general', label: 'General' },
	{ name: 'advanced', label: 'Advanced' },
];

const PAGE_URL = '/wp-admin/admin.php?page=elio-blocks-settings';

function SectionsPage() {
	const { section, navigation } = useSettingsSections( SECTIONS );
	return (
		<Page
			title="Elio Blocks"
			navigation={ navigation }
			components={ { link: SectionLink } }
			showSidebarToggle={ false }
		>
			<p className="section">{ section }</p>
		</Page>
	);
}

/**
 * Clicks a link and tells whether the page handled the click itself.
 *
 * @param {HTMLElement} container Element the page is rendered in.
 * @param {string}      label     Text of the link.
 * @param {Object}      init      Modifier keys and button of the click.
 * @return {boolean} Whether the click was kept from following the link.
 */
function click( container, label, init = {} ) {
	const link = [ ...container.querySelectorAll( 'nav a' ) ].find(
		( a ) => a.textContent === label
	);
	let handled;
	// Runs after React's listener on the same element; jsdom cannot follow a link.
	const record = ( event ) => {
		handled = event.defaultPrevented;
		event.preventDefault();
	};
	container.addEventListener( 'click', record );
	act( () => {
		link.dispatchEvent(
			new window.MouseEvent( 'click', {
				bubbles: true,
				cancelable: true,
				button: 0,
				...init,
			} )
		);
	} );
	container.removeEventListener( 'click', record );
	return handled;
}

function links( container ) {
	return [ ...container.querySelectorAll( 'nav a' ) ].map( ( a ) => ( {
		label: a.textContent,
		href: a.getAttribute( 'href' ),
		current: a.getAttribute( 'aria-current' ),
	} ) );
}

describe( 'settings page: sections', () => {
	let page;

	beforeEach( () => {
		window.history.replaceState( null, '', PAGE_URL );
	} );

	afterEach( () => {
		page?.unmount();
		page = undefined;
	} );

	const render = () => {
		page = renderWithRegistry( createRegistry(), <SectionsPage /> );
		return page.container;
	};
	const shown = ( container ) =>
		container.querySelector( '.section' ).textContent;
	const url = ( query ) =>
		`${ window.location.origin }/wp-admin/admin.php?${ query }`;

	it( 'links each section from the page header, the first one at the page URL', () => {
		const container = render();

		expect( shown( container ) ).toBe( 'general' );
		expect( links( container ) ).toEqual( [
			{
				label: 'General',
				href: url( 'page=elio-blocks-settings' ),
				current: 'page',
			},
			{
				label: 'Advanced',
				href: url( 'page=elio-blocks-settings&section=advanced' ),
				current: null,
			},
		] );
	} );

	it( 'shows the section the URL names', () => {
		window.history.replaceState(
			null,
			'',
			`${ PAGE_URL }&section=advanced`
		);
		const container = render();

		expect( shown( container ) ).toBe( 'advanced' );
		expect( links( container ).map( ( link ) => link.current ) ).toEqual( [
			null,
			'page',
		] );
	} );

	it( 'shows the first section when the URL names none it knows', () => {
		window.history.replaceState( null, '', `${ PAGE_URL }&section=nope` );
		const container = render();

		expect( shown( container ) ).toBe( 'general' );
		expect( links( container )[ 0 ] ).toMatchObject( {
			href: url( 'page=elio-blocks-settings' ),
			current: 'page',
		} );
	} );

	it( 'keeps the other query args of the page in the links', () => {
		window.history.replaceState(
			null,
			'',
			`${ PAGE_URL }&section=advanced&lang=fr`
		);
		const container = render();

		expect( links( container ).map( ( link ) => link.href ) ).toEqual( [
			url( 'page=elio-blocks-settings&lang=fr' ),
			url( 'page=elio-blocks-settings&lang=fr&section=advanced' ),
		] );
	} );

	it( 'switches section in place and puts it in the URL', () => {
		const container = render();
		const entries = window.history.length;

		expect( click( container, 'Advanced' ) ).toBe( true );
		expect( window.location.href ).toBe(
			url( 'page=elio-blocks-settings&section=advanced' )
		);
		expect( window.history.length ).toBe( entries + 1 );
		expect( shown( container ) ).toBe( 'advanced' );

		expect( click( container, 'General' ) ).toBe( true );
		expect( window.location.href ).toBe(
			url( 'page=elio-blocks-settings' )
		);
		expect( shown( container ) ).toBe( 'general' );
	} );

	it( 'adds no history entry for the section already shown', () => {
		const container = render();
		const entries = window.history.length;

		expect( click( container, 'General' ) ).toBe( true );
		expect( window.history.length ).toBe( entries );
	} );

	it.each( [
		[ 'ctrlKey', { ctrlKey: true } ],
		[ 'metaKey', { metaKey: true } ],
		[ 'shiftKey', { shiftKey: true } ],
		[ 'altKey', { altKey: true } ],
		[ 'middle button', { button: 1 } ],
	] )(
		'lets the browser follow a click with %s (new tab, window)',
		( _, init ) => {
			const container = render();

			expect( click( container, 'Advanced', init ) ).toBe( false );
			expect( window.location.href ).toBe(
				url( 'page=elio-blocks-settings' )
			);
			expect( shown( container ) ).toBe( 'general' );
		}
	);

	it( 'follows the back and forward buttons', () => {
		const container = render();
		click( container, 'Advanced' );

		act( () => {
			window.history.replaceState( null, '', PAGE_URL );
			window.dispatchEvent( new window.PopStateEvent( 'popstate' ) );
		} );

		expect( shown( container ) ).toBe( 'general' );
		expect( links( container )[ 0 ].current ).toBe( 'page' );
	} );
} );
