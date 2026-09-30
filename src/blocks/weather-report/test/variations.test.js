/**
 * External dependencies
 */
import { describe, expect, it } from 'vitest';

/**
 * Internal dependencies
 */
import variations from '../variations';
import providerAttributionMetadata from '../../provider-attribution/block.json';

const DEFAULT_ATTRIBUTES = providerAttributionMetadata.variations.find(
	( { isDefault } ) => isDefault
).attributes;

describe( 'weather-report variations', () => {
	// A report saved without the block counts, for Block Hooks, as one it was
	// removed from: the variations add it themselves, with the attributes Block
	// Hooks and the inserter give it (its default variation).
	it.each(
		variations.map( ( { name, innerBlocks } ) => [ name, innerBlocks ] )
	)( '%s ends with the credit of the provider', ( name, innerBlocks ) => {
		const [ blockName, attributes ] = innerBlocks.at( -1 );

		expect( blockName ).toBe( 'elio/provider-attribution' );
		expect( attributes.style.typography ).toEqual(
			DEFAULT_ATTRIBUTES.style.typography
		);
	} );

	it( 'puts the credit on a line of its own below the row of Minimal', () => {
		const minimal = variations.find(
			( { name } ) => name === 'elio/current-weather-minimalist'
		);

		expect( minimal.attributes.layout.flexWrap ).toBe( 'wrap' );
		expect( minimal.innerBlocks.at( -1 )[ 1 ].style.layout ).toEqual( {
			selfStretch: 'fixed',
			flexSize: '100%',
		} );
	} );
} );
