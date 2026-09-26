/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import windsockDirectionCardinal from '../../icons/components/windsock-direction-cardinal';
import windsockDirectionDegree from '../../icons/components/windsock-direction-degree';

const variations = [
	{
		name: 'elio/wind-direction-cardinal',
		title: __( 'Wind Direction (Cardinal)', 'elio-blocks' ),
		description: __(
			'Display the wind direction as a cardinal point (N, NE, …).',
			'elio-blocks'
		),
		icon: windsockDirectionCardinal,
		attributes: { displayFormat: 'cardinal' },
		isActive: [ 'displayFormat' ],
		scope: [ 'transform' ],
		isDefault: true,
	},
	{
		name: 'elio/wind-direction-degrees',
		title: __( 'Wind Direction (Degrees)', 'elio-blocks' ),
		description: __(
			'Display the wind direction in degrees (0–360°).',
			'elio-blocks'
		),
		icon: windsockDirectionDegree,
		attributes: { displayFormat: 'degrees' },
		isActive: [ 'displayFormat' ],
		scope: [ 'transform' ],
	},
];

export default variations;
