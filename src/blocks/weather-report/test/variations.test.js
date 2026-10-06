/**
 * External dependencies
 */
import { describe, expect, it } from 'vitest';

/**
 * Internal dependencies
 */
import variations from '../variations';
import providerAttributionMetadata from '../../provider-attribution/block.json';

describe( 'weather-report variations', () => {
	// A report saved without the block counts, for Block Hooks, as one it was
	// removed from: the variations add it themselves.
	it.each(
		variations.map( ( { name, innerBlocks } ) => [ name, innerBlocks ] )
	)( '%s ends with the credit of the provider', ( name, innerBlocks ) => {
		expect( innerBlocks.at( -1 )[ 0 ] ).toBe( 'elio/provider-attribution' );
	} );

	it( 'puts the credit on a line of its own below the row of Minimal, with its default style', () => {
		const minimal = variations.find(
			( { name } ) => name === 'elio/current-weather-minimalist'
		);
		const { style } = minimal.innerBlocks.at( -1 )[ 1 ];

		expect( minimal.attributes.layout.flexWrap ).toBe( 'wrap' );
		expect( style.layout ).toEqual( {
			selfStretch: 'fixed',
			flexSize: '100%',
		} );
		expect( style.typography ).toEqual(
			providerAttributionMetadata.attributes.style.default.typography
		);
	} );
} );
