/**
 * External dependencies
 */
import { describe, expect, it } from 'vitest';

/**
 * Internal dependencies
 */
import { createDateApi } from '../date-format';

/*
 * Expected values come from PHP (DateTime::format() and wp_date()), which
 * renders the same dates on the server: the page must not change once
 * scripts run.
 */

// What WordPress passes for a French site (WP_Locale, general settings).
const FRENCH_SITE = {
	l10n: {
		months: [
			'janvier',
			'février',
			'mars',
			'avril',
			'mai',
			'juin',
			'juillet',
			'août',
			'septembre',
			'octobre',
			'novembre',
			'décembre',
		],
		monthsShort: [
			'Jan',
			'Fév',
			'Mar',
			'Avr',
			'Mai',
			'Juin',
			'Juil',
			'Août',
			'Sep',
			'Oct',
			'Nov',
			'Déc',
		],
		weekdays: [
			'dimanche',
			'lundi',
			'mardi',
			'mercredi',
			'jeudi',
			'vendredi',
			'samedi',
		],
		weekdaysShort: [ 'dim', 'lun', 'mar', 'mer', 'jeu', 'ven', 'sam' ],
		meridiem: { am: 'mat.', pm: 'ap.m.', AM: 'MAT.', PM: 'AP.M.' },
	},
	formats: { date: 'j F Y', time: 'G\\hi' },
	timezone: { string: 'Europe/Paris', offset: 2 },
};

// 14:05:09 in Tokyo = 07:05:09 in Paris = 05:05:09 UTC.
const TOKYO_AFTERNOON = '2026-07-01T14:05:09+09:00';

describe( 'createDateApi', () => {
	const api = createDateApi( FRENCH_SITE );

	it( 'formats in the timezone of the location, whatever the timezone of the visitor', () => {
		expect(
			api.dateI18n( 'Y-m-d H:i:s', TOKYO_AFTERNOON, 'Asia/Tokyo' )
		).toBe( '2026-07-01 14:05:09' );
	} );

	it( 'formats in the timezone of the site without one', () => {
		expect( api.dateI18n( 'H:i', TOKYO_AFTERNOON ) ).toBe( '07:05' );
	} );

	it( 'falls back to the timezone of the site when the one given is unknown', () => {
		expect( api.dateI18n( 'H:i', TOKYO_AFTERNOON, 'Mars/Olympus' ) ).toBe(
			'07:05'
		);
	} );

	it( 'uses the UTC offset of a site set to one instead of a city', () => {
		const offsetSite = createDateApi( {
			...FRENCH_SITE,
			timezone: { string: '', offset: 5.5 },
		} );

		expect( offsetSite.dateI18n( 'H:i P', TOKYO_AFTERNOON ) ).toBe(
			'10:35 +05:30'
		);
	} );

	it( 'names days and months in the language of the site', () => {
		expect(
			api.dateI18n( 'l j F Y, D j M', TOKYO_AFTERNOON, 'Asia/Tokyo' )
		).toBe( 'mercredi 1 juillet 2026, mer 1 Juil' );
	} );

	it( 'uses the meridiem of the site', () => {
		expect(
			api.dateI18n( 'g:i a / A', TOKYO_AFTERNOON, 'Asia/Tokyo' )
		).toBe( '2:05 ap.m. / AP.M.' );
	} );

	it( 'names days and months in English with date(), like PHP date()', () => {
		expect(
			api.date( 'D, d M Y — l F a A', TOKYO_AFTERNOON, 'Asia/Tokyo' )
		).toBe( 'Wed, 01 Jul 2026 — Wednesday July pm PM' );
	} );

	it( 'prints escaped characters as they are', () => {
		expect(
			api.dateI18n( 'G\\hi, \\l\\e j', TOKYO_AFTERNOON, 'Asia/Tokyo' )
		).toBe( '14h05, le 1' );
	} );

	it( 'counts days, weeks and years like PHP', () => {
		expect(
			api.date( 'N w z t L W o S y', TOKYO_AFTERNOON, 'Asia/Tokyo' )
		).toBe( '3 3 181 31 0 27 2026 st 26' );
		// 1 January 2027 belongs to the last ISO week of 2026.
		expect( api.date( 'W o', '2027-01-01T12:00:00+00:00', 'UTC' ) ).toBe(
			'53 2026'
		);
	} );

	it( 'writes hours on 12 and 24 hours like PHP', () => {
		expect(
			api.date( 'g h G H a A', '2026-07-01T00:30:00+00:00', 'UTC' )
		).toBe( '12 12 0 00 am AM' );
	} );

	it( 'writes the timezone and its offset like PHP', () => {
		expect(
			api.date( 'e I O P p Z', TOKYO_AFTERNOON, 'Europe/Paris' )
		).toBe( 'Europe/Paris 1 +0200 +02:00 +02:00 7200' );
		expect(
			api.date( 'I', '2026-01-15T12:00:00+00:00', 'Europe/Paris' )
		).toBe( '0' );
		expect( api.date( 'p P', TOKYO_AFTERNOON, 'UTC' ) ).toBe( 'Z +00:00' );
	} );

	it( 'writes full dates like PHP, translated by dateI18n()', () => {
		expect( api.date( 'c', TOKYO_AFTERNOON, 'Europe/Paris' ) ).toBe(
			'2026-07-01T07:05:09+02:00'
		);
		expect( api.date( 'r', TOKYO_AFTERNOON, 'Europe/Paris' ) ).toBe(
			'Wed, 01 Jul 2026 07:05:09 +0200'
		);
		expect( api.dateI18n( 'r', TOKYO_AFTERNOON, 'Europe/Paris' ) ).toBe(
			'mer, 01 Juil 2026 07:05:09 +0200'
		);
	} );

	it( 'writes Unix time, Swatch time and fractions of a second like PHP', () => {
		expect( api.date( 'U B u v', TOKYO_AFTERNOON, 'Asia/Tokyo' ) ).toBe(
			'1782882309 253 000000 000'
		);
	} );

	it( 'accepts a Date and a number of milliseconds', () => {
		const ms = Date.parse( TOKYO_AFTERNOON );

		expect( api.date( 'H:i', new Date( ms ), 'Asia/Tokyo' ) ).toBe(
			'14:05'
		);
		expect( api.date( 'H:i', ms, 'Asia/Tokyo' ) ).toBe( '14:05' );
	} );

	it( 'reads the date and time formats of the site', () => {
		expect( api.getSettings().formats ).toEqual( {
			date: 'j F Y',
			time: 'G\\hi',
		} );
	} );

	it( 'works without settings, in English and UTC', () => {
		expect( createDateApi().dateI18n( 'D H:i', TOKYO_AFTERNOON ) ).toBe(
			'Wed 05:05'
		);
	} );
} );

