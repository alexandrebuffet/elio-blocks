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
 * cached page, and the getter words it once the script runs. They read the
 * weather forecast of the report, which each refresh replaces: the time
 * follows it.
 */
const { state } = store( 'elio/weather-report', {
	state: {
		/**
		 * Returns the ISO date-time the provider was asked at, for the datetime attribute of the <time> element.
		 */
		get lastUpdatedDatetime() {
			return toText( getContext().query?.data?.meta?.fetched_at );
		},
		/**
		 * Returns the time the provider was asked at, in the timezone of the location.
		 */
		get formattedLastUpdated() {
			const { query, format } = getContext();

			return formatItemDate(
				dateApi( query?.data ),
				query?.data?.meta?.fetched_at,
				{
					displayType: 'time',
					format,
					timezone: getWeatherForecastTimezone( query?.data ),
					// Relative dates count from it, kept current by the report.
					now: state.now,
				}
			);
		},
	},
} );
