/**
 * Dates in PHP date() format, as wp_date() prints them on the server.
 *
 * Replaces `@wordpress/date` on the front: that script ships moment and
 * moment-timezone (with their timezone database) for what the browser does
 * natively. Timezones are resolved with Intl; day and month names are the ones
 * of WP_Locale, passed by the server, so the page does not change once scripts
 * run. Month names are declined like wp_maybe_decline_date() does.
 *
 * What the browser cannot know comes from the server too: the names PHP gives
 * a timezone (`T`: "CEST" where Intl says "GMT+2"), read in its timezone
 * database for the period of a weather forecast.
 *
 * @typedef {Object} DateSettings
 * @property {Object} [l10n]          Names: months, monthsShort, weekdays, weekdaysShort, meridiem {am, pm, AM, PM}; declension: locale, declineMonths, monthsGenitive.
 * @property {Object} [formats]       Site formats: date, time.
 * @property {Object} [timezone]      Site timezone: string (IANA name, may be empty), offset (hours).
 * @property {Object} [abbreviations] Names of timezones (`T`), by IANA name: [{from, abbr}], each in force from a Unix time on.
 */

const ENGLISH = {
	months: [
		'January',
		'February',
		'March',
		'April',
		'May',
		'June',
		'July',
		'August',
		'September',
		'October',
		'November',
		'December',
	],
	monthsShort: [
		'Jan',
		'Feb',
		'Mar',
		'Apr',
		'May',
		'Jun',
		'Jul',
		'Aug',
		'Sep',
		'Oct',
		'Nov',
		'Dec',
	],
	weekdays: [
		'Sunday',
		'Monday',
		'Tuesday',
		'Wednesday',
		'Thursday',
		'Friday',
		'Saturday',
	],
	weekdaysShort: [ 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat' ],
	meridiem: { am: 'am', pm: 'pm', AM: 'AM', PM: 'PM' },
};

const DAY = 86400000;

/*
 * \b of PCRE with the u flag, which wp_maybe_decline_date() uses: word
 * characters are Unicode letters and digits. JavaScript's \b only knows ASCII,
 * and would find no word in "Январь".
 */
const WORD = '[\\p{L}\\p{N}\\p{Mn}\\p{Pc}]';
const BOUNDARY = `(?:(?<=${ WORD })(?!${ WORD })|(?<!${ WORD })(?=${ WORD }))`;

/**
 * Intl formatters by timezone: building one is the slow part.
 *
 * @type {Map<string, Intl.DateTimeFormat|null>}
 */
const formatters = new Map();

/**
 * Units of a relative date ("5 minutes ago"), each with its length in seconds
 * and the count from which the next one is used: the thresholds of moment's
 * fromNow(), which humanTimeDiff() of `@wordpress/date` and the "human-diff"
 * option of the date format picker follow. Under 45 seconds, the date is "now".
 */
const RELATIVE_UNITS = [
	[ 'minute', 60, 45 ],
	[ 'hour', 3600, 22 ],
	[ 'day', 86400, 26 ],
	[ 'month', 2629800, 11 ],
	[ 'year', 31557600, Infinity ],
];

/**
 * Intl relative time formatters by WordPress locale.
 *
 * @type {Map<string, {auto: Intl.RelativeTimeFormat, always: Intl.RelativeTimeFormat}>}
 */
const relativeFormatters = new Map();

/**
 * Returns the relative time formatters of a WordPress locale, built once: the
 * browser words relative dates in the language of the site, which the view
 * scripts could not translate ("fr_FR", "de_DE_formal": its language and
 * region, else its language, else English).
 *
 * @param {string} [locale] WordPress locale.
 * @return {{auto: Intl.RelativeTimeFormat, always: Intl.RelativeTimeFormat}} Formatters: "now" (auto), counts (always).
 */
function getRelativeFormatters( locale = '' ) {
	if ( ! relativeFormatters.has( locale ) ) {
		const parts = String( locale ).split( '_' );
		const tags = [ parts.slice( 0, 2 ).join( '-' ), parts[ 0 ], 'en' ];
		let relative = null;

		for ( const tag of tags ) {
			try {
				relative = {
					auto: new Intl.RelativeTimeFormat( tag, {
						numeric: 'auto',
					} ),
					always: new Intl.RelativeTimeFormat( tag ),
				};
				break;
			} catch {
				// RangeError: not a language tag.
			}
		}

		relativeFormatters.set( locale, relative );
	}

	return relativeFormatters.get( locale );
}

/**
 * Words the time between a date and now: "5 minutes ago", "in 3 hours", "now".
 *
 * @param {number} ms     Milliseconds since the epoch.
 * @param {number} now    Milliseconds since the epoch the date is counted from.
 * @param {string} locale WordPress locale.
 * @return {string} Relative date.
 */
function formatRelativeDate( ms, now, locale ) {
	const { auto, always } = getRelativeFormatters( locale );
	const seconds = ( ms - now ) / 1000;

	if ( Math.abs( seconds ) < 45 ) {
		return auto.format( 0, 'second' );
	}

	for ( const [ unit, length, next ] of RELATIVE_UNITS ) {
		const count = Math.max( 1, Math.round( Math.abs( seconds ) / length ) );

		if ( count < next ) {
			return always.format( Math.sign( seconds ) * count, unit );
		}
	}

	return '';
}

/**
 * Returns the Intl formatter of a timezone, built once.
 *
 * @param {string} timeZone IANA timezone name.
 * @return {Intl.DateTimeFormat|null} Formatter, null for an unknown timezone.
 */
function getFormatter( timeZone ) {
	if ( ! formatters.has( timeZone ) ) {
		let formatter = null;
		try {
			formatter = new Intl.DateTimeFormat( 'en-US', {
				timeZone,
				hourCycle: 'h23',
				year: 'numeric',
				month: 'numeric',
				day: 'numeric',
				hour: 'numeric',
				minute: 'numeric',
				second: 'numeric',
			} );
		} catch {
			// RangeError: not a timezone this browser knows.
		}
		formatters.set( timeZone, formatter );
	}

	return formatters.get( timeZone );
}

/**
 * Returns the UTC offset of a timezone at a given time.
 *
 * @param {number}              ms        Milliseconds since the epoch, whole seconds.
 * @param {Intl.DateTimeFormat} formatter Formatter of the timezone.
 * @return {number} Offset in minutes.
 */
function offsetAt( ms, formatter ) {
	const parts = {};
	for ( const { type, value } of formatter.formatToParts( ms ) ) {
		parts[ type ] = Number( value );
	}
	const wall = Date.UTC(
		parts.year,
		parts.month - 1,
		parts.day,
		parts.hour,
		parts.minute,
		parts.second
	);

	return Math.round( ( wall - ms ) / 60000 );
}

/**
 * Resolves where to read the wall clock: a named timezone, or a fixed UTC offset.
 *
 * @param {string|undefined} timezone      Timezone asked for.
 * @param {Object}           site          Site timezone settings.
 * @param {Object}           abbreviations Names PHP gives timezones, by IANA name.
 * @return {{name: string, formatter: Intl.DateTimeFormat|null, offset: number, abbreviations: Array}} Zone.
 */
function resolveZone( timezone, site = {}, abbreviations = {} ) {
	for ( const name of [ timezone, site.string ] ) {
		const formatter = name ? getFormatter( name ) : null;
		if ( formatter ) {
			return {
				name,
				formatter,
				offset: 0,
				abbreviations: abbreviations[ name ] ?? [],
			};
		}
	}

	const offset = Math.round( Number( site.offset || 0 ) * 60 );

	return {
		name: offset ? formatOffset( offset, ':' ) : 'UTC',
		formatter: null,
		offset,
		abbreviations: [],
	};
}

/**
 * Formats a UTC offset, as the O and P characters of PHP date() do.
 *
 * @param {number} minutes   Offset in minutes.
 * @param {string} separator Between hours and minutes.
 * @return {string} "+0930" or "+09:30".
 */
function formatOffset( minutes, separator ) {
	const sign = minutes < 0 ? '-' : '+';
	const abs = Math.abs( minutes );

	return sign + pad( Math.floor( abs / 60 ) ) + separator + pad( abs % 60 );
}

function pad( value, length = 2 ) {
	return String( value ).padStart( length, '0' );
}

/**
 * Converts a date to milliseconds since the epoch.
 *
 * @param {Date|string|number} value Date, ISO 8601 date-time or milliseconds.
 * @return {number} Milliseconds since the epoch, NaN when invalid.
 */
function toMilliseconds( value ) {
	if ( value instanceof Date ) {
		return value.getTime();
	}

	return typeof value === 'number' ? value : Date.parse( value );
}

/**
 * Returns the date as read on the wall clock of a zone.
 *
 * @param {number} ms   Milliseconds since the epoch.
 * @param {Object} zone Zone from resolveZone().
 * @return {Object} Parts, and the UTC offset in minutes.
 */
function wallClock( ms, zone ) {
	const seconds = Math.floor( ms / 1000 ) * 1000;
	const offset = zone.formatter
		? offsetAt( seconds, zone.formatter )
		: zone.offset;
	const wall = new Date( seconds + offset * 60000 );

	return {
		ms: seconds,
		offset,
		year: wall.getUTCFullYear(),
		month: wall.getUTCMonth(),
		day: wall.getUTCDate(),
		weekday: wall.getUTCDay(),
		hours: wall.getUTCHours(),
		minutes: wall.getUTCMinutes(),
		seconds: wall.getUTCSeconds(),
	};
}

/**
 * Returns the ISO 8601 week number and week-numbering year.
 *
 * @param {Object} d Wall clock parts.
 * @return {{week: number, year: number}} ISO week.
 */
function isoWeek( d ) {
	// The Thursday of the week decides its year.
	const thursday = new Date(
		Date.UTC( d.year, d.month, d.day + 3 - ( ( d.weekday + 6 ) % 7 ) )
	);
	const year = thursday.getUTCFullYear();
	const week =
		1 + Math.floor( ( thursday - Date.UTC( year, 0, 1 ) ) / DAY / 7 );

	return { week, year };
}

function ordinalSuffix( day ) {
	if ( day >= 11 && day <= 13 ) {
		return 'th';
	}

	return { 1: 'st', 2: 'nd', 3: 'rd' }[ day % 10 ] ?? 'th';
}

/**
 * Tells whether daylight saving time is in effect: the offset is above the lower
 * of the January and July offsets of that year.
 *
 * @param {Object} d    Wall clock parts.
 * @param {Object} zone Zone from resolveZone().
 * @return {boolean} DST in effect.
 */
function isDaylightSaving( d, zone ) {
	if ( ! zone.formatter ) {
		return false;
	}
	const standard = Math.min(
		offsetAt( Date.UTC( d.year, 0, 1 ), zone.formatter ),
		offsetAt( Date.UTC( d.year, 6, 1 ), zone.formatter )
	);

	return d.offset > standard;
}

/**
 * Returns the short timezone name: the one PHP gives when the server passed it for that
 * time, the one Intl knows otherwise.
 *
 * @param {number} ms   Milliseconds since the epoch.
 * @param {Object} zone Zone from resolveZone().
 * @return {string} Name.
 */
function zoneAbbreviation( ms, zone ) {
	if ( ! zone.formatter ) {
		return zone.name;
	}
	const known = zone.abbreviations.findLast(
		( { from } ) => from * 1000 <= ms
	);
	if ( known ) {
		return known.abbr;
	}
	const part = new Intl.DateTimeFormat( 'en-US', {
		timeZone: zone.name,
		timeZoneName: 'short',
	} )
		.formatToParts( ms )
		.find( ( { type } ) => type === 'timeZoneName' );

	return part?.value ?? zone.name;
}

/**
 * Formats a date as PHP date() does, on the wall clock of a zone.
 *
 * @param {string} dateFormat PHP date format.
 * @param {number} ms         Milliseconds since the epoch.
 * @param {Object} zone       Zone from resolveZone().
 * @param {Object} names      Day, month and meridiem names.
 * @return {string} Formatted date.
 */
function formatDate( dateFormat, ms, zone, names ) {
	const d = wallClock( ms, zone );
	const hours12 = d.hours % 12 || 12;
	const meridiem = d.hours < 12 ? 'am' : 'pm';

	const tokens = {
		d: () => pad( d.day ),
		D: () => names.weekdaysShort[ d.weekday ],
		j: () => String( d.day ),
		l: () => names.weekdays[ d.weekday ],
		N: () => String( d.weekday || 7 ),
		S: () => ordinalSuffix( d.day ),
		w: () => String( d.weekday ),
		z: () =>
			String(
				( Date.UTC( d.year, d.month, d.day ) -
					Date.UTC( d.year, 0, 1 ) ) /
					DAY
			),
		W: () => pad( isoWeek( d ).week ),
		F: () => names.months[ d.month ],
		m: () => pad( d.month + 1 ),
		M: () => names.monthsShort[ d.month ],
		n: () => String( d.month + 1 ),
		t: () =>
			String(
				new Date( Date.UTC( d.year, d.month + 1, 0 ) ).getUTCDate()
			),
		L: () =>
			new Date( Date.UTC( d.year, 1, 29 ) ).getUTCMonth() === 1
				? '1'
				: '0',
		o: () => String( isoWeek( d ).year ),
		Y: () => pad( d.year, 4 ),
		y: () => pad( d.year % 100 ),
		a: () => names.meridiem[ meridiem ],
		A: () => names.meridiem[ meridiem.toUpperCase() ],
		B: () =>
			pad( Math.floor( ( ( d.ms / 1000 + 3600 ) % 86400 ) / 86.4 ), 3 ),
		g: () => String( hours12 ),
		G: () => String( d.hours ),
		h: () => pad( hours12 ),
		H: () => pad( d.hours ),
		i: () => pad( d.minutes ),
		s: () => pad( d.seconds ),
		u: () => '000000',
		v: () => '000',
		e: () => zone.name,
		I: () => ( isDaylightSaving( d, zone ) ? '1' : '0' ),
		O: () => formatOffset( d.offset, '' ),
		P: () => formatOffset( d.offset, ':' ),
		p: () => ( d.offset ? formatOffset( d.offset, ':' ) : 'Z' ),
		T: () => zoneAbbreviation( d.ms, zone ),
		Z: () => String( d.offset * 60 ),
		U: () => String( d.ms / 1000 ),
	};

	// Full formats, expanded like wp_date() does so their names are translated too.
	const expanded = dateFormat.replace( /(\\.)|[cr]/g, ( match, escaped ) => {
		if ( escaped ) {
			return escaped;
		}
		return match === 'c' ? 'Y-m-d\\TH:i:sP' : 'D, d M Y H:i:s O';
	} );

	let result = '';
	for ( let i = 0; i < expanded.length; i++ ) {
		const char = expanded[ i ];
		if ( char === '\\' ) {
			i++;
			result += expanded[ i ] ?? '';
		} else {
			result += tokens[ char ] ? tokens[ char ]() : char;
		}
	}

	return result;
}

function escapeRegExp( text ) {
	return text.replace( /[.*+?^${}()|[\]\\]/g, '\\$&' );
}

/**
 * Declines a date, a port of wp_maybe_decline_date(): month names in the genitive case where the
 * language asks for it ("5 января", not "5 Январь"), and the rules of some
 * locales.
 *
 * @param {string} date       Formatted date.
 * @param {string} dateFormat PHP date format it was formatted with.
 * @param {Object} names      Names, with the declension settings of the site.
 * @return {string} Date, declined.
 */
function declineDate( date, dateFormat, names ) {
	let declined = date;

	if ( names.declineMonths && names.monthsGenitive ) {
		const months = names.months.map( escapeRegExp );

		// "j F Y": the month follows the day.
		if ( /[dj]\.? F/.test( dateFormat ) ) {
			months.forEach( ( month, i ) => {
				declined = declined.replace(
					new RegExp( ` ${ month }${ BOUNDARY }`, 'gu' ),
					` ${ names.monthsGenitive[ i ] }`
				);
			} );
		}

		// "F j": the day goes first, the month is declined.
		if ( /F [dj]/.test( dateFormat ) ) {
			months.forEach( ( month, i ) => {
				declined = declined.replace(
					new RegExp(
						`${ BOUNDARY }${ month } (\\p{Nd}{1,2})(st|nd|rd|th)?([-–]\\p{Nd}{1,2})?(st|nd|rd|th)?${ BOUNDARY }`,
						'gu'
					),
					( match, day, suffix, range = '' ) =>
						`${ day }${ range } ${ names.monthsGenitive[ i ] }`
				);
			} );
		}
	}

	if ( names.locale === 'ca' ) {
		// " de abril", " de agost", " de octubre" -> " d'abril"...
		declined = declined.replace( / de ([ao])/gi, " d'$1" );
	}

	return declined;
}

/**
 * Date functions with the signatures of `@wordpress/date`.
 *
 * @typedef {Object} DateApi
 * @property {(format: string, date?: Date|string|number, timezone?: string) => string} date        Formats a date, untranslated.
 * @property {(format: string, date?: Date|string|number, timezone?: string) => string} dateI18n    Formats a date, translated.
 * @property {(date: Date|string|number, now?: Date|string|number) => string}           relative    Words the time between a date and now ("5 minutes ago"), in the language of the site.
 * @property {() => DateSettings}                                                       getSettings Site date settings, with the default formats.
 */

/**
 * Creates date functions with the signatures of `@wordpress/date`.
 *
 * @param {DateSettings} [settings] Site date settings.
 * @return {DateApi} Date API.
 */
export function createDateApi( settings = {} ) {
	const l10n = { ...ENGLISH, ...settings.l10n };
	l10n.meridiem = { ...ENGLISH.meridiem, ...settings.l10n?.meridiem };

	const formatWith = ( names ) => ( dateFormat, value, timezone ) => {
		const ms = toMilliseconds( value ?? Date.now() );

		if ( Number.isNaN( ms ) ) {
			return '';
		}

		return declineDate(
			formatDate(
				dateFormat,
				ms,
				resolveZone(
					timezone,
					settings.timezone,
					settings.abbreviations
				),
				names
			),
			dateFormat,
			names
		);
	};

	return {
		date: formatWith( ENGLISH ),
		dateI18n: formatWith( l10n ),
		relative: ( value, now = Date.now() ) => {
			const ms = toMilliseconds( value );
			const from = toMilliseconds( now );

			return Number.isNaN( ms ) || Number.isNaN( from )
				? ''
				: formatRelativeDate( ms, from, settings.l10n?.locale );
		},
		getSettings: () => ( {
			...settings,
			formats: { date: 'F j, Y', time: 'g:i a', ...settings.formats },
		} ),
	};
}
