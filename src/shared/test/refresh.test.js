/**
 * External dependencies
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Internal dependencies
 */
import {
	getRefreshTime,
	getRequestTimeoutSignal,
	setTimeoutAt,
	whenVisible,
} from '../refresh';

const MINUTE = 60000;
const at = ( iso ) => Date.parse( iso );

describe( 'setTimeoutAt', () => {
	beforeEach( () => {
		vi.useFakeTimers().setSystemTime(
			new Date( '2026-10-05T21:10:00+02:00' )
		);
	} );

	afterEach( () => {
		vi.useRealTimers();
	} );

	it( 'calls back once the clock reaches the time', () => {
		const callback = vi.fn();
		setTimeoutAt( callback, at( '2026-10-05T21:40:00+02:00' ) );

		vi.advanceTimersByTime( 30 * MINUTE - 1 );
		expect( callback ).not.toHaveBeenCalled();

		vi.advanceTimersByTime( 1 );
		expect( callback ).toHaveBeenCalledTimes( 1 );
		expect( vi.getTimerCount() ).toBe( 0 );
	} );

	it( 'calls back within a minute of the computer waking up, however long it slept', () => {
		const callback = vi.fn();
		setTimeoutAt( callback, at( '2026-10-05T21:40:00+02:00' ) );

		// Asleep all night: the clock moves on, the timers do not.
		vi.setSystemTime( new Date( '2026-10-06T08:30:00+02:00' ) );
		vi.advanceTimersByTime( MINUTE );

		expect( callback ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'can be cancelled', () => {
		const callback = vi.fn();
		const cancel = setTimeoutAt(
			callback,
			at( '2026-10-05T21:40:00+02:00' )
		);

		vi.advanceTimersByTime( 10 * MINUTE );
		cancel();
		vi.advanceTimersByTime( 30 * MINUTE );

		expect( callback ).not.toHaveBeenCalled();
		expect( vi.getTimerCount() ).toBe( 0 );
	} );
} );

describe( 'whenVisible', () => {
	afterEach( () => {
		vi.restoreAllMocks();
	} );

	it( 'calls back at once on a page that is shown', () => {
		const callback = vi.fn();

		whenVisible( callback );

		expect( callback ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'waits for a hidden page to be shown again, and calls back once', () => {
		const hidden = vi
			.spyOn( document, 'hidden', 'get' )
			.mockReturnValue( true );
		const callback = vi.fn();

		whenVisible( callback );
		document.dispatchEvent( new Event( 'visibilitychange' ) );
		expect( callback ).not.toHaveBeenCalled();

		hidden.mockReturnValue( false );
		document.dispatchEvent( new Event( 'visibilitychange' ) );
		document.dispatchEvent( new Event( 'visibilitychange' ) );
		expect( callback ).toHaveBeenCalledTimes( 1 );
	} );
} );

describe( 'getRequestTimeoutSignal', () => {
	afterEach( () => {
		vi.restoreAllMocks();
	} );

	it( 'gives up a request after 30 seconds', () => {
		const timeout = vi.spyOn( AbortSignal, 'timeout' );

		expect( getRequestTimeoutSignal() ).toBeInstanceOf( AbortSignal );
		expect( timeout ).toHaveBeenCalledWith( 30000 );
	} );

	it( 'gives no signal where the browser has no AbortSignal.timeout(), rather than failing', () => {
		const { timeout } = AbortSignal;
		AbortSignal.timeout = undefined;

		try {
			expect( getRequestTimeoutSignal() ).toBeUndefined();
		} finally {
			AbortSignal.timeout = timeout;
		}
	} );
} );

describe( 'getRefreshTime', () => {
	beforeEach( () => {
		vi.useFakeTimers().setSystemTime( new Date( '2026-10-05T21:10:00Z' ) );
		vi.spyOn( Math, 'random' ).mockReturnValue( 0 );
	} );

	afterEach( () => {
		vi.restoreAllMocks();
		vi.useRealTimers();
	} );

	const weatherForecast = {
		meta: { fetched_at: '2026-10-05T21:00:00+00:00' },
	};

	it( 'is when the server copy expires, a few seconds past it', () => {
		expect(
			getRefreshTime( weatherForecast, Date.now(), {
				dataTtl: 30 * MINUTE,
				refreshInterval: 15 * MINUTE,
			} )
		).toBe( at( '2026-10-05T21:30:05Z' ) );
	} );

	it( 'is the interval of the site after the last request without a copy ahead', () => {
		const requestedAt = at( '2026-10-05T21:05:00Z' );

		expect(
			getRefreshTime( weatherForecast, requestedAt, {
				dataTtl: 0,
				refreshInterval: 15 * MINUTE,
			} )
		).toBe( at( '2026-10-05T21:20:00Z' ) );
		expect(
			getRefreshTime( null, requestedAt, {
				dataTtl: 30 * MINUTE,
				refreshInterval: 15 * MINUTE,
			} )
		).toBe( at( '2026-10-05T21:20:00Z' ) );
	} );

	it( 'is null with auto-refresh off, or without the settings', () => {
		expect(
			getRefreshTime( weatherForecast, Date.now(), {
				dataTtl: 30 * MINUTE,
				refreshInterval: 0,
			} )
		).toBeNull();
		expect( getRefreshTime( weatherForecast, Date.now() ) ).toBeNull();
	} );
} );
