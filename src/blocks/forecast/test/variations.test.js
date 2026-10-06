/**
 * External dependencies
 */
import { describe, expect, it } from 'vitest';

/**
 * Internal dependencies
 */
import variations from '../variations';
import { getBlockExampleFromTemplate } from '../../../block-editor/utils';

describe( 'forecast variations', () => {
	// A list of templates, as InnerBlocks takes them: the template of the
	// Forecast Template alone was read as three blocks, inserted as missing ones.
	it.each(
		variations.map( ( { name, innerBlocks } ) => [ name, innerBlocks ] )
	)( '%s inserts a Forecast Template', ( name, innerBlocks ) => {
		expect( innerBlocks ).toHaveLength( 1 );
		expect( innerBlocks[ 0 ][ 0 ] ).toBe( 'elio/forecast-template' );
	} );

	// The inserter previews a variation with its own example, else the one of
	// the block, whose inner blocks it does not have.
	it.each(
		variations.map( ( { name, innerBlocks, example } ) => [
			name,
			innerBlocks,
			example,
		] )
	)( '%s previews the blocks it inserts', ( name, innerBlocks, example ) => {
		expect( example.innerBlocks ).toEqual(
			innerBlocks.map( getBlockExampleFromTemplate )
		);
	} );
} );
