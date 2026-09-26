/**
 * External dependencies
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

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

beforeEach( () => {
	setServerState( {
		dateSettings: {
			formats: { time: 'g:i a' },
			l10n: { meridiem: { am: 'mat.', pm: 'soir' } },
			timezone: { string: 'UTC' },
		},
	} );
} );

const state = () => getStore( 'elio/weather-report' ).state;

const CURRENT = {
	sunrise: '2026-07-01T04:29:00+09:00',
	sunset: '2026-07-01T19:01:00+09:00',
};

function makeContext( overrides = {} ) {
	return {
		displayType: 'sunrise',
		format: 'H:i',
		item: CURRENT,
		query: {
			data: { meta: { timezone: 'Asia/Tokyo' }, current: CURRENT },
		},
		...overrides,
	};
}

describe( 'sun-event view', () => {
	it( 'formats sunrise and sunset in the timezone of the location', () => {
		setContext( makeContext() );
		expect( state().formattedSunEvent ).toBe( '04:29' );

		setContext( makeContext( { displayType: 'sunset' } ) );
		expect( state().formattedSunEvent ).toBe( '19:01' );
		expect( state().sunEventDatetime ).toBe( '2026-07-01T19:01:00+09:00' );
	} );

	it( 'shows the sun event of the day for an hourly item, which has none', () => {
		setContext( makeContext( { item: { temperature: 21 } } ) );

		expect( state().formattedSunEvent ).toBe( '04:29' );
		expect( state().sunEventDatetime ).toBe( '2026-07-01T04:29:00+09:00' );
	} );

	it( 'uses the time format and the meridiem of the site without a format of its own', () => {
		setContext( makeContext( { displayType: 'sunset', format: '' } ) );

		expect( state().formattedSunEvent ).toBe( '7:01 soir' );
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
						current: CURRENT,
					},
				},
			} )
		);

		expect( state().formattedSunEvent ).toBe( '04:29 JST' );
	} );

	it( 'prints nothing without data', () => {
		setContext( makeContext( { item: null, query: { data: null } } ) );

		expect( state().formattedSunEvent ).toBe( '' );
		expect( state().sunEventDatetime ).toBe( '' );
	} );
} );
