/**
 * External dependencies
 */
import { describe, expect, it, vi } from 'vitest';

/**
 * Internal dependencies
 */
import { getStore, setContext } from '../../../test-utils/interactivity';
import '../view';

vi.mock( '@wordpress/interactivity', async () => {
	const { mockInteractivity } =
		await import( '../../../test-utils/interactivity' );
	return mockInteractivity;
} );

const state = () => getStore( 'elio/weather-report' ).state;

describe( 'wind-speed view', () => {
	it( 'shows the server value untouched: the server already applied the wind unit override', () => {
		// 36 km/h, converted to 10 m/s by the REST API / SSR.
		setContext( {
			item: { wind_speed: 10 },
			units: 'metric',
			unitSettings: { wind: 'ms' },
		} );

		expect( state().windSpeed ).toBe( '10' );
		expect( state().windSpeedUnit ).toBe( ' m/s' );
	} );

	it( 'shows gusts when the block displays gusts', () => {
		setContext( {
			item: { wind_speed: 10, wind_gusts: 17.5 },
			displayType: 'gusts',
			units: 'metric',
			unitSettings: { wind: 'ms' },
		} );

		expect( state().windSpeed ).toBe( '17.5' );
	} );

	it( 'falls back to the unit system label when there is no override', () => {
		setContext( {
			item: { wind_speed: 22 },
			units: 'imperial',
			unitSettings: {},
		} );

		expect( state().windSpeed ).toBe( '22' );
		expect( state().windSpeedUnit ).toBe( ' mph' );
	} );

	it( 'shows nothing while there is no data', () => {
		setContext( { item: null } );

		expect( state().windSpeed ).toBe( '' );
		expect( state().windSpeedUnit ).toBe( '' );
	} );
} );
