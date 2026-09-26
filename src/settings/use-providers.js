/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';

/**
 * Loads a list of providers, and says so when it could not.
 *
 * @param {string}                                    path           REST path of the list.
 * @param {(status: string, message: string) => void} addNotice      Shows a notice.
 * @param {string}                                    failureMessage Notice when the request fails without a message.
 * @param {number}                                    version        Loads the list again when it changes.
 * @return {Object[]} The providers, empty until they are loaded.
 */
function useProviderList( path, addNotice, failureMessage, version = 0 ) {
	const [ providers, setProviders ] = useState( [] );

	useEffect( () => {
		const controller = new AbortController();

		apiFetch( { path, signal: controller.signal } )
			.then( setProviders )
			.catch( ( error ) => {
				if ( ! controller.signal.aborted ) {
					addNotice( 'error', error?.message || failureMessage );
				}
			} );

		return () => controller.abort();
	}, [ path, addNotice, failureMessage, version ] );

	return providers;
}

/**
 * Loads every provider, whatever it serves, with the credentials it declares:
 * the settings page draws their fields.
 *
 * @param {(status: string, message: string) => void} addNotice Shows a notice.
 * @param {number}                                    version   Loads them again when it changes (once credentials are saved).
 * @return {Object[]} Providers: slug, label, credentials.
 */
export function useProviders( addNotice, version = 0 ) {
	return useProviderList(
		'/elio/v1/providers',
		addNotice,
		__( 'Failed to load providers.', 'elio-blocks' ),
		version
	);
}

/**
 * Loads the providers that serve the weather forecast, for the select of the
 * default one.
 *
 * @param {(status: string, message: string) => void} addNotice Shows a notice.
 * @return {Object[]} Providers: slug, label, isDefault.
 */
export function useWeatherForecastProviders( addNotice ) {
	return useProviderList(
		'/elio/v1/weather-forecast/providers',
		addNotice,
		__( 'Failed to load weather forecast providers.', 'elio-blocks' )
	);
}
