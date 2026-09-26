/**
 * WordPress dependencies
 */
import { store, getContext } from '@wordpress/interactivity';

/**
 * Internal dependencies
 */
import { toText, pressureUnitLabel } from '../../shared/weather-values';

/*
 * Getters mirrored server-side by DerivedState (PHP), which prints the same
 * values in the server-rendered HTML. Logic lives in shared/weather-values.
 */
store( 'elio/weather-report', {
	state: {
		get pressure() {
			return toText( getContext().item?.pressure );
		},
		get pressureUnit() {
			const context = getContext();
			return pressureUnitLabel( context.item?.pressure, context );
		},
	},
} );
