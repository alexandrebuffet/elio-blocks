/**
 * WordPress dependencies
 */
import { useSyncExternalStore } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { setTimeoutAt } from '../../shared/refresh';
import { getNextQuarterHour } from '../../shared/weather-dates';

/**
 * The one clock of the editor, as state.now is the one of a page: the time,
 * the blocks reading it, and the timer bringing it up to date.
 */
const clock = { now: Date.now(), listeners: new Set(), cancel: () => {} };

/**
 * Brings the clock up to date, tells every block, and waits for the next
 * quarter hour.
 */
function tick() {
	clock.cancel();
	clock.now = Date.now();
	clock.cancel = setTimeoutAt( tick, getNextQuarterHour( clock.now ) );
	clock.listeners.forEach( ( listener ) => listener() );
}

/**
 * Lets a block read the clock, up to date: no block may have read it for a
 * while.
 *
 * @param {() => void} listener Called when the time changes.
 * @return {() => void} Stops it.
 */
function subscribe( listener ) {
	clock.listeners.add( listener );

	if (
		clock.listeners.size === 1 ||
		getNextQuarterHour( clock.now ) !== getNextQuarterHour( Date.now() )
	) {
		tick();
	}

	return () => {
		clock.listeners.delete( listener );

		if ( clock.listeners.size === 0 ) {
			clock.cancel();
		}
	};
}

const getNow = () => clock.now;

/**
 * Returns the current time, brought up to date at each quarter hour: the time
 * a forecast list counts its rows from and the date blocks their "Now" and
 * "Today" labels (state.now on the front).
 *
 * Every hour and every day starts at a quarter hour, wherever the location
 * is, and every block reads the same clock: a list and the labels of its rows
 * always agree on the hour and the day in progress, and move together, after
 * a sleep of the computer too (setTimeoutAt()).
 *
 * @return {number} Milliseconds since the epoch.
 */
export function useNow() {
	return useSyncExternalStore( subscribe, getNow );
}
