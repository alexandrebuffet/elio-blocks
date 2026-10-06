/**
 * External dependencies
 */
import { describe, expect, it } from 'vitest';

/**
 * Internal dependencies
 */
import { getForecastItemEnd, selectForecastItems } from '../forecast-window';

const at = ( iso ) => new Date( iso ).getTime();
const hour = ( h ) => ( { timestamp: `2026-07-01T${ h }:00:00+05:30` } );
const day = ( d ) => ( { timestamp: `2026-07-0${ d }T00:00:00+02:00` } );

/**
 * Same cases as tests/Unit/Interactivity/ForecastWindowTest.php: the server
 * renders the rows, the browser and the editor must pick the same ones.
 */
describe( 'selectForecastItems', () => {
	it( 'starts daily rows at the day in progress at the location', () => {
		const forecast = { daily: [ day( 1 ), day( 2 ), day( 3 ), day( 4 ) ] };

		const rows = selectForecastItems(
			forecast,
			'daily',
			2,
			at( '2026-07-02T10:00:00+02:00' )
		);

		expect( rows ).toEqual( [ day( 2 ), day( 3 ) ] );
	} );

	it( 'does not show a day that just ended, from a copy of the weather forecast taken the day before', () => {
		const forecast = { daily: [ day( 1 ), day( 2 ), day( 3 ) ] };

		// 00:10 in Paris, still 1 July in UTC.
		const rows = selectForecastItems(
			forecast,
			'daily',
			2,
			at( '2026-07-02T00:10:00+02:00' )
		);

		expect( rows ).toEqual( [ day( 2 ), day( 3 ) ] );
	} );

	it( 'ends a day when the next one starts, on a day of 25 hours too', () => {
		// Paris goes back to UTC+01:00 on 25 October.
		const forecast = {
			daily: [
				{ timestamp: '2026-10-25T00:00:00+02:00' },
				{ timestamp: '2026-10-26T00:00:00+01:00' },
			],
		};

		// 23:30 on 25 October, 24 hours and a half after it started.
		const rows = selectForecastItems(
			forecast,
			'daily',
			1,
			at( '2026-10-25T23:30:00+01:00' )
		);

		expect( rows ).toEqual( [ forecast.daily[ 0 ] ] );
	} );

	it( 'starts hourly rows at the hour in progress at the location', () => {
		const forecast = {
			hourly: [ hour( 12 ), hour( 13 ), hour( 14 ), hour( 15 ) ],
		};

		// 13:45 in Kolkata (UTC+05:30), whatever the timezone of the visitor.
		const rows = selectForecastItems(
			forecast,
			'hourly',
			2,
			at( '2026-07-01T13:45:00+05:30' )
		);

		expect( rows ).toEqual( [ hour( 13 ), hour( 14 ) ] );
	} );

	it( 'does not show an hour that just ended', () => {
		const forecast = { hourly: [ hour( 12 ), hour( 13 ), hour( 14 ) ] };

		const rows = selectForecastItems(
			forecast,
			'hourly',
			1,
			at( '2026-07-01T14:00:00+05:30' )
		);

		expect( rows ).toEqual( [ hour( 14 ) ] );
	} );

	it( 'shows the last hour until it ends', () => {
		const forecast = { hourly: [ hour( 12 ), hour( 13 ) ] };

		const rows = selectForecastItems(
			forecast,
			'hourly',
			5,
			at( '2026-07-01T13:59:00+05:30' )
		);

		expect( rows ).toEqual( [ hour( 13 ) ] );
	} );

	it( 'shows no rows once every item has ended, rather than past ones', () => {
		const forecast = {
			hourly: [ hour( 12 ), hour( 13 ) ],
			daily: [ day( 1 ), day( 2 ) ],
		};
		const now = at( '2026-07-03T00:00:00Z' );

		expect( selectForecastItems( forecast, 'hourly', 5, now ) ).toEqual(
			[]
		);
		expect( selectForecastItems( forecast, 'daily', 5, now ) ).toEqual(
			[]
		);
	} );

	it( 'returns null when the forecast has no such section, an empty list when the section is empty', () => {
		expect( selectForecastItems( null, 'daily', 7 ) ).toBeNull();
		expect( selectForecastItems( { current: {} }, 'daily', 7 ) ).toBeNull();
		expect( selectForecastItems( { daily: [] }, 'daily', 7 ) ).toEqual(
			[]
		);
	} );
} );

describe( 'getForecastItemEnd', () => {
	it( 'ends an item when the next one starts, else one hour or one day after its start', () => {
		const rows = [ hour( 12 ), hour( 13 ) ];

		expect( getForecastItemEnd( rows, 0, 'hourly' ) ).toBe(
			at( '2026-07-01T13:00:00+05:30' )
		);
		expect( getForecastItemEnd( rows, 1, 'hourly' ) ).toBe(
			at( '2026-07-01T14:00:00+05:30' )
		);
		expect( getForecastItemEnd( [ day( 1 ) ], 0, 'daily' ) ).toBe(
			at( '2026-07-02T00:00:00+02:00' )
		);
	} );

	it( 'returns NaN without an item or a readable timestamp', () => {
		expect( getForecastItemEnd( [], 0, 'daily' ) ).toBeNaN();
		expect(
			getForecastItemEnd( [ { timestamp: 'soon' } ], 0, 'daily' )
		).toBeNaN();
	} );
} );
