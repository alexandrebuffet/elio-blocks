/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as elioDataStore } from '../../stores/elio-data';

/**
 * Time without a change before new coordinates are requested: they can be
 * typed digit by digit in the inspector.
 */
const SETTLE_DELAY = 500;

const NO_QUERY = { data: null, isLoading: false, error: null };

/**
 * Checks whether a coordinate is usable. 0 is valid (equator, prime meridian).
 *
 * @param {number|string|null|undefined} value Latitude or longitude.
 * @return {boolean} True for a finite number or numeric string.
 */
function isCoordinate( value ) {
	return (
		value !== null &&
		value !== undefined &&
		value !== '' &&
		Number.isFinite( Number( value ) )
	);
}

/**
 * Returns the value once it has stopped changing for `delay` ms.
 * The first value is returned at once: a saved block loads without waiting.
 *
 * @param {string} value Value to follow.
 * @param {number} delay Delay in ms.
 * @return {string} Settled value.
 */
function useSettledValue( value, delay ) {
	const [ settled, setSettled ] = useState( value );

	useEffect( () => {
		const timeoutId = setTimeout( () => setSettled( value ), delay );
		return () => clearTimeout( timeoutId );
	}, [ value, delay ] );

	return settled;
}

/**
 * Returns the weather forecast of a location, from the elio/data store.
 *
 * The store fetches a weather forecast once per location, provider and units:
 * every block asking for it shares the request and its result. Nothing is
 * fetched here, so there is no response to lose track of when the location
 * changes. While the location, provider or units change, the weather forecast
 * received before is returned with `isLoading`, until the new one is there.
 *
 * @param {Object}        options           Query.
 * @param {number|string} options.latitude  Latitude coordinate.
 * @param {number|string} options.longitude Longitude coordinate.
 * @param {string}        options.provider  Provider slug, empty for the site default.
 * @param {string}        options.units     Unit system, empty for the site default.
 * @return {{ data: Object|null, isLoading: boolean, error: string|null }} Weather forecast and request state.
 */
export function useWeatherForecastQuery( {
	latitude,
	longitude,
	provider = '',
	units = '',
} ) {
	const hasLocation = isCoordinate( latitude ) && isCoordinate( longitude );
	const query = hasLocation
		? JSON.stringify( [ latitude, longitude, provider, units ] )
		: '';
	const settledQuery = useSettledValue( query, SETTLE_DELAY );

	const result = useSelect(
		( select ) => {
			if ( ! settledQuery ) {
				return NO_QUERY;
			}

			const args = JSON.parse( settledQuery );
			const {
				getWeatherForecast,
				hasFinishedResolution,
				getResolutionError,
			} = select( elioDataStore );

			const data = getWeatherForecast( ...args );

			return {
				data,
				isLoading: ! hasFinishedResolution(
					'getWeatherForecast',
					args
				),
				// A refresh that failed leaves the weather forecast shown, as
				// on the front: no error over blocks still showing one, the
				// next refresh tries again. An error says there is none.
				error: data
					? null
					: ( getResolutionError( 'getWeatherForecast', args )
							?.message ?? null ),
			};
		},
		[ settledQuery ]
	);

	// The answer shown stays until the next one is there, while new coordinates
	// settle and while their request is on its way, as ServerSideRender keeps
	// its last render: the blocks are filled in place, never emptied between
	// two weather forecasts.
	const isLoading = query !== settledQuery || result.isLoading;
	const [ shown, setShown ] = useState( NO_QUERY );
	if ( ! isLoading && result !== shown ) {
		setShown( result );
	}

	if ( ! hasLocation ) {
		return NO_QUERY;
	}

	return isLoading ? { ...shown, isLoading: true } : result;
}
