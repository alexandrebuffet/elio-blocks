/**
 * Setup of every test file: what the WordPress Jest preset used to provide.
 */

/**
 * External dependencies
 */
import { afterEach, beforeEach, vi } from 'vitest';

// Browser APIs of the admin that jsdom lacks, and WordPress packages expect.
globalThis.SCRIPT_DEBUG = true;
window.requestIdleCallback = ( callback ) => {
	const start = Date.now();
	return setTimeout(
		() =>
			callback( {
				didTimeout: false,
				timeRemaining: () => Math.max( 0, 50 - ( Date.now() - start ) ),
			} ),
		0
	);
};
window.cancelIdleCallback = ( handle ) => clearTimeout( handle );
window.matchMedia = () => ( {
	matches: false,
	addListener: () => {},
	addEventListener: () => {},
	removeListener: () => {},
	removeEventListener: () => {},
} );

/*
 * A test fails when it writes to the console: a React warning or an error
 * logged by the code is a bug the assertions may not see. A test expecting
 * output asserts it on the spy, then clears it with `mockClear()`.
 */ window.ResizeObserver ??= class ResizeObserver {
	observe() {}
	unobserve() {}
	disconnect() {}
};

const CONSOLE_METHODS = [ 'error', 'warn', 'info', 'log', 'debug' ];
const consoleSpies = {};

beforeEach( () => {
	for ( const method of CONSOLE_METHODS ) {
		consoleSpies[ method ] = vi
			.spyOn( console, method )
			.mockImplementation( () => {} );
	}
} );

afterEach( () => {
	const output = CONSOLE_METHODS.flatMap( ( method ) => {
		const calls = consoleSpies[ method ].mock.calls.map(
			( args ) => `console.${ method }: ${ args.join( ' ' ) }`
		);
		consoleSpies[ method ].mockRestore();
		return calls;
	} );

	if ( output.length ) {
		throw new Error(
			`Unexpected console output:\n${ output.join( '\n' ) }`
		);
	}
} );
