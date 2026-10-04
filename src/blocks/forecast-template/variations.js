/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';

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
 * come after less specific ones (row) so that the last match wins. Each has its
 * own title, as core's Row, Stack and Grid: the buttons of the block toolbar
 * that switch layouts are named after them ("Transform to Row").
 */
const variations = [
	{
		name: 'elio/forecast-template-default',
		title: __( 'Forecast Template', 'elio-blocks' ),
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
		title: _x( 'Row', 'single horizontal line', 'elio-blocks' ),
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
		title: __( 'Stack', 'elio-blocks' ),
		description: __( 'Arrange forecast items vertically.', 'elio-blocks' ),
		attributes: { layout: { type: 'flex', orientation: 'vertical' } },
		isActive: [ 'layout.type', 'layout.orientation' ],
		scope: [ 'block', 'transform' ],
		icon: cloudSunStack,
	},
	{
		name: 'elio/forecast-template-grid',
		title: __( 'Grid', 'elio-blocks' ),
		description: __( 'Arrange forecast items in a grid.', 'elio-blocks' ),
		attributes: { layout: { type: 'grid' } },
		isActive: [ 'layout.type' ],
		scope: [ 'block', 'transform' ],
		icon: cloudSunGrid,
	},
];

export default variations;
