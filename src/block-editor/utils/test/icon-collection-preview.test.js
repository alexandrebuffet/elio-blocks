/**
 * External dependencies
 */
import { describe, expect, it } from 'vitest';

/**
 * Internal dependencies
 */
import { getIconCollectionPreviewDocument } from '../icon-collection-preview';

const GRADIENT_ICON =
	'<svg viewBox="0 0 24 24"><defs><linearGradient id="a"><stop offset="0"></stop></linearGradient></defs><path fill="url(#a)" d="M1 1"></path></svg>';

describe( 'getIconCollectionPreviewDocument', () => {
	it( 'gives the inner ids of each icon of a preview their own prefix', () => {
		const html = getIconCollectionPreviewDocument( [
			{ content: GRADIENT_ICON, style: 'fill' },
			{ content: GRADIENT_ICON, style: 'fill' },
		] );
		const ids = [ ...html.matchAll( /id="([^"]+)"/g ) ].map(
			( [ , id ] ) => id
		);

		expect( ids ).toHaveLength( 2 );
		expect( new Set( ids ).size ).toBe( 2 );
		ids.forEach( ( id ) => expect( html ).toContain( `url(#${ id })` ) );
	} );
} );
