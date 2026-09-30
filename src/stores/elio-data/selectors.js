/**
 * Selectors for the elio/data store.
 */

/**
 * Internal dependencies
 */
import { getWeatherForecastKey } from './utils';

/**
 * Returns the weather forecast of a location, or null while it is not there.
 *
 * Has a resolver: selecting it fetches it. Use the resolution selectors of
 * `@wordpress/data` for the request state:
 * isResolving( 'getWeatherForecast', args ),
 * getResolutionError( 'getWeatherForecast', args ).
 *
 * @param {Object}        state     Store state.
 * @param {number|string} latitude  Latitude.
 * @param {number|string} longitude Longitude.
 * @param {string}        provider  Provider slug, empty for the site default.
 * @param {string}        units     Unit system, empty for the site default.
 * @return {Object|null} Weather forecast: meta, current, hourly, daily, icons.
 */
export function getWeatherForecast(
	state,
	latitude,
	longitude,
	provider,
	units
) {
	return (
		state.weatherForecasts[
			getWeatherForecastKey( latitude, longitude, provider, units )
		] ?? null
	);
}

/**
 * Returns the providers that serve the weather forecast, or null while they
 * are not there.
 *
 * Has a resolver: selecting it fetches them, once for all the blocks. Use
 * getResolutionError( 'getWeatherForecastProviders' ) for a failed request.
 *
 * @param {Object} state Store state.
 * @return {Object[]|null} Providers: slug, label, isDefault.
 */
export function getWeatherForecastProviders( state ) {
	return state.weatherForecastProviders;
}

/**
 * Returns the registered condition icon collections, or null while they are
 * not there. Has a resolver: selecting it fetches them once.
 *
 * @param {Object} state Store state.
 * @return {Array|null} Collections: slug, label, description, stroke_width, is_default, coverage, preview.
 */
export function getConditionIconCollections( state ) {
	return state.conditionIconCollections;
}
