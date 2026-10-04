/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import cloudSunGroup from '../../icons/components/cloud-sun-group';
import cloudSunRow from '../../icons/components/cloud-sun-row';
import cloudSunStack from '../../icons/components/cloud-sun-stack';
import cloudSunGrid from '../../icons/components/cloud-sun-grid';

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
		icon: cloudSunGroup,
	},
	{
		name: 'elio/forecast-template-row',
		title: BLOCK_TITLE,
		description: __(
			'Arrange forecast items horizontally.',
			'elio-blocks'
		),
		attributes: { layout: { type: 'flex', flexWrap: 'nowrap' } },
		isActive: [ 'layout.type' ],
		scope: [ 'block', 'transform' ],
		icon: cloudSunRow,
	},
	{
		name: 'elio/forecast-template-stack',
		title: BLOCK_TITLE,
		description: __( 'Arrange forecast items vertically.', 'elio-blocks' ),
		attributes: { layout: { type: 'flex', orientation: 'vertical' } },
		isActive: [ 'layout.type', 'layout.orientation' ],
		scope: [ 'block', 'transform' ],
		icon: cloudSunStack,
	},
	{
		name: 'elio/forecast-template-grid',
		title: BLOCK_TITLE,
		description: __( 'Arrange forecast items in a grid.', 'elio-blocks' ),
		attributes: { layout: { type: 'grid' } },
		isActive: [ 'layout.type' ],
		scope: [ 'block', 'transform' ],
		icon: cloudSunGrid,
	},
];

export default variations;
