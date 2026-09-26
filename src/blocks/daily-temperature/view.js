/**
 * WordPress dependencies
 */
import { store, getContext } from '@wordpress/interactivity';

/**
 * Internal dependencies
 */
import {
	getDailyTemperature,
	temperatureUnitLabel,
	toText,
} from '../../shared/weather-values';

/*
 * Getters mirrored server-side by DerivedState (PHP), which prints the same
 * values in the server-rendered HTML. Logic lives in shared/weather-values.
 */
store( 'elio/weather-report', {
	state: {
		get dailyTemperature() {
			const { item, displayType } = getContext();
			return toText( getDailyTemperature( item, displayType ) );
		},
		get dailyTemperatureUnit() {
			const context = getContext();
			return temperatureUnitLabel(
				getDailyTemperature( context.item, context.displayType ),
				context
			);
		},
	},
} );
