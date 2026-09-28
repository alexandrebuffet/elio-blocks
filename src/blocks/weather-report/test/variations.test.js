/**
 * External dependencies
 */
import { describe, expect, it } from 'vitest';

/**
 * Internal dependencies
 */
import variations from '../variations';

describe( 'weather-report variations', () => {
	// A report saved without the block counts, for Block Hooks, as one it was
	// removed from: the variations add it themselves.
	it.each(
		variations.map( ( { name, innerBlocks } ) => [ name, innerBlocks ] )
	)( '%s ends with the credit of the provider', ( name, innerBlocks ) => {
		expect( innerBlocks.at( -1 ) ).toEqual( [
			'elio/provider-attribution',
		] );
	} );
} );
