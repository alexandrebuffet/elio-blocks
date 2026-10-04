/**
 * External dependencies
 */
import { describe, expect, it } from 'vitest';

/**
 * Internal dependencies
 */
import variations from '../variations';

describe( 'forecast variations', () => {
	// A list of templates, as InnerBlocks takes them: the template of the
	// Forecast Template alone was read as three blocks, inserted as missing ones.
	it.each(
		variations.map( ( { name, innerBlocks } ) => [ name, innerBlocks ] )
	)( '%s inserts a Forecast Template', ( name, innerBlocks ) => {
		expect( innerBlocks ).toHaveLength( 1 );
		expect( innerBlocks[ 0 ][ 0 ] ).toBe( 'elio/forecast-template' );
	} );
} );
