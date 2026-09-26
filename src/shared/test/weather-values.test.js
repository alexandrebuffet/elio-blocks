/**
 * External dependencies
 */
import { describe, expect, it } from 'vitest';

/**
 * Internal dependencies
 */
import {
	toText,
	percentLabel,
	temperatureUnitLabel,
	windUnitLabel,
	pressureUnitLabel,
	precipitationUnitLabel,
	windDirectionText,
	getUvIndex,
	getWindSpeed,
	getDailyTemperature,
	getHourlyTemperature,
} from '../weather-values';

const NBSP = ' ';

/**
 * Same cases as tests/Unit/Interactivity/DerivedStateTest.php: the server
 * prints these values first, the browser and the editor must agree with it.
 */
describe( 'weather values', () => {
	it( 'prints a value as text, and nothing for a missing one', () => {
		expect( toText( 64 ) ).toBe( '64' );
		expect( toText( 0 ) ).toBe( '0' );
		expect( toText( 1013.2 ) ).toBe( '1013.2' );
		expect( toText( 'Partly cloudy' ) ).toBe( 'Partly cloudy' );
		expect( toText( null ) ).toBe( '' );
		expect( toText( undefined ) ).toBe( '' );
	} );

	it( 'has no unit without a value', () => {
		const labels = [
			percentLabel,
			temperatureUnitLabel,
			windUnitLabel,
			pressureUnitLabel,
			precipitationUnitLabel,
		];

		labels.forEach( ( label ) => {
			expect( label( null, {} ) ).toBe( '' );
			expect( label( undefined, {} ) ).toBe( '' );
		} );
		expect( percentLabel( 0 ) ).toBe( '%' );
	} );

	it.each( [
		[ 'metric preset', {}, '°C' ],
		[ 'imperial preset', { units: 'imperial' }, '°F' ],
		[
			'override wins over units',
			{ units: 'imperial', unitSettings: { temperature: 'celsius' } },
			'°C',
		],
		[ 'degree symbol only', { unitFormat: 'degree-symbol' }, '°' ],
		[ 'unit hidden', { showUnit: false }, '' ],
	] )( 'temperature unit: %s', ( name, context, expected ) => {
		expect( temperatureUnitLabel( 12, context ) ).toBe( expected );
	} );

	it.each( [
		[ 'metric preset', {}, 'km/h' ],
		[ 'imperial preset', { units: 'imperial' }, 'mph' ],
		[ 'm/s', { unitSettings: { wind: 'ms' } }, 'm/s' ],
		[ 'knots', { unitSettings: { wind: 'knots' } }, 'kt' ],
		[ 'beaufort', { unitSettings: { wind: 'beaufort' } }, 'Bft' ],
		[ 'empty override', { unitSettings: { wind: '' } }, 'km/h' ],
	] )( 'wind unit: %s', ( name, context, expected ) => {
		expect( windUnitLabel( 12, context ) ).toBe( NBSP + expected );
	} );

	it( 'labels pressure and precipitation with the unit they were converted to', () => {
		expect( pressureUnitLabel( 1013, {} ) ).toBe( `${ NBSP }hPa` );
		expect(
			pressureUnitLabel( 29.9, { unitSettings: { pressure: 'inhg' } } )
		).toBe( `${ NBSP }inHg` );
		expect(
			pressureUnitLabel( 1013, { unitSettings: { pressure: 'mbar' } } )
		).toBe( `${ NBSP }mbar` );
		expect( pressureUnitLabel( 1013, { units: 'imperial' } ) ).toBe(
			`${ NBSP }hPa`
		);
		expect( precipitationUnitLabel( 2, {} ) ).toBe( `${ NBSP }mm` );
		expect( precipitationUnitLabel( 2, { units: 'imperial' } ) ).toBe(
			`${ NBSP }in`
		);
		expect(
			precipitationUnitLabel( 2, {
				units: 'imperial',
				unitSettings: { precipitation: 'mm' },
			} )
		).toBe( `${ NBSP }mm` );
	} );

	it( 'gives the wind direction as a cardinal point or in degrees', () => {
		expect( windDirectionText( 225 ) ).toBe( 'SW' );
		expect( windDirectionText( 225, 'degrees' ) ).toBe( '225°' );
		expect( windDirectionText( 350 ) ).toBe( 'N' );
		expect( windDirectionText( 0 ) ).toBe( 'N' );
		expect( windDirectionText( null ) ).toBe( '' );
	} );

	it( 'reads the value a block shows from a weather item', () => {
		const daily = {
			temperature_min: 11,
			temperature_max: 24.5,
			temperature_feels_like_min: 9,
			temperature_feels_like_max: 26,
			uv_index_max: 9,
		};
		const hourly = {
			temperature: 28.1,
			temperature_feels_like: 31,
			wind_speed: 12,
			wind_gusts: 30.5,
			uv_index: 7.5,
		};

		expect( getDailyTemperature( daily ) ).toBe( 11 );
		expect( getDailyTemperature( daily, 'max' ) ).toBe( 24.5 );
		expect( getDailyTemperature( daily, 'feels-like-min' ) ).toBe( 9 );
		expect( getDailyTemperature( daily, 'feels-like-max' ) ).toBe( 26 );
		expect( getDailyTemperature( daily, 'unknown' ) ).toBe( 11 );
		expect( getHourlyTemperature( hourly ) ).toBe( 28.1 );
		expect( getHourlyTemperature( hourly, 'feels-like' ) ).toBe( 31 );
		expect( getWindSpeed( hourly ) ).toBe( 12 );
		expect( getWindSpeed( hourly, 'gusts' ) ).toBe( 30.5 );
		expect( getUvIndex( hourly ) ).toBe( 7.5 );
		expect( getUvIndex( daily ) ).toBe( 9 );
		expect( getUvIndex( null ) ).toBeNull();
		expect( getWindSpeed( undefined ) ).toBeNull();
	} );
} );
