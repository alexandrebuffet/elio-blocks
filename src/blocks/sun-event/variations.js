/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import sunrise from '../../icons/components/sunrise';
import sunset from '../../icons/components/sunset';

const variations = [
	{
		name: 'elio/sunrise',
		title: __( 'Sunrise', 'elio-blocks' ),
		description: __( 'Display the sunrise time.', 'elio-blocks' ),
		icon: sunrise,
		attributes: { displayType: 'sunrise' },
		isActive: [ 'displayType' ],
		scope: [ 'inserter', 'transform' ],
		isDefault: true,
	},
	{
		name: 'elio/sunset',
		title: __( 'Sunset', 'elio-blocks' ),
		description: __( 'Display the sunset time.', 'elio-blocks' ),
		icon: sunset,
		attributes: { displayType: 'sunset' },
		isActive: [ 'displayType' ],
		scope: [ 'inserter', 'transform' ],
	},
];

export default variations;
