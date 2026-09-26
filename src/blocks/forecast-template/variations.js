/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { group, row, stack, grid } from '@wordpress/icons';

/**
 * Block variations for elio/forecast-template.
 *
 * Mirrors the core/group pattern: variations set the layout attribute,
 * isActive uses dot-notation paths so Gutenberg can detect the active variation.
 * Order matters for isActive resolution — more specific variations (stack) must
 * come after less specific ones (row) so that the last match wins.
 */
const BLOCK_TITLE = __( 'Forecast Template', 'elio-blocks' );

const variations = [
	{
		name: 'elio/forecast-template-default',
		title: BLOCK_TITLE,
		description: __(
			'Display forecast items in a flow layout.',
			'elio-blocks'
		),
		attributes: { layout: { type: 'default' } },
		isDefault: true,
		scope: [ 'block', 'transform' ],
		icon: group,
	},
	{
		name: 'elio/forecast-template-row',
		title: BLOCK_TITLE,
		description: __(
			'Display forecast items side by side.',
			'elio-blocks'
		),
		attributes: { layout: { type: 'flex', flexWrap: 'nowrap' } },
		isActive: [ 'layout.type' ],
		scope: [ 'block', 'transform' ],
		icon: row,
	},
	{
		name: 'elio/forecast-template-stack',
		title: BLOCK_TITLE,
		description: __(
			'Display forecast items one above the other.',
			'elio-blocks'
		),
		attributes: { layout: { type: 'flex', orientation: 'vertical' } },
		isActive: [ 'layout.type', 'layout.orientation' ],
		scope: [ 'block', 'transform' ],
		icon: stack,
	},
	{
		name: 'elio/forecast-template-grid',
		title: BLOCK_TITLE,
		description: __( 'Display forecast items in a grid.', 'elio-blocks' ),
		attributes: { layout: { type: 'grid' } },
		isActive: [ 'layout.type' ],
		scope: [ 'block', 'transform' ],
		icon: grid,
	},
];

export default variations;