describe( 'timezone abbreviations (T)', () => {
	const seconds = ( iso ) => Date.parse( iso ) / 1000;

	// What the server read in its timezone database for the weather forecast
	// period (meta.timezone_abbreviations): Paris leaves summer time on 25
	// October.
	const api = createDateApi( {
		abbreviations: {
			'Europe/Paris': [
				{ from: seconds( '2026-10-24T06:26:00Z' ), abbr: 'CEST' },
				{ from: seconds( '2026-10-25T01:00:00Z' ), abbr: 'CET' },
			],
		},
	} );

	it( 'names the timezone like PHP, which Intl cannot', () => {
		expect(
			api.dateI18n( 'H:i T', '2026-10-25T02:30:00+02:00', 'Europe/Paris' )
		).toBe( '02:30 CEST' );
		expect(
			api.date( 'H:i T', '2026-10-25T02:30:00+01:00', 'Europe/Paris' )
		).toBe( '02:30 CET' );
	} );

	it( 'falls back to the name Intl knows outside the period or for another timezone', () => {
		expect( api.date( 'T', '2026-10-24T06:25:00Z', 'Europe/Paris' ) ).toBe(
			'GMT+2'
		);
		expect( api.date( 'T', '2026-10-24T12:00:00Z', 'Asia/Tokyo' ) ).toBe(
			'GMT+9'
		);
	} );
} );

