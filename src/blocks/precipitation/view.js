/**
 * WordPress dependencies
 */
import { store, getContext } from '@wordpress/interactivity';

/**
 * Internal dependencies
 */
import { toText, precipitationUnitLabel } from '../../shared/weather-values';

/*
 * Getters mirrored server-side by DerivedState (PHP), which prints the same
 * values in the server-rendered HTML. Logic lives in shared/weather-values.
 */
store( 'elio/weather-report', {
	state: {
		get precipitation() {
			return toText( getContext().item?.precipitation );
		},
		get precipitationUnit() {
			const context = getContext();
			return precipitationUnitLabel(
				context.item?.precipitation,
				context
			);
		},
	},
} );
