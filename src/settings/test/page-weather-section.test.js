/**
 * External dependencies
 */
import { act } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * WordPress dependencies
 */
import { createRegistry, createReduxStore } from '@wordpress/data';
import { SlotFillProvider } from '@wordpress/components';

/**
 * Internal dependencies
 */
import SettingsPage from '../page';
import { store as elioDataStore } from '../../stores/elio-data';
import { renderWithRegistry } from '../../test-utils/render-hook';
import { useConditionIconCollections } from '../../block-editor/hooks';

vi.mock( '@wordpress/api-fetch', () => ( {
	default: vi.fn( () => Promise.resolve( [] ) ),
} ) );
vi.mock( '@wordpress/core-data', () => ( { store: 'core' } ) );
vi.mock( '../../block-editor/hooks', () => ( {
	useConditionIconCollections: vi.fn(),
} ) );

const PAGE_URL = '/wp-admin/admin.php?page=elio-blocks-settings';

const COLLECTIONS = [
	{
		slug: 'elio',
		label: 'Elio',
		description: '',
		is_default: true,
		coverage: { covered: 28, total: 28 },
		preview: [],
	},
	{
		slug: 'acme-icons',
		label: 'Acme Icons',
		description: 'Icons of Acme.',
		is_default: false,
		coverage: { covered: 12, total: 28 },
		preview: [
			{
				name: 'acme-icons/sun',
				content: '<svg viewBox="0 0 24 24"><circle r="4"/></svg>',
				style: 'stroke',
			},
			null,
		],
	},
];

/**
 * Creates a registry with a `core` store that answers the site record and the
 * dispatch actions the page calls, without going through the real REST client,
 * and the elio/data store the page reads the providers from.
 */
function makeRegistry() {
	const registry = createRegistry();
	registry.register( elioDataStore );
	registry.register(
		createReduxStore( 'core', {
			reducer: ( state = {} ) => state,
			selectors: {
				getEditedEntityRecord: () => ( {} ),
				hasEditsForEntityRecord: () => false,
			},
			actions: {
				editEntityRecord: () => () => {},
				saveEditedEntityRecord: () => async () => ( {} ),
			},
		} )
	);
	return registry;
}

function links( container ) {
	return [ ...container.querySelectorAll( 'nav a' ) ].map(
		( a ) => a.textContent
	);
}

describe( 'settings page: weather section', () => {
	let page;

	afterEach( () => {
		page?.unmount();
		page = undefined;
	} );

	const render = async () => {
		useConditionIconCollections.mockReturnValue( {
			collections: COLLECTIONS,
			defaultCollection: 'elio',
			isResolving: false,
		} );
		window.history.replaceState( null, '', PAGE_URL );
		page = renderWithRegistry(
			makeRegistry(),
			<SlotFillProvider>
				<SettingsPage />
			</SlotFillProvider>
		);
		await act( async () => {} );
		return page.container;
	};

	it( 'lists General, Weather, Providers and Advanced, General shown first', async () => {
		const container = await render();

		expect( links( container ) ).toEqual( [
			'General',
			'Weather',
			'Providers',
			'Advanced',
		] );
	} );

	// The grid measures its items once shown: let those updates settle.
	const showWeatherSection = () =>
		act( async () => {
			window.history.replaceState(
				null,
				'',
				`${ PAGE_URL }&section=weather`
			);
			window.dispatchEvent( new window.PopStateEvent( 'popstate' ) );
		} );

	const options = ( container ) => [
		...container.querySelectorAll( '[role="option"]' ),
	];

	it( 'lists the collections in the Condition Icons card, the site one selected', async () => {
		const container = await render();
		await showWeatherSection();

		expect( container.textContent ).toContain( 'Condition Icons' );
		expect(
			options( container ).map( ( option ) => [
				option.getAttribute( 'aria-label' ),
				option.getAttribute( 'aria-selected' ),
			] )
		).toEqual( [
			[ 'Elio', 'true' ],
			[ 'Acme Icons', 'false' ],
		] );
	} );

	it( 'previews each collection in a sandboxed iframe, and tells how much a partial one covers', async () => {
		const container = await render();
		await showWeatherSection();
		const acme = options( container )[ 1 ];
		const iframe = acme.querySelector( 'iframe' );

		expect( iframe.getAttribute( 'sandbox' ) ).toBe( '' );
		expect( iframe.getAttribute( 'srcdoc' ) ).toContain(
			'<div class="icon is-stroke"><svg viewBox="0 0 24 24"><circle r="4"/></svg></div><div class="icon is-empty"></div>'
		);
		expect( acme.textContent ).toContain( 'Icons of Acme.' );
		expect( acme.textContent ).toContain( 'Icons for 12 of 28 conditions' );
		expect( options( container )[ 0 ].textContent ).not.toContain(
			'Icons for'
		);
	} );
} );
