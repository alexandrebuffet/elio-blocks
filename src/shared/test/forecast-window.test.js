/**
 * External dependencies
 */
import { describe, expect, it } from 'vitest';

/**
 * Internal dependencies
 */
import { selectForecastItems } from '../forecast-window';

const at = ( iso ) => new Date( iso ).getTime();
const hour = ( h ) => ( { timestamp: `2026-07-01T${ h }:00:00+05:30` } );
const day = ( d ) => ( { timestamp: `2026-07-0${ d }T00:00:00+02:00` } );

/**
 * Same cases as tests/Unit/Interactivity/ForecastWindowTest.php: the server
 * renders the rows, the browser and the editor must pick the same ones.
 */
describe( 'selectForecastItems', () => {
	it( 'takes the first days of the forecast', () => {
		const forecast = { daily: [ day( 1 ), day( 2 ), day( 3 ) ] };

		expect( selectForecastItems( forecast, 'daily', 2 ) ).toEqual( [
			day( 1 ),
			day( 2 ),
		] );
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

	it( 'shows a forecast entirely in the past from its start', () => {
		const forecast = { hourly: [ hour( 12 ), hour( 13 ) ] };

		const rows = selectForecastItems(
			forecast,
			'hourly',
			5,
			at( '2026-07-03T00:00:00Z' )
		);

		expect( rows ).toEqual( [ hour( 12 ), hour( 13 ) ] );
	} );

	it( 'returns null when the forecast has no such section, an empty list when the section is empty', () => {
		expect( selectForecastItems( null, 'daily', 7 ) ).toBeNull();
		expect( selectForecastItems( { current: {} }, 'daily', 7 ) ).toBeNull();
		expect( selectForecastItems( { daily: [] }, 'daily', 7 ) ).toEqual(
			[]
		);
	} );
} );
