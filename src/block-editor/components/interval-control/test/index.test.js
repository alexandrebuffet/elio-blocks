/**
 * External dependencies
 */
import { act } from 'react';
import { describe, expect, it, vi } from 'vitest';

/**
 * WordPress dependencies
 */
import { createRegistry } from '@wordpress/data';

/**
 * Internal dependencies
 */
import IntervalControl, { CACHE_DURATION_PRESETS } from '..';
import { renderWithRegistry } from '../../../../test-utils/render-hook';

function renderControl( props ) {
	return renderWithRegistry(
		createRegistry(),
		<IntervalControl
			label="Cache Duration"
			presets={ CACHE_DURATION_PRESETS }
			onChange={ () => {} }
			{ ...props }
		/>
	).container;
}

const findReset = ( container ) =>
	[ ...container.querySelectorAll( 'button' ) ].find(
		( button ) => button.textContent === 'Reset'
	);

describe( 'IntervalControl', () => {
	it( 'hides Reset while the value is the reset value', () => {
		expect(
			findReset( renderControl( { value: 1800, resetValue: 1800 } ) )
		).toBeUndefined();
	} );

	it( 'resets a changed value to the reset value', () => {
		const onChange = vi.fn();
		const reset = findReset(
			renderControl( { value: 3600, resetValue: 1800, onChange } )
		);

		act( () => reset.click() );

		expect( onChange ).toHaveBeenCalledWith( 1800 );
	} );

	it( 'hides Reset while unset, without a reset value', () => {
		expect( findReset( renderControl( {} ) ) ).toBeUndefined();
		expect( findReset( renderControl( { value: 900 } ) ) ).toBeDefined();
	} );
} );
