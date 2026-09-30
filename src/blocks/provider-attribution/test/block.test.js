/**
 * External dependencies
 */
import { afterAll, describe, expect, it } from 'vitest';

/**
 * WordPress dependencies
 */
import {
	createBlock,
	registerBlockType,
	unregisterBlockType,
} from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import metadata from '../block.json';

describe( 'provider-attribution block type', () => {
	registerBlockType( metadata, { edit: () => null, save: () => null } );

	afterAll( () => unregisterBlockType( metadata.name ) );

	// What the toggle Block Hooks adds to the report inspector does: no
	// attributes, no variation.
	it( 'is small and centered when created without attributes', () => {
		expect( createBlock( metadata.name ).attributes.style ).toEqual( {
			typography: { fontSize: '0.75em', textAlign: 'center' },
		} );
	} );

	it( 'opens its links in the same tab unless told otherwise', () => {
		expect( createBlock( metadata.name ).attributes.linkTarget ).toBe(
			'_self'
		);
	} );
} );
