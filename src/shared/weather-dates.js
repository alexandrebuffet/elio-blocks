/**
 * How the dates of a weather forecast are shown: in the timezone of the
 * location.
 *
 * One definition for the front and the editor, mirrored in PHP by
 * DerivedState. The date functions are passed in because the two sides get
 * the site settings differently: the front from the state of the page, the
 * editor from a global the server prints (getEditorDateSettings()). Both build
 * them with createDateApi() (shared/date-format).
 *
 * @typedef {import('./date-format').DateApi} DateApi
 */

/**
 * Parses an ISO 8601 date-time.
 *
 * @param {string|null|undefined} raw ISO 8601 date-time, with its UTC offset.
 * @return {Date|null} Date, or null when the value is not one.
 */
function toDate( raw ) {
	if ( raw === null || raw === undefined || raw === '' ) {
		return null;
	}

	const date = new Date( raw );

	return isNaN( date.getTime() ) ? null : date;
}

/**
 * Returns the timezone of the weather forecast location, or undefined for the site
 * timezone.
 *
 * @param {Object|null} weatherForecast Weather forecast (meta.timezone).
 * @return {string|undefined} IANA timezone name.
 */
export function getWeatherForecastTimezone( weatherForecast ) {
	return weatherForecast?.meta?.timezone || undefined;
}

/**
 * Returns the date settings for the dates of a weather forecast: the ones of the site, plus
 * the names the server gives the timezone of the location over the weather
 * forecast period (`T`), which the browser has no timezone database for.
 *
 * @param {Object}      settings        Site date settings.
 * @param {Object|null} weatherForecast Weather forecast (meta.timezone, meta.timezone_abbreviations).
 * @return {Object} Date settings.
 */
export function withWeatherForecastTimezone( settings, weatherForecast ) {
	const timezone = getWeatherForecastTimezone( weatherForecast );
	const abbreviations = weatherForecast?.meta?.timezone_abbreviations;

	if ( ! timezone || ! Array.isArray( abbreviations ) ) {
		return settings;
	}

	return {
		...settings,
		abbreviations: {
			...settings?.abbreviations,
			[ timezone ]: abbreviations,
		},
	};
}

/**
 * Returns the date or time of a weather item, or a label for the current day / hour.
 *
 * @param {DateApi}               dateApi                  Date functions.
 * @param {string|null|undefined} raw                      Timestamp of the item.
 * @param {Object}                options                  Options.
 * @param {string}                [options.displayType]    'time' or 'date'.
 * @param {string}                [options.format]         PHP date format. Defaults to the site format.
 * @param {string}                [options.timezone]       Timezone of the location.
 * @param {boolean}               [options.currentAsLabel] Label the current day (date) or hour (time).
 * @param {string}                [options.todayLabel]     Label of the current day.
 * @param {string}                [options.nowLabel]       Label of the current hour.
 * @return {string} Formatted date, empty without a valid timestamp.
 */
export function formatItemDate(
	dateApi,
	raw,
	{
		displayType = 'date',
		format = '',
		timezone,
		currentAsLabel = false,
		todayLabel = '',
		nowLabel = '',
	} = {}
) {
	const date = toDate( raw );

	if ( ! date ) {
		return '';
	}

	const isTime = displayType === 'time';

	if ( currentAsLabel ) {
		// "Now" is the row of the current hour, "Today" the row of the
		// current day, where the weather forecast is.
		const sameAs = isTime ? 'Y-m-d H' : 'Y-m-d';
		const isCurrent =
			dateApi.date( sameAs, date, timezone ) ===
			dateApi.date( sameAs, new Date(), timezone );

		if ( isCurrent ) {
			return isTime ? nowLabel : todayLabel;
		}
	}

	const { formats } = dateApi.getSettings();

	return dateApi.dateI18n(
		format || ( isTime ? formats.time : formats.date ),
		date,
		timezone
	);
}

/**
 * Returns the sunrise or sunset of a weather item. Hourly items have none: they show the
 * one of the day, which the current conditions carry.
 *
 * @param {Object|null} item            Weather item.
 * @param {Object|null} weatherForecast Weather forecast (current conditions).
 * @param {string}      displayType     'sunrise' or 'sunset'.
 * @return {string|null} ISO 8601 date-time, or null.
 */
export function getSunEvent( item, weatherForecast, displayType = 'sunrise' ) {
	const event = displayType === 'sunset' ? 'sunset' : 'sunrise';

	return item?.[ event ] ?? weatherForecast?.current?.[ event ] ?? null;
}
