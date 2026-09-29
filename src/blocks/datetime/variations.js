/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import cloudSunCalendar from '../../icons/components/cloud-sun-calendar';
import cloudSunClock from '../../icons/components/cloud-sun-clock';

const variations = [
	{
		name: 'elio/date',
		title: __( 'Date', 'elio-blocks' ),
		description: __(
			'Display the day and date for the period.',
			'elio-blocks'
		),
		icon: cloudSunCalendar,
		attributes: { displayType: 'date' },
		isActive: [ 'displayType' ],
		scope: [ 'inserter', 'transform' ],
		isDefault: true,
	},
	{
		name: 'elio/time',
		title: __( 'Time', 'elio-blocks' ),
		description: __( 'Display the time for the period.', 'elio-blocks' ),
		icon: cloudSunClock,
		attributes: { displayType: 'time' },
		isActive: [ 'displayType' ],
		scope: [ 'inserter', 'transform' ],
	},
];

export default variations;
