/**
 * External dependencies
 */
import { act } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * WordPress dependencies
 */
import { createRegistry } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { useNow } from '../use-now';
import { renderHook } from '../../../test-utils/render-hook';

const MINUTE = 60000;

describe( 'useNow', () => {
	beforeEach( () => {
		vi.useFakeTimers().setSystemTime( new Date( '2026-09-21T14:50:00Z' ) );
	} );

	afterEach( () => {
		vi.useRealTimers();
	} );

	it( 'returns the time it was first rendered at until the next quarter hour, then that time', () => {
		const { result, unmount } = renderHook( createRegistry(), useNow );

		act( () => vi.advanceTimersByTime( 10 * MINUTE - 1 ) );
		expect( result.current ).toBe( Date.parse( '2026-09-21T14:50:00Z' ) );

		act( () => vi.advanceTimersByTime( 1 ) );
		expect( result.current ).toBe( Date.parse( '2026-09-21T15:00:00Z' ) );

		act( () => vi.advanceTimersByTime( 15 * MINUTE ) );
		expect( result.current ).toBe( Date.parse( '2026-09-21T15:15:00Z' ) );

		unmount();
		expect( vi.getTimerCount() ).toBe( 0 );
	} );

	it( 'catches up within a minute of the computer waking up, however long it slept', () => {
		const { result, unmount } = renderHook( createRegistry(), useNow );

		// Asleep all night: the clock moves on, the timers do not.
		act( () => vi.setSystemTime( new Date( '2026-09-22T08:30:00Z' ) ) );
		act( () => vi.advanceTimersByTime( MINUTE ) );

		expect( result.current ).toBe( Date.parse( '2026-09-22T08:31:00Z' ) );
		unmount();
	} );

	it( 'moves a block rendered later in the same quarter hour at the same time', () => {
		const first = renderHook( createRegistry(), useNow );
		act( () => vi.advanceTimersByTime( 4 * MINUTE ) );
		const second = renderHook( createRegistry(), useNow );

		act( () => vi.advanceTimersByTime( 6 * MINUTE ) );

		expect( first.result.current ).toBe(
			Date.parse( '2026-09-21T15:00:00Z' )
		);
		expect( second.result.current ).toBe( first.result.current );
		first.unmount();
		second.unmount();
	} );
} );
