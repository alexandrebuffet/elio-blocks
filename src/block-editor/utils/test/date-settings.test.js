/**
 * External dependencies
 */
import { afterEach, describe, expect, it } from 'vitest';

/**
 * WordPress dependencies
 */
import { getSettings } from '@wordpress/date';

/**
 * Internal dependencies
 */
import { getEditorDateSettings } from '../date-settings';

describe( 'getEditorDateSettings', () => {
	afterEach( () => {
		delete window.elioBlocksDateSettings;
	} );

	it( 'uses the settings the front gets, which decline month names like wp_date()', () => {
		// Passed by the server (EnqueueBlockEditorAssets, DateSettings in PHP).
		window.elioBlocksDateSettings = {
			l10n: { declineMonths: true, monthsGenitive: [ 'января' ] },
		};

		expect( getEditorDateSettings() ).toBe( window.elioBlocksDateSettings );
	} );

	it( 'falls back to the settings of @wordpress/date', () => {
		expect( getEditorDateSettings() ).toEqual( getSettings() );
	} );
} );
