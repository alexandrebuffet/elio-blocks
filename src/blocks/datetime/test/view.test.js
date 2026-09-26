/**
 * External dependencies
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Internal dependencies
 */
import {
	getStore,
	setContext,
	setServerState,
} from '../../../test-utils/interactivity';
import '../view';

vi.mock( '@wordpress/interactivity', async () => {
	const { mockInteractivity } =
		await import( '../../../test-utils/interactivity' );
	return mockInteractivity;
} );

const state = () => getStore( 'elio/weather-report' ).state;

// Date settings the block puts in the state of the page (DateSettings in PHP).
const SITE_DATES = {
	l10n: {
		weekdays: [
			'dimanche',
			'lundi',
			'mardi',
			'mercredi',
			'jeudi',
			'vendredi',
			'samedi',
		],
	},
	formats: { date: 'l j', time: 'H:i' },
	timezone: { string: 'UTC', offset: 0 },
};

beforeEach( () => {
	setServerState( { dateSettings: SITE_DATES } );
} );

function makeContext( overrides = {} ) {
	return {
		displayType: 'time',
		format: 'H:i',
		currentAsLabel: false,
		todayLabel: 'Today',
		nowLabel: 'Now',
		item: { timestamp: '2026-07-01T14:15:00+09:00' },
		query: { data: { meta: { timezone: 'Asia/Tokyo' } } },
		...overrides,
	};
}

describe( 'datetime view', () => {
	afterEach( () => {
		vi.useRealTimers();
	} );

	it( 'formats the time in the timezone of the location, not the one of the site or the visitor', () => {
		setContext( makeContext() );

		expect( state().formattedDateTime ).toBe( '14:15' );
	} );

	it( 'exposes the ISO timestamp for the datetime attribute', () => {
		setContext( makeContext() );

		expect( state().datetime ).toBe( '2026-07-01T14:15:00+09:00' );
	} );

	it( 'falls back to the site timezone when the provider gives none', () => {
		setContext( makeContext( { query: { data: { meta: {} } } } ) );

		expect( state().formattedDateTime ).toBe( '05:15' );
	} );

	it( 'names the day in the language of the site, with the date format of the site', () => {
		setContext( makeContext( { displayType: 'date', format: '' } ) );

		expect( state().formattedDateTime ).toBe( 'mercredi 1' );
	} );

	it( 'needs no wp-date script: only the settings in the state of the page', () => {
		expect( global.wp?.date ).toBeUndefined();
		setContext( makeContext() );

		expect( state().formattedDateTime ).toBe( '14:15' );
	} );

	it( 'decides "Today" where the weather forecast is: noon on 1 July is yesterday at 00:30 on 2 July in Tokyo', () => {
		vi.useFakeTimers().setSystemTime(
			new Date( '2026-07-02T00:30:00+09:00' )
		);
		const context = {
			displayType: 'date',
			format: 'Y-m-d',
			currentAsLabel: true,
		};

		setContext(
			makeContext( {
				...context,
				item: { timestamp: '2026-07-01T12:00:00+09:00' },
			} )
		);
		expect( state().formattedDateTime ).toBe( '2026-07-01' );

		setContext(
			makeContext( {
				...context,
				item: { timestamp: '2026-07-02T00:00:00+09:00' },
			} )
		);
		expect( state().formattedDateTime ).toBe( 'Today' );
	} );

	it( 'labels the row of the current hour "Now"', () => {
		vi.useFakeTimers().setSystemTime(
			new Date( '2026-07-02T00:30:00+09:00' )
		);

		setContext(
			makeContext( {
				currentAsLabel: true,
				item: { timestamp: '2026-07-02T00:00:00+09:00' },
			} )
		);
		expect( state().formattedDateTime ).toBe( 'Now' );

		setContext(
			makeContext( {
				currentAsLabel: true,
				item: { timestamp: '2026-07-02T01:00:00+09:00' },
			} )
		);
		expect( state().formattedDateTime ).toBe( '01:00' );
	} );

	it( 'names the timezone of the location like the server, from the weather forecast', () => {
		setContext(
			makeContext( {
				format: 'H:i T',
				query: {
					data: {
						meta: {
							timezone: 'Asia/Tokyo',
							// Intl knows "GMT+9" only.
							timezone_abbreviations: [
								{ from: 1782831600, abbr: 'JST' },
							],
						},
					},
				},
			} )
		);

		expect( state().formattedDateTime ).toBe( '14:15 JST' );
	} );

	it( 'prints nothing for a missing or unreadable timestamp', () => {
		setContext( makeContext( { item: null } ) );
		expect( state().formattedDateTime ).toBe( '' );

		setContext( makeContext( { item: { timestamp: 'soon' } } ) );
		expect( state().formattedDateTime ).toBe( '' );
	} );
} );
