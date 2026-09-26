/**
 * WordPress dependencies
 */
import { store, getContext } from '@wordpress/interactivity';

/**
 * Internal dependencies
 */
import {
	getWindSpeed,
	toText,
	windUnitLabel,
} from '../../shared/weather-values';

/*
 * Getters mirrored server-side by DerivedState (PHP), which prints the same
 * values in the server-rendered HTML. Logic lives in shared/weather-values.
 */
store( 'elio/weather-report', {
	state: {
		/**
		 * Returns the wind speed or gusts, already in the unit of the site: the
		 * REST API and the server render convert values, this script never does.
		 */
		get windSpeed() {
			const { item, displayType = '' } = getContext();
			return toText( getWindSpeed( item, displayType ) );
		},
		get windSpeedUnit() {
			const context = getContext();
			return windUnitLabel(
				getWindSpeed( context.item, context.displayType ),
				context
			);
		},
	},
} );
