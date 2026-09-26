/**
 * Test double for `@wordpress/interactivity`.
 *
 * Merges every `store()` call of a namespace like the real runtime does, and
 * lets a test set the context/server state the getters and actions will read.
 *
 * Usage:
 *   vi.mock( '@wordpress/interactivity', async () =>
 *       ( await import( '../../../test-utils/interactivity' ) ).mockInteractivity
 *   );
 */
const stores = {};
let context = {};
let serverState = {};
let element = { ref: null };

function mergeDescriptors( target, source ) {
	for ( const key of Object.keys( source ) ) {
		const descriptor = Object.getOwnPropertyDescriptor( source, key );
		const isPlainObject =
			descriptor.value &&
			typeof descriptor.value === 'object' &&
			! Array.isArray( descriptor.value );

		if ( isPlainObject ) {
			target[ key ] = target[ key ] || {};
			mergeDescriptors( target[ key ], descriptor.value );
		} else {
			Object.defineProperty( target, key, {
				...descriptor,
				configurable: true,
			} );
		}
	}
	return target;
}

export const mockInteractivity = {
	store( namespace, definition = {} ) {
		stores[ namespace ] = mergeDescriptors(
			stores[ namespace ] || {},
			definition
		);
		return stores[ namespace ];
	},
	getContext: () => context,
	getServerState: () => serverState,
	getElement: () => element,
};

/**
 * Runs a generator action to completion, resolving yielded promises like the runtime.
 *
 * @param {Object} generator Generator returned by the action.
 * @return {Promise<unknown>} Return value of the action.
 */
export async function runAction( generator ) {
	let step = generator.next();
	while ( ! step.done ) {
		try {
			// An action may yield another action (a generator), like the runtime allows.
			const yielded =
				typeof step.value?.next === 'function'
					? runAction( step.value )
					: step.value;
			step = generator.next( await yielded );
		} catch ( error ) {
			step = generator.throw( error );
		}
	}
	return step.value;
}

export const getStore = ( namespace ) => stores[ namespace ];

export const setContext = ( value ) => {
	context = value;
};

export const setServerState = ( value ) => {
	serverState = value;
};

export const setElement = ( value ) => {
	element = value;
};
