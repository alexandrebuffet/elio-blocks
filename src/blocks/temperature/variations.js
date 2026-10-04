/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import temperature from '../../icons/components/temperature';
import temperatureFeelsLike from '../../icons/components/temperature-feels-like';

const variations = [
	{
		name: 'elio/current-temperature',
		title: __( 'Current Temperature', 'elio-blocks' ),
		description: __( 'Display the current temperature.', 'elio-blocks' ),
		icon: temperature,
		attributes: {
			displayType: 'current',
		},
		isActive: [ 'displayType' ],
		scope: [ 'inserter', 'transform' ],
		isDefault: true,
	},
	{
		name: 'elio/feels-like-temperature',
		title: __( 'Current Feels Like Temperature', 'elio-blocks' ),
		description: __(
			'Display the current feels like temperature.',
			'elio-blocks'
		),
		icon: temperatureFeelsLike,
		attributes: { displayType: 'feels-like' },
		isActive: [ 'displayType' ],
		scope: [ 'inserter', 'transform' ],
	},
];

export default variations;
