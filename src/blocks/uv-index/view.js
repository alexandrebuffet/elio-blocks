/**
 * WordPress dependencies
 */
import { store, getContext } from '@wordpress/interactivity';

/**
 * Internal dependencies
 */
import { getUvIndex, toText } from '../../shared/weather-values';

/*
 * Getters mirrored server-side by DerivedState (PHP), which prints the same
 * values in the server-rendered HTML. Logic lives in shared/weather-values.
 */
store( 'elio/weather-report', {
	state: {
		get uvIndex() {
			return toText( getUvIndex( getContext().item ) );
		},
	},
} );
