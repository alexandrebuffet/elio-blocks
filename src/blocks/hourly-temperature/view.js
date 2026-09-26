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
store( 'elio/weather-report', {
	state: {
		get hourlyTemperature() {
			const { item, displayType } = getContext();
			return toText( getHourlyTemperature( item, displayType ) );
		},
		get hourlyTemperatureUnit() {
			const context = getContext();
			return temperatureUnitLabel(
				getHourlyTemperature( context.item, context.displayType ),
				context
			);
		},
	},
} );
