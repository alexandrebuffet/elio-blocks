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
		get cloudCover() {
			return toText( getContext().item?.cloud_cover );
		},
		get cloudCoverUnit() {
			return percentLabel( getContext().item?.cloud_cover );
		},
	},
} );
