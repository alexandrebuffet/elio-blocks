/**
 * Identifies a weather forecast request: two report blocks with the same
 * location, provider and units share one weather forecast.
 *
 * @param {number|string} latitude  Latitude.
 * @param {number|string} longitude Longitude.
 * @param {string}        provider  Provider slug, empty for the site default.
 * @param {string}        units     Unit system, empty for the site default.
 * @return {string} Key of the weather forecast in the store.
 */
export function getWeatherForecastKey( latitude, longitude, provider, units ) {
	return [ latitude, longitude, provider || '', units || '' ].join( '|' );
}
