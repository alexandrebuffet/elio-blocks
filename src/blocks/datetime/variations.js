/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import calendar from '../../icons/components/calendar';
import clock from '../../icons/components/clock';

const variations = [
	{
		name: 'elio/date',
		title: __( 'Date', 'elio-blocks' ),
		description: __(
			'Display the day and date for the period.',
			'elio-blocks'
		),
		icon: calendar,
		attributes: { displayType: 'date' },
		isActive: [ 'displayType' ],
		scope: [ 'inserter', 'transform' ],
		isDefault: true,
	},
	{
		name: 'elio/time',
		title: __( 'Time', 'elio-blocks' ),
		description: __( 'Display the time for the period.', 'elio-blocks' ),
		icon: clock,
		attributes: { displayType: 'time' },
		isActive: [ 'displayType' ],
		scope: [ 'inserter', 'transform' ],
	},
];

export default variations;
