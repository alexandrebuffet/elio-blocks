/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { setTimeoutAt } from '../../shared/refresh';
import { getNextQuarterHour } from '../../shared/weather-dates';

/**
 * Returns the current time, brought up to date at each quarter hour: the time
 * a forecast list counts its rows from and the date blocks their "Now" and
 * "Today" labels (state.now on the front).
 *
 * Every hour and every day starts at a quarter hour, wherever the location
 * is: the blocks reading it agree on the hour and the day in progress
 * whenever each of them rendered, and move together as soon as it ends.
 *
 * @return {number} Milliseconds since the epoch.
 */
export function useNow() {
	const [ now, setNow ] = useState( Date.now );

	useEffect(
		() =>
			setTimeoutAt(
				() => setNow( Date.now() ),
				getNextQuarterHour( now )
			),
		[ now ]
	);

	return now;
}
