/**
 * External dependencies
 */
import { describe, expect, it } from 'vitest';

/**
 * Internal dependencies
 */
import { getBlockExampleFromTemplate } from '../block-example';

describe( 'getBlockExampleFromTemplate', () => {
	it( 'gives the blocks of a template the shape of a block example', () => {
		expect(
			getBlockExampleFromTemplate( [
				'elio/forecast-template',
				{ layout: { type: 'grid' } },
				[ [ 'core/group', {}, [ [ 'elio/datetime' ] ] ] ],
			] )
		).toEqual( {
			name: 'elio/forecast-template',
			attributes: { layout: { type: 'grid' } },
			innerBlocks: [
				{
					name: 'core/group',
					attributes: {},
					innerBlocks: [
						{
							name: 'elio/datetime',
							attributes: {},
							innerBlocks: [],
						},
					],
				},
			],
		} );
	} );
} );
