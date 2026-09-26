/**
 * Action creators for the elio/data store.
 */

/**
 * Stores a fetched weather forecast.
 *
 * @param {string} key             Weather forecast key (see getWeatherForecastKey).
 * @param {Object} weatherForecast Weather forecast returned by the REST API.
 * @return {Object} Action.
 */
export function receiveWeatherForecast( key, weatherForecast ) {
	return { type: 'RECEIVE_WEATHER_FORECAST', key, weatherForecast };
}

/**
 * Stores the providers that serve the weather forecast.
 *
 * @param {Object[]} providers Providers returned by the REST API.
 * @return {Object} Action.
 */
export function receiveWeatherForecastProviders( providers ) {
	return { type: 'RECEIVE_WEATHER_FORECAST_PROVIDERS', providers };
}

/**
 * Stores the registered condition icon collections.
 *
 * @param {Array} collections Collections returned by the REST API.
 * @return {Object} Action.
 */
export function receiveConditionIconCollections( collections ) {
	return { type: 'RECEIVE_CONDITION_ICON_COLLECTIONS', collections };
}
