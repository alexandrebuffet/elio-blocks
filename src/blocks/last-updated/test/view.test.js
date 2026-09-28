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

/** 05:32 UTC: 14:32 in Tokyo. */
const FETCHED_AT = '2026-07-01T05:32:10+00:00';

function makeContext( { meta = {}, ...overrides } = {} ) {
	return {
		format: 'H:i',
		query: {
			data: {
				meta: {
					timezone: 'Asia/Tokyo',
					fetched_at: FETCHED_AT,
					...meta,
				},
			},
		},
		...overrides,
	};
}

describe( 'last-updated view', () => {
	it( 'shows when the provider was asked, in the timezone of the location', () => {
		setContext( makeContext() );

		expect( state().formattedLastUpdated ).toBe( '14:32' );
		expect( state().lastUpdatedDatetime ).toBe( FETCHED_AT );
	} );

	it( 'follows the weather forecast each refresh brings', () => {
		const context = makeContext();
		setContext( context );
		context.query.data = {
			meta: {
				timezone: 'Asia/Tokyo',
				fetched_at: '2026-07-01T06:02:40+00:00',
			},
		};

		expect( state().formattedLastUpdated ).toBe( '15:02' );
		expect( state().lastUpdatedDatetime ).toBe(
			'2026-07-01T06:02:40+00:00'
		);
	} );

	it( 'uses the time format and the meridiem of the site without a format of its own', () => {
		setContext( makeContext( { format: '' } ) );

		expect( state().formattedLastUpdated ).toBe( '2:32 soir' );
	} );

	it( 'names the timezone of the location like the server, from the weather forecast', () => {
		setContext(
			makeContext( {
				format: 'H:i T',
				meta: {
					timezone_abbreviations: [
						{ from: 1782831600, abbr: 'JST' },
					],
				},
			} )
		);

		expect( state().formattedLastUpdated ).toBe( '14:32 JST' );
	} );

	it( 'prints nothing without data', () => {
		setContext( makeContext( { query: { data: null } } ) );

		expect( state().formattedLastUpdated ).toBe( '' );
		expect( state().lastUpdatedDatetime ).toBe( '' );
	} );
} );
