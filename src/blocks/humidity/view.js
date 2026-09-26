/**
 * WordPress dependencies
 */
import { store, getContext } from '@wordpress/interactivity';

/**
 * Internal dependencies
 */
import { toText, percentLabel } from '../../shared/weather-values';

/*
 * Getters mirrored server-side by DerivedState (PHP), which prints the same
 * values in the server-rendered HTML. Logic lives in shared/weather-values.
 */
store( 'elio/weather-report', {
	state: {
		get humidity() {
			return toText( getContext().item?.humidity );
		},
		get humidityUnit() {
			return percentLabel( getContext().item?.humidity );
		},
	},
} );
