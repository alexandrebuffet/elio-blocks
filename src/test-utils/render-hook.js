/**
 * External dependencies
 */
import { act } from 'react';
import { vi } from 'vitest';
import { createRoot } from 'react-dom/client';

/**
 * WordPress dependencies
 */
import { RegistryProvider } from '@wordpress/data';

global.IS_REACT_ACT_ENVIRONMENT = true;

/**
 * Renders a hook inside a `@wordpress/data` registry and exposes its last return value.
 *
 * @param {Object}                     registry Registry the hook selects from.
 * @param {(props: Object) => unknown} useHook  Calls the hook under test with the given props.
 * @param {Object}                     props    Initial props.
 * @return {{ result: { current: unknown }, rerender: (props: Object) => void, unmount: () => void }} Handles.
 */
export function renderHook( registry, useHook, props = {} ) {
	const result = { current: undefined };
	const root = createRoot( document.createElement( 'div' ) );

	function Probe( probeProps ) {
		result.current = useHook( probeProps );
		return null;
	}

	const render = ( nextProps ) =>
		act( () => {
			root.render(
				<RegistryProvider value={ registry }>
					<Probe { ...nextProps } />
				</RegistryProvider>
			);
		} );

	render( props );

	return {
		result,
		rerender: render,
		unmount: () => act( () => root.unmount() ),
	};
}

/**
 * Renders an element inside a `@wordpress/data` registry.
 *
 * @param {Object}  registry Registry components select from.
 * @param {Element} element  Element to render.
 * @return {{ container: HTMLElement, rerender: (element: Element) => void, unmount: () => void }} Handles.
 */
export function renderWithRegistry( registry, element ) {
	const container = document.createElement( 'div' );
	const root = createRoot( container );
	const render = ( nextElement ) =>
		act( () => {
			root.render(
				<RegistryProvider value={ registry }>
					{ nextElement }
				</RegistryProvider>
			);
		} );

	render( element );

	return {
		container,
		rerender: render,
		unmount: () => act( () => root.unmount() ),
	};
}

/**
 * Lets pending timers (debounce, resolver start) and promises settle.
 *
 * @param {number} ms Time to advance, with Vitest fake timers.
 */
export async function advance( ms ) {
	await act( async () => {
		await vi.advanceTimersByTimeAsync( ms );
	} );
	// React renders when act() returns: a render caused by a timer (a debounced
	// value) selects from the store, whose resolver starts on the next tick.
	await act( async () => {
		await vi.advanceTimersByTimeAsync( 1 );
	} );
}
