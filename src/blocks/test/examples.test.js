/**
 * External dependencies
 */
import { describe, expect, it } from 'vitest';

const metadataFiles = import.meta.glob( '../*/block.json', {
	eager: true,
	import: 'default',
} );

// Their examples are built from the inner blocks template of the Forecast
// variations, in JavaScript (forecast/variations.js, forecast-template/index.js).
const EXAMPLES_IN_JS = [ 'elio/forecast', 'elio/forecast-template' ];

describe( 'block examples', () => {
	// Without one, the inserter says "No preview available." for the block.
	it.each(
		Object.values( metadataFiles )
			.filter( ( { name } ) => ! EXAMPLES_IN_JS.includes( name ) )
			.map( ( metadata ) => [ metadata.name, metadata ] )
	)( '%s has a preview in the inserter', ( name, metadata ) => {
		expect( metadata.example ).toBeInstanceOf( Object );
	} );
} );
