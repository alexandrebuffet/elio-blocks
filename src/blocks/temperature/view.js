/**
 * WordPress dependencies
 */
import { store, getContext } from '@wordpress/interactivity';

/**
 * Internal dependencies
 */
import {
	getHourlyTemperature,
	temperatureUnitLabel,
	toText,
} from '../../shared/weather-values';

/*
 * Getters mirrored server-side by DerivedState (PHP), which prints the same
 * values in the server-rendered HTML. Logic lives in shared/weather-values.
 */

/**
 * Returns the temperature of the report: always the current conditions, even
 * inside a forecast row (the block is not meant for rows, see daily/hourly-temperature).
 *
 * @return {number|null} Current temperature, or the one it feels like.
 */
function getCurrentTemperature() {
	const { query, displayType = '' } = getContext();

	return getHourlyTemperature(
		query?.data?.current,
		displayType === 'feels-like' ? 'feels-like' : 'temperature'
	);
}

const { state } = store( 'elio/weather-report', {
	state: {
		get temperature() {
			return toText( getCurrentTemperature() );
		},
		get unit() {
			return temperatureUnitLabel(
				getCurrentTemperature(),
				getContext()
			);
		},
		get formattedTemperature() {
			return `${ state.temperature }${ state.unit }`;
		},
	},
} );
