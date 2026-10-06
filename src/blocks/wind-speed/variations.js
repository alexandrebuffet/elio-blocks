/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import wind from '../../icons/components/wind';
import windsockSpeed from '../../icons/components/windsock-speed';

const variations = [
	{
		name: 'elio/wind-speed',
		title: __( 'Wind Speed', 'elio-blocks' ),
		description: __( 'Display the wind speed.', 'elio-blocks' ),
		icon: windsockSpeed,
		attributes: {
			displayType: 'speed',
		},
		isActive: [ 'displayType' ],
		scope: [ 'inserter', 'transform' ],
		isDefault: true,
	},
	{
		name: 'elio/wind-gusts',
		title: __( 'Wind Gusts', 'elio-blocks' ),
		description: __( 'Display the speed of wind gusts.', 'elio-blocks' ),
		icon: wind,
		attributes: { displayType: 'gusts' },
		isActive: [ 'displayType' ],
		scope: [ 'inserter', 'transform' ],
	},
];

export default variations;
