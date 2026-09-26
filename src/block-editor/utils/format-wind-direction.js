/**
 * Cardinal direction labels (16-point compass rose).
 *
 * @type {string[]}
 */
const CARDINALS = [
	'N',
	'NNE',
	'NE',
	'ENE',
	'E',
	'ESE',
	'SE',
	'SSE',
	'S',
	'SSW',
	'SW',
	'WSW',
	'W',
	'WNW',
	'NW',
	'NNW',
];

/**
 * Converts wind direction in degrees to a cardinal direction string.
 *
 * @param {number} degrees Wind direction in degrees (0–360).
 * @return {string} Cardinal direction (e.g. "N", "NE", "SSW").
 */
export function formatWindDirection( degrees ) {
	if ( degrees === null || degrees === undefined || isNaN( degrees ) ) {
		return '';
	}

	// Normalize to 0–360 range.
	const normalized = ( ( degrees % 360 ) + 360 ) % 360;
	const index = Math.round( normalized / 22.5 ) % 16;
	return CARDINALS[ index ];
}
