/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { getRefreshSettings, getWeatherForecastKey } from './utils';
import {
	getRefreshTime,
	getRequestTimeoutSignal,
	setTimeoutAt,
} from '../../shared/refresh';

/**
 * Fetches the registered condition icon collections, for the pickers and for
 * the weather forecast requests, which name the icon of each item in every
 * collection.
 */
export const getConditionIconCollections =
	() =>
	async ( { dispatch } ) => {
		const collections = await apiFetch( {
			path: '/elio/v1/condition-icon-collections',
		} );

		dispatch.receiveConditionIconCollections(
			Array.isArray( collections ) ? collections : []
		);
	};

/**
 * Fetches the weather forecast of a location.
 *
 * `@wordpress/data` runs a resolver once per set of arguments: blocks asking
 * for the same weather forecast share one request, and a late answer lands
 * under its own key instead of replacing the weather forecast of the location
 * picked since. A rejected request is kept as the resolution error of the
 * selector.
 *
 * @param {number|string} latitude  Latitude.
 * @param {number|string} longitude Longitude.
 * @param {string}        provider  Provider slug, empty for the site default.
 * @param {string}        units     Unit system, empty for the site default.
 */
export const getWeatherForecast =
	( latitude, longitude, provider, units ) =>
	async ( { dispatch, resolveSelect } ) => {
		// Every registered collection: the list is the same for the whole
		// editing session, so switching a collection in an inspector needs no
		// request. A weather forecast is worth showing without its icons.
		let collections = [];
		try {
			collections = await resolveSelect.getConditionIconCollections();
		} catch {
			// The collections endpoint answered an error: no icon in the editor.
		}

		const requestedAt = Date.now();
		let weatherForecast = null;

		try {
			weatherForecast = await apiFetch( {
				path: addQueryArgs( '/elio/v1/weather-forecast', {
					latitude,
					longitude,
					provider: provider || '',
					units: units || '',
					icon_collections: ( collections ?? [] ).map(
						( c ) => c.slug
					),
				} ),
				// Given up after a while: a resolution that never settles is
				// never started again, and nothing would refresh it.
				signal: getRequestTimeoutSignal(),
			} );

			dispatch.receiveWeatherForecast(
				getWeatherForecastKey( latitude, longitude, provider, units ),
				weatherForecast
			);
		} finally {
			// Asked again when the front asks again (getRefreshSettings(), the
			// settings the front gets): the blocks still showing it resolve it
			// again, keeping the one they have meanwhile.
			const refreshAt = getRefreshTime(
				weatherForecast,
				requestedAt,
				getRefreshSettings()
			);

			if ( refreshAt !== null ) {
				setTimeoutAt(
					() =>
						dispatch.invalidateResolution( 'getWeatherForecast', [
							latitude,
							longitude,
							provider,
							units,
						] ),
					refreshAt
				);
			}
		}
	};

/**
 * Fetches the providers that serve the weather forecast: the built-in one and
 * those a third party registers on elio_blocks_init.
 */
export const getWeatherForecastProviders =
	() =>
	async ( { dispatch } ) => {
		const providers = await apiFetch( {
			path: '/elio/v1/weather-forecast/providers',
		} );

		dispatch.receiveWeatherForecastProviders( providers );
	};

/**
 * Fetches every registered provider, whatever it serves, with the credentials
 * it declares.
 */
export const getProviders =
	() =>
	async ( { dispatch } ) => {
		const providers = await apiFetch( { path: '/elio/v1/providers' } );

		dispatch.receiveProviders( providers );
	};
