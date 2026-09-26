/**
 * Utility functions for formatting GPS coordinates.
 *
 * @module format-coordinates
 */

/**
 * Formats GPS coordinates as a string.
 *
 * @param {Object}        location           Location object with latitude and longitude.
 * @param {string|number} location.latitude  Latitude value.
 * @param {string|number} location.longitude Longitude value.
 * @param {number}        [precision]        Number of decimal places (default: no rounding).
 * @return {string} Formatted coordinates string "latitude, longitude" or empty string if invalid.
 */
export function formatCoordinates( location, precision = null ) {
	if (
		! location ||
		location.latitude === undefined ||
		location.longitude === undefined
	) {
		return '';
	}

	const lat = parseFloat( location.latitude );
	const lng = parseFloat( location.longitude );

	if ( isNaN( lat ) || isNaN( lng ) ) {
		return '';
	}

	if ( precision !== null && typeof precision === 'number' ) {
		return `${ lat.toFixed( precision ) }, ${ lng.toFixed( precision ) }`;
	}

	return `${ lat }, ${ lng }`;
}

/**
 * Formats GPS coordinates with a default precision of 4 decimal places.
 *
 * @param {Object}        location           Location object with latitude and longitude.
 * @param {string|number} location.latitude  Latitude value.
 * @param {string|number} location.longitude Longitude value.
 * @return {string} Formatted coordinates string with 4 decimal places.
 */
export function formatCoordinatesPrecise( location ) {
	return formatCoordinates( location, 4 );
}
