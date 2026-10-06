/**
 * WordPress dependencies
 */
import { store, getContext, getServerState } from '@wordpress/interactivity';

/**
 * Internal dependencies
 */
import { toText } from '../../shared/weather-values';
import { createDateApi } from '../../shared/date-format';
import {
	formatItemDate,
	getWeatherForecastTimezone,
	withWeatherForecastTimezone,
} from '../../shared/weather-dates';

/**
 * Returns the date functions fed with the date settings of the site, which the
 * block puts in the state of the page (no wp-date script: see
 * shared/date-format), and the timezone names of the weather forecast.
 *
 * @param {Object|null} weatherForecast Weather forecast.
 * @return {Object} Date API.
 */
const dateApi = ( weatherForecast ) =>
	createDateApi(
		withWeatherForecastTimezone(
			getServerState().dateSettings,
			weatherForecast
		)
	);

/*
 * Getters mirrored server-side by DerivedState (PHP), which prints the same
 * values in the server-rendered HTML, but for a relative date ("5 minutes
 * ago"): the server prints the date in the site format, stale anyway in a
 * cached page, and the getter words it once the script runs. Logic lives in
 * shared/weather-dates.
 */
const { state } = store( 'elio/weather-report', {
	state: {
		/**
		 * Returns the ISO date-time for the datetime attribute of the <time> element.
		 */
		get datetime() {
			return toText( getContext().item?.timestamp );
		},
		/**
		 * Returns the date or time of the item, in the timezone of the location.
		 */
		get formattedDateTime() {
			const context = getContext();

			return formatItemDate(
				dateApi( context.query?.data ),
				context.item?.timestamp,
				{
					...context,
					timezone: getWeatherForecastTimezone( context.query?.data ),
					// Relative dates count from it, kept current by the report.
					now: state.now,
				}
			);
		},
	},
} );
