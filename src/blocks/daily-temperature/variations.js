import { __ } from '@wordpress/i18n';
import temperatureMinus from '../../icons/components/temperature-minus';
import temperaturePlus from '../../icons/components/temperature-plus';
import temperatureFeelsLikeMin from '../../icons/components/temperature-feels-like-minus';
import temperatureFeelsLikeMax from '../../icons/components/temperature-feels-like-plus';

const variations = [
	{
		name: 'elio/daily-temperature-min',
		title: __( 'Min. Temperature', 'elio-blocks' ),
		description: __(
			'Display the daily minimum temperature.',
			'elio-blocks'
		),
		icon: temperatureMinus,
		attributes: { displayType: 'min' },
		isActive: [ 'displayType' ],
		scope: [ 'inserter', 'transform' ],
		isDefault: true,
	},
	{
		name: 'elio/daily-temperature-max',
		title: __( 'Max. Temperature', 'elio-blocks' ),
		description: __(
			'Display the daily maximum temperature.',
			'elio-blocks'
		),
		icon: temperaturePlus,
		attributes: { displayType: 'max' },
		isActive: [ 'displayType' ],
		scope: [ 'inserter', 'transform' ],
	},
	{
		name: 'elio/daily-temperature-feels-like-minus',
		title: __( 'Feels Like Min.', 'elio-blocks' ),
		description: __(
			'Display the daily minimum feels like temperature.',
			'elio-blocks'
		),
		icon: temperatureFeelsLikeMin,
		attributes: { displayType: 'feels-like-min' },
		isActive: [ 'displayType' ],
		scope: [ 'inserter', 'transform' ],
	},
	{
		name: 'elio/daily-temperature-feels-like-plus',
		title: __( 'Feels Like Max.', 'elio-blocks' ),
		description: __(
			'Display the daily maximum feels like temperature.',
			'elio-blocks'
		),
		icon: temperatureFeelsLikeMax,
		attributes: { displayType: 'feels-like-max' },
		isActive: [ 'displayType' ],
		scope: [ 'inserter', 'transform' ],
	},
];

export default variations;
