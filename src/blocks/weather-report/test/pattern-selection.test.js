/**
 * External dependencies
 */
import { describe, expect, it, vi } from 'vitest';

/**
 * Internal dependencies
 */
import { getTransformedBlocksFromPattern } from '../edit/pattern-selection';

// cloneBlock() as WordPress has it: a new clientId, the attributes merged,
// the inner blocks given or else copied.
vi.mock( '@wordpress/blocks', () => {
	let count = 0;
	const cloneBlock = ( block, attributes = {}, innerBlocks ) => ( {
		...block,
		clientId: `copy-${ ++count }`,
		attributes: { ...block.attributes, ...attributes },
		innerBlocks:
			innerBlocks ??
			block.innerBlocks.map( ( inner ) => cloneBlock( inner ) ),
	} );
	return { cloneBlock };
} );

// The modal is not rendered here: its packages stay out.
vi.mock( '@wordpress/block-editor', () => ( { store: 'core/block-editor' } ) );
vi.mock( '@wordpress/components', () => ( {} ) );
vi.mock( '../utils', () => ( { REPORT_BLOCK_NAME: 'elio/weather-report' } ) );

const createBlock = ( name, attributes = {}, innerBlocks = [] ) => ( {
	clientId: `${ name }-original`,
	name,
	attributes,
	innerBlocks,
} );

const PARIS = { latitude: 48.8566, longitude: 2.3522, name: 'Paris' };

const pattern = () => [
	createBlock(
		'elio/weather-report',
		{
			tagName: 'article',
			metadata: { patternName: 'elio/observation-compact' },
		},
		[ createBlock( 'elio/temperature' ) ]
	),
];

describe( 'getTransformedBlocksFromPattern', () => {
	it( 'keeps the location and settings of the report, and the layout of the pattern', () => {
		const { newBlocks, reportClientIds } = getTransformedBlocksFromPattern(
			pattern(),
			{
				location: PARIS,
				provider: 'acme-weather',
				units: 'imperial',
				iconCollection: 'acme-icons',
				tagName: 'div',
			}
		);

		expect( newBlocks[ 0 ].attributes ).toEqual( {
			location: PARIS,
			provider: 'acme-weather',
			units: 'imperial',
			iconCollection: 'acme-icons',
			tagName: 'article',
			metadata: { patternName: 'elio/observation-compact' },
		} );
		expect( newBlocks[ 0 ].innerBlocks[ 0 ].name ).toBe(
			'elio/temperature'
		);
		expect( reportClientIds ).toEqual( [ newBlocks[ 0 ].clientId ] );
	} );

	it( 'leaves the pattern as it is for a report without settings', () => {
		const blocks = pattern();
		const { newBlocks } = getTransformedBlocksFromPattern( blocks, {} );

		expect( newBlocks[ 0 ].attributes ).toEqual( blocks[ 0 ].attributes );
		expect( newBlocks[ 0 ].clientId ).not.toBe( blocks[ 0 ].clientId );
	} );

	it( 'reaches a report nested in the pattern', () => {
		const { newBlocks, reportClientIds } = getTransformedBlocksFromPattern(
			[ createBlock( 'core/group', {}, pattern() ) ],
			{ location: PARIS }
		);

		expect( newBlocks[ 0 ].innerBlocks[ 0 ].attributes.location ).toEqual(
			PARIS
		);
		expect( reportClientIds ).toEqual( [
			newBlocks[ 0 ].innerBlocks[ 0 ].clientId,
		] );
	} );
} );
