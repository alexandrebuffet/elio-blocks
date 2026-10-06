/**
 * External dependencies
 */
import { describe, expect, it } from 'vitest';

/**
 * Internal dependencies
 */
import {
	formatDuration,
	getAutoRefreshHelp,
	isRefreshIntervalUsed,
} from '../auto-refresh';
import { AUTO_REFRESH_INTERVAL_PRESETS } from '../settings-interval-presets';

const settings = ( overrides = {} ) => ( {
	elio_blocks_auto_refresh_enabled: true,
	elio_blocks_refresh_interval: 900,
	elio_blocks_cache_enabled: true,
	elio_blocks_cache_time: 1800,
	...overrides,
} );

describe( 'getAutoRefreshHelp', () => {
	it( 'tells the pace set by the cache duration, when the server copy expires', () => {
		expect( getAutoRefreshHelp( settings() ) ).toBe(
			'Update the data shown on the site and in the editor, without reloading the page, every 30m: when the server cache expires (Cache Duration, in the Advanced section).'
		);
	} );

	it( 'follows a custom cache duration', () => {
		expect(
			getAutoRefreshHelp( settings( { elio_blocks_cache_time: 5400 } ) )
		).toContain( 'every 1h 30m:' );
	} );

	it( 'points at the interval when the cache is off', () => {
		expect(
			getAutoRefreshHelp(
				settings( { elio_blocks_cache_enabled: false } )
			)
		).toBe(
			'Update the data shown on the site and in the editor, without reloading the page, at the interval below.'
		);
	} );
} );

describe( 'isRefreshIntervalUsed', () => {
	it( 'is not used while the cache sets the pace', () => {
		expect( isRefreshIntervalUsed( settings() ) ).toBe( false );
	} );

	it( 'sets the pace when the cache is off', () => {
		expect(
			isRefreshIntervalUsed(
				settings( { elio_blocks_cache_enabled: false } )
			)
		).toBe( true );
	} );

	it( 'is not used when auto-refresh is off', () => {
		expect(
			isRefreshIntervalUsed(
				settings( {
					elio_blocks_cache_enabled: false,
					elio_blocks_auto_refresh_enabled: false,
				} )
			)
		).toBe( false );
	} );
} );

describe( 'formatDuration', () => {
	it.each( [
		[ 60, '1m' ],
		[ 1800, '30m' ],
		[ 5400, '1h 30m' ],
		[ 86400, '1d' ],
		[ 45, '45s' ],
	] )( 'writes %i seconds as %s', ( seconds, label ) => {
		expect( formatDuration( seconds ) ).toBe( label );
	} );
} );

describe( 'auto-refresh interval presets', () => {
	it( 'offer no 0: the toggle turns auto-refresh off, and 0 is read as the 15-minute default', () => {
		expect(
			AUTO_REFRESH_INTERVAL_PRESETS.map( ( { value } ) => value )
		).not.toContain( 0 );
	} );
} );
