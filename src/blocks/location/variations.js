/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import mapPin from '../../icons/components/map-pin';
import geolocation from '../../icons/components/geolocation';

const variations = [
	{
		name: 'elio/location-name',
		title: __( 'Location Name', 'elio-blocks' ),
		description: __( 'Display the location name.', 'elio-blocks' ),
		icon: mapPin,
		attributes: { displayType: 'name' },
		isActive: [ 'displayType' ],
		scope: [ 'inserter', 'transform' ],
		isDefault: true,
	},
	{
		name: 'elio/location-coordinates',
		title: __( 'Location Coordinates', 'elio-blocks' ),
		description: __( 'Display the location coordinates.', 'elio-blocks' ),
		icon: geolocation,
		attributes: { displayType: 'coordinates' },
		isActive: [ 'displayType' ],
		scope: [ 'inserter', 'transform' ],
	},
];

export default variations;