describe( 'declined month names, like wp_maybe_decline_date()', () => {
	// What WordPress passes for a Russian site (WP_Locale, core translation of
	// "decline months names: on or off").
	const RUSSIAN = {
		locale: 'ru_RU',
		declineMonths: true,
		months: [
			'Январь',
			'Февраль',
			'Март',
			'Апрель',
			'Май',
			'Июнь',
			'Июль',
			'Август',
			'Сентябрь',
			'Октябрь',
			'Ноябрь',
			'Декабрь',
		],
		monthsGenitive: [
			'января',
			'февраля',
			'марта',
			'апреля',
			'мая',
			'июня',
			'июля',
			'августа',
			'сентября',
			'октября',
			'ноября',
			'декабря',
		],
	};
	const JANUARY_5 = '2026-01-05T12:00:00Z';
	const api = createDateApi( { l10n: RUSSIAN } );

	it( 'declines the month after the day', () => {
		expect( api.dateI18n( 'j F Y', JANUARY_5, 'UTC' ) ).toBe(
			'5 января 2026'
		);
		expect( api.dateI18n( 'd. F', JANUARY_5, 'UTC' ) ).toBe( '05. января' );
	} );

	it( 'puts the day first and declines the month before the day', () => {
		expect( api.dateI18n( 'F j', JANUARY_5, 'UTC' ) ).toBe( '5 января' );
		expect( api.dateI18n( 'F jS, Y', JANUARY_5, 'UTC' ) ).toBe(
			'5 января, 2026'
		);
	} );

	it( 'keeps the month as it is without a day next to it', () => {
		expect( api.dateI18n( 'F Y', JANUARY_5, 'UTC' ) ).toBe( 'Январь 2026' );
	} );

	it( 'declines nothing in a language that does not, nor with date()', () => {
		expect(
			createDateApi( {
				l10n: { ...RUSSIAN, declineMonths: false },
			} ).dateI18n( 'j F Y', JANUARY_5, 'UTC' )
		).toBe( '5 Январь 2026' );
		expect( api.date( 'j F Y', JANUARY_5, 'UTC' ) ).toBe(
			'5 January 2026'
		);
	} );

	it( 'elides "de" before a vowel in Catalan', () => {
		const catalan = createDateApi( {
			l10n: {
				locale: 'ca',
				months: [
					'gener',
					'febrer',
					'març',
					'abril',
					'maig',
					'juny',
					'juliol',
					'agost',
					'setembre',
					'octubre',
					'novembre',
					'desembre',
				],
			},
		} );
		const format = 'j \\d\\e F \\d\\e Y';

		expect(
			catalan.dateI18n( format, '2026-04-05T12:00:00Z', 'UTC' )
		).toBe( "5 d'abril de 2026" );
		expect(
			catalan.dateI18n( format, '2026-01-05T12:00:00Z', 'UTC' )
		).toBe( '5 de gener de 2026' );
	} );
} );

describe( 'relative dates, like the "human-diff" format of the Date block', () => {
	const NOW = Date.parse( '2026-07-01T12:00:00Z' );
	const ago = ( seconds ) => NOW - seconds * 1000;
	const french = createDateApi( { l10n: { locale: 'fr_FR' } } );
	const english = createDateApi( { l10n: { locale: 'en_US' } } );

	it( 'words the time to now in the language of the site', () => {
		expect( french.relative( ago( 5 * 60 ), NOW ) ).toBe(
			'il y a 5 minutes'
		);
		expect( english.relative( ago( -3 * 3600 ), NOW ) ).toBe(
			'in 3 hours'
		);
	} );

	it( 'says "now" under 45 seconds', () => {
		expect( english.relative( ago( 44 ), NOW ) ).toBe( 'now' );
		expect( french.relative( ago( -10 ), NOW ) ).toBe( 'maintenant' );
	} );

	it( 'moves to the next unit at the thresholds of humanTimeDiff()', () => {
		expect( english.relative( ago( 45 ), NOW ) ).toBe( '1 minute ago' );
		expect( english.relative( ago( 44 * 60 ), NOW ) ).toBe(
			'44 minutes ago'
		);
		expect( english.relative( ago( 45 * 60 ), NOW ) ).toBe( '1 hour ago' );
		expect( english.relative( ago( 21 * 3600 ), NOW ) ).toBe(
			'21 hours ago'
		);
		expect( english.relative( ago( 22 * 3600 ), NOW ) ).toBe( '1 day ago' );
		expect( english.relative( ago( 26 * 86400 ), NOW ) ).toBe(
			'1 month ago'
		);
		expect( english.relative( ago( 400 * 86400 ), NOW ) ).toBe(
			'1 year ago'
		);
	} );

	it( 'reads the language of a WordPress locale Intl does not know as a whole', () => {
		const formal = createDateApi( { l10n: { locale: 'de_DE_formal' } } );

		expect( formal.relative( ago( -3 * 3600 ), NOW ) ).toBe(
			'in 3 Stunden'
		);
	} );

	it( 'falls back to English without a locale', () => {
		expect( createDateApi().relative( ago( 120 ), NOW ) ).toBe(
			'2 minutes ago'
		);
	} );

	it( 'prints nothing for a value that is not a date', () => {
		expect( english.relative( 'soon', NOW ) ).toBe( '' );
	} );
} );
