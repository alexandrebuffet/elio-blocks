/**
 * External dependencies
 */
import { describe, expect, it, vi } from 'vitest';

/**
 * Internal dependencies
 */
import { getStore, setContext } from '../../../test-utils/interactivity';
import '../view';

vi.mock( '@wordpress/interactivity', async () => {
	const { mockInteractivity } =
		await import( '../../../test-utils/interactivity' );
	return mockInteractivity;
} );

const state = () => getStore( 'elio/weather-report' ).state;

describe( 'pressure view', () => {
	it( 'shows the server value untouched: the server already converted hPa to inHg', () => {
		// 1013 hPa, converted to 29.91 inHg by the REST API / SSR.
		setContext( {
			item: { pressure: 29.91 },
			unitSettings: { pressure: 'inhg' },
		} );

		expect( state().pressure ).toBe( '29.91' );
		expect( state().pressureUnit ).toBe( ' inHg' );
	} );

	it( 'defaults to hPa', () => {
		setContext( { item: { pressure: 1013 }, unitSettings: {} } );

		expect( state().pressure ).toBe( '1013' );
		expect( state().pressureUnit ).toBe( ' hPa' );
	} );
} );
