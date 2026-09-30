/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import variationWeatherDefault from './icons/components/variation-weather-default';
import variationWeatherMinimal from './icons/components/variation-weather-minimal';
import variationWeatherForecast from './icons/components/variation-weather-forecast';
import providerAttributionMetadata from '../provider-attribution/block.json';
import {
	DAILY_WEATHER_FORECAST_INNER_BLOCKS,
	HOURLY_WEATHER_FORECAST_INNER_BLOCKS,
} from '../forecast/variations';

/**
 * Credit of the provider, last in every variation. Block Hooks add it to the
 * reports of templates, patterns and posts saved before it existed, but a
 * report saved without it counts as one it was removed from (its metadata
 * ignores it from then on): a report made in the editor gets it here. Its size
 * and alignment are the default of its style attribute.
 */
export const PROVIDER_ATTRIBUTION_BLOCK = [ 'elio/provider-attribution' ];

/**
 * Credit of the provider in a report laid out as a flex row: on a line of its
 * own, as StyleHookedProviderAttribution places it in such a report. A style
 * given replaces the default one: it starts from it.
 */
const PROVIDER_ATTRIBUTION_ROW_BLOCK = [
	'elio/provider-attribution',
	{
		style: {
			...providerAttributionMetadata.attributes.style.default,
			layout: { selfStretch: 'fixed', flexSize: '100%' },
		},
	},
];

/**
 * Current weather inner blocks.
 */
const CURRENT_WEATHER_INNER_BLOCKS = [
	[ 'elio/location', { style: { typography: { textAlign: 'center' } } } ],
	[
		'core/group',
		{
			layout: {
				type: 'flex',
				flexWrap: 'nowrap',
				justifyContent: 'center',
			},
		},
		[
			[
				'elio/condition-icon',
				{
					isDecorative: true,
					style: { dimensions: { width: '48px' } },
				},
			],
			[
				'elio/temperature',
				{
					style: {
						typography: {
							fontStyle: 'normal',
							fontWeight: '600',
							fontSize: '1.5em',
						},
					},
				},
			],
		],
	],
	[
		'elio/condition-description',
		{ style: { typography: { textAlign: 'center' } } },
	],
];

/**
 * Current weather minimal inner blocks.
 */
const CURRENT_WEATHER_MINIMAL_INNER_BLOCKS = [
	[ 'elio/condition-icon', { style: { dimensions: { width: '48px' } } } ],
	[
		'elio/temperature',
		{
			style: {
				typography: {
					fontStyle: 'normal',
					fontWeight: '600',
					fontSize: '1.5em',
				},
			},
		},
	],
];

/**
 * Current weather and hourly weather forecast inner blocks.
 */
const CURRENT_WEATHER_HOURLY_FORECAST_INNER_BLOCKS = [
	...CURRENT_WEATHER_INNER_BLOCKS,
	[
		'elio/forecast',
		{ type: 'hourly', count: 7 },
		[ HOURLY_WEATHER_FORECAST_INNER_BLOCKS ],
	],
];

/**
 * Current weather and daily weather forecast inner blocks.
 */
const CURRENT_WEATHER_DAILY_FORECAST_INNER_BLOCKS = [
	...CURRENT_WEATHER_INNER_BLOCKS,
	[
		'elio/forecast',
		{ type: 'daily', count: 7 },
		[ DAILY_WEATHER_FORECAST_INNER_BLOCKS ],
	],
];

/**
 * Wide alignment of the variations with a forecast list: their icon shows its
 * seven items on one row, which the content width is too narrow for.
 */
const FORECAST_ATTRIBUTES = { align: 'wide' };

/**
 * Weather report block template variations.
 * scope: [ 'block' ] so they appear only in the "Start blank" variation picker, not in the inserter.
 */
const variations = [
	{
		name: 'elio/current-weather',
		title: __( 'Default', 'elio-blocks' ),
		description: __(
			'Displays current weather location name, temperature, condition icon and description.',
			'elio-blocks'
		),
		icon: variationWeatherDefault,
		attributes: {},
		innerBlocks: [
			...CURRENT_WEATHER_INNER_BLOCKS,
			PROVIDER_ATTRIBUTION_BLOCK,
		],
		scope: [ 'block' ],
	},
	{
		name: 'elio/current-weather-minimalist',
		title: __( 'Minimal', 'elio-blocks' ),
		description: __(
			'Displays current weather condition icon and temperature.',
			'elio-blocks'
		),
		icon: variationWeatherMinimal,
		attributes: {
			layout: {
				type: 'flex',
				flexWrap: 'wrap',
				justifyContent: 'center',
			},
		},
		innerBlocks: [
			...CURRENT_WEATHER_MINIMAL_INNER_BLOCKS,
			PROVIDER_ATTRIBUTION_ROW_BLOCK,
		],
		scope: [ 'block' ],
	},
	{
		name: 'elio/current-weather-hourly-forecast',
		title: __( 'Hourly Forecast', 'elio-blocks' ),
		description: __(
			'Displays current weather location name, temperature, condition icon and description plus an hourly weather forecast list.',
			'elio-blocks'
		),
		icon: variationWeatherForecast,
		attributes: FORECAST_ATTRIBUTES,
		innerBlocks: [
			...CURRENT_WEATHER_HOURLY_FORECAST_INNER_BLOCKS,
			PROVIDER_ATTRIBUTION_BLOCK,
		],
		scope: [ 'block' ],
	},
	{
		name: 'elio/current-weather-daily-forecast',
		title: __( 'Daily Forecast', 'elio-blocks' ),
		description: __(
			'Displays current weather location name, temperature, condition icon and description plus a daily weather forecast list.',
			'elio-blocks'
		),
		icon: variationWeatherForecast,
		attributes: FORECAST_ATTRIBUTES,
		innerBlocks: [
			...CURRENT_WEATHER_DAILY_FORECAST_INNER_BLOCKS,
			PROVIDER_ATTRIBUTION_BLOCK,
		],
		scope: [ 'block' ],
	},
];

export default variations;
