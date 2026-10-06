/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as elioDataStore } from '../stores/elio-data';

const NO_PROVIDERS = [];

/**
 * Returns a list of providers from the elio/data store, which fetches it once,
 * and says so when it could not be loaded.
 *
 * @param {string}                                    selectorName   Selector of the list, which has a resolver.
 * @param {(status: string, message: string) => void} addNotice      Shows a notice.
 * @param {string}                                    failureMessage Notice when the request fails without a message.
 * @return {Object[]} The providers, empty until they are loaded.
 */
function useProviderList( selectorName, addNotice, failureMessage ) {
	const { providers, error } = useSelect(
		( select ) => {
			const store = select( elioDataStore );

			return {
				providers: store[ selectorName ]() ?? NO_PROVIDERS,
				error: store.getResolutionError( selectorName ),
			};
		},
		[ selectorName ]
	);

	useEffect( () => {
		if ( error ) {
			addNotice( 'error', error.message || failureMessage );
		}
	}, [ error, addNotice, failureMessage ] );

	return providers;
}

/**
 * Returns every provider, whatever it serves, with the credentials it
 * declares: the settings page draws their fields. Once credentials are saved,
 * invalidateResolution( 'getProviders' ) loads them again.
 *
 * @param {(status: string, message: string) => void} addNotice Shows a notice.
 * @return {Object[]} Providers: slug, label, credentials.
 */
export function useProviders( addNotice ) {
	return useProviderList(
		'getProviders',
		addNotice,
		__( 'Failed to load providers.', 'elio-blocks' )
	);
}

/**
 * Returns the providers that serve the weather forecast, for the select of the
 * default one: the same list as the Provider select of the report block.
 *
 * @param {(status: string, message: string) => void} addNotice Shows a notice.
 * @return {Object[]} Providers: slug, label, isDefault.
 */
export function useWeatherForecastProviders( addNotice ) {
	return useProviderList(
		'getWeatherForecastProviders',
		addNotice,
		__( 'Failed to load weather forecast providers.', 'elio-blocks' )
	);
}
