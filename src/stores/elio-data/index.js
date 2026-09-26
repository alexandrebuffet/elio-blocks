/**
 * WordPress dependencies
 */
import { createReduxStore, register, select } from '@wordpress/data';

/**
 * Internal dependencies
 */
import reducer from './reducer';
import * as storeActions from './actions';
import * as storeSelectors from './selectors';
import * as storeResolvers from './resolvers';
import { STORE_NAME } from './constants';

/**
 * Store descriptor for elio/data: the weather forecasts shown in the editor,
 * and the providers the report block offers (getWeatherForecastProviders()).
 *
 * Blocks select getWeatherForecast() with the location, provider and units of
 * their report block; the resolver fetches it once for all of them.
 */
const store = createReduxStore( STORE_NAME, {
	reducer,
	actions: storeActions,
	selectors: storeSelectors,
	resolvers: storeResolvers,
} );

// Guard against duplicate registration when the module is bundled in multiple block scripts.
if ( ! select( store ) ) {
	register( store );
}

export { store, STORE_NAME };
export default store;
