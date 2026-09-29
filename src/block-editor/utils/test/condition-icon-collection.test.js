/**
 * External dependencies
 */
import { describe, expect, it } from 'vitest';

/**
 * Internal dependencies
 */
import {
	getConditionIconStrokeWidth,
	resolveConditionIconCollection,
} from '../condition-icon-collection';

const COLLECTIONS = [ { slug: 'elio' }, { slug: 'theme' } ];

describe( 'resolveConditionIconCollection', () => {
	it( 'takes the first registered candidate: the block, then its report, then the site', () => {
		expect(
			resolveConditionIconCollection(
				[ 'theme', 'elio' ],
				COLLECTIONS,
				'elio'
			)
		).toBe( 'theme' );
		expect(
			resolveConditionIconCollection(
				[ undefined, 'theme' ],
				COLLECTIONS,
				'elio'
			)
		).toBe( 'theme' );
		expect(
			resolveConditionIconCollection(
				[ '', undefined ],
				COLLECTIONS,
				'theme'
			)
		).toBe( 'theme' );
	} );

	it( 'skips a collection that is not registered and ends on elio', () => {
		expect(
			resolveConditionIconCollection(
				[ 'uninstalled', 'theme' ],
				COLLECTIONS,
				'elio'
			)
		).toBe( 'theme' );
		expect(
			resolveConditionIconCollection(
				[ 'uninstalled' ],
				COLLECTIONS,
				'gone'
			)
		).toBe( 'elio' );
	} );

	it( 'trusts the candidates while the collections are not listed yet', () => {
		expect(
			resolveConditionIconCollection( [ undefined, 'theme' ], null )
		).toBe( 'theme' );
		expect( resolveConditionIconCollection( [], null ) ).toBe( 'elio' );
	} );
} );

describe( 'getConditionIconStrokeWidth', () => {
	it( 'is the stroke width the collection declares, two when it declares none or is not listed yet', () => {
		const collections = [
			{ slug: 'elio', stroke_width: 1.5 },
			{ slug: 'theme' },
		];

		expect( getConditionIconStrokeWidth( collections, 'elio' ) ).toBe(
			1.5
		);
		expect( getConditionIconStrokeWidth( collections, 'theme' ) ).toBe( 2 );
		expect( getConditionIconStrokeWidth( collections, 'nope' ) ).toBe( 2 );
		expect( getConditionIconStrokeWidth( null, 'elio' ) ).toBe( 2 );
	} );
} );
