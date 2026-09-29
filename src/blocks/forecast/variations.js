/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import cloudSunCalendar from '../../icons/components/cloud-sun-calendar';
import cloudSunClock from '../../icons/components/cloud-sun-clock';

/**
 * Inner blocks of the forecast template in the weather forecast variations
 * (one item layout).
 *
 * The grid shows at most `columnCount` items per row, and fewer once a column
 * would get narrower than `minimumColumnWidth`. That width holds the part of
 * an item that cannot wrap: the min/max pair of a day, the temperature of an
 * hour (a 12-hour time wraps before "pm"). In em, so it follows the font size
 * of the template.
 */
export const DAILY_WEATHER_FORECAST_INNER_BLOCKS = [
	'elio/forecast-template',
	{ layout: { type: 'grid', columnCount: 7, minimumColumnWidth: '7.75em' } },
	[
		[
			'core/group',
			{
				layout: {
					type: 'flex',
					orientation: 'vertical',
					justifyContent: 'center',
				},
			},
			[
				[
					'elio/datetime',
					{ displayType: 'date', format: 'l', currentAsLabel: true },
				],
				[ 'elio/condition-icon' ],
				[
					'core/group',
					{
						layout: { type: 'flex', flexWrap: 'nowrap' },
					},
					[
						[ 'elio/daily-temperature', { displayType: 'min' } ],
						[ 'elio/daily-temperature', { displayType: 'max' } ],
					],
				],
			],
		],
	],
];

export const HOURLY_WEATHER_FORECAST_INNER_BLOCKS = [
	'elio/forecast-template',
	{ layout: { type: 'grid', columnCount: 7, minimumColumnWidth: '3.4em' } },
	[
		[
			'core/group',
			{
				layout: {
					type: 'flex',
					orientation: 'vertical',
					justifyContent: 'center',
				},
			},
			[
				[
					'elio/datetime',
					{ displayType: 'time', currentAsLabel: true },
				],
				[ 'elio/condition-icon' ],
				[ 'elio/hourly-temperature' ],
			],
		],
	],
];

const variations = [
	{
		name: 'elio/forecast-daily',
		title: __( 'Daily Forecast', 'elio-blocks' ),
		description: __( 'Display the forecast for each day.', 'elio-blocks' ),
		icon: cloudSunCalendar,
		attributes: {
			type: 'daily',
			count: 7,
		},
		innerBlocks: DAILY_WEATHER_FORECAST_INNER_BLOCKS,
		isActive: [ 'type' ],
		scope: [ 'transform', 'inserter' ],
		isDefault: true,
	},
	{
		name: 'elio/forecast-hourly',
		title: __( 'Hourly Forecast', 'elio-blocks' ),
		description: __( 'Display the forecast for each hour.', 'elio-blocks' ),
		icon: cloudSunClock,
		attributes: {
			type: 'hourly',
			count: 7,
		},
		innerBlocks: HOURLY_WEATHER_FORECAST_INNER_BLOCKS,
		isActive: [ 'type' ],
		scope: [ 'transform', 'inserter' ],
	},
];

export default variations;
