import { __ } from '@wordpress/i18n';
import temperature from '../../icons/components/temperature';
import temperatureFeelsLike from '../../icons/components/temperature-feels-like';

const variations = [
	{
		name: 'elio/hourly-temperature',
		title: __( 'Temperature', 'elio-blocks' ),
		description: __( 'Display the hourly temperature.', 'elio-blocks' ),
		icon: temperature,
		attributes: { displayType: 'current' },
		isActive: [ 'displayType' ],
		scope: [ 'inserter', 'transform' ],
		isDefault: true,
	},
	{
		name: 'elio/hourly-temperature-feels-like',
		title: __( 'Feels Like', 'elio-blocks' ),
		description: __(
			'Display the hourly feels like (apparent) temperature.',
			'elio-blocks'
		),
		icon: temperatureFeelsLike,
		attributes: { displayType: 'feels-like' },
		isActive: [ 'displayType' ],
		scope: [ 'inserter', 'transform' ],
	},
];

export default variations;
