/**
 * External dependencies
 */
import { describe, expect, it } from 'vitest';

/**
 * Internal dependencies
 */
import { resolveConditionIconCollection } from '../condition-icon-collection';

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
