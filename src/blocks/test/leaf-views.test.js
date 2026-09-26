/**
 * External dependencies
 */
import { describe, expect, it, vi } from 'vitest';

/**
 * Internal dependencies
 */
import { getStore, setContext } from '../../test-utils/interactivity';
import '../cloud-cover/view';
import '../condition-description/view';
import '../daily-temperature/view';
import '../hourly-temperature/view';
import '../humidity/view';
import '../precipitation/view';
import '../precipitation-probability/view';
import '../pressure/view';
import '../temperature/view';
import '../uv-index/view';
import '../wind-direction/view';
import '../wind-speed/view';

vi.mock( '@wordpress/interactivity', async () => {
	const { mockInteractivity } =
		await import( '../../test-utils/interactivity' );
	return mockInteractivity;
} );

const NBSP = ' ';

const CURRENT = {
	temperature: 28.1,
	temperature_feels_like: 31,
	humidity: 64,
	pressure: 1013.2,
	wind_speed: 12,
	wind_gusts: 30.5,
	wind_direction: 225,
	cloud_cover: 40,
	precipitation: 0,
	precipitation_probability: 15,
	uv_index: 7.5,
	condition_description: 'Partly cloudy',
};

/**
 * Evaluates a getter of the store within a context, like a directive does.
 *
 * @param {string} getter  State getter.
 * @param {Object} context Context overrides.
 * @return {unknown} Value of the getter.
 */
function evaluate( getter, context = {} ) {
	setContext( {
		units: 'metric',
		unitSettings: {},
		item: CURRENT,
		query: { data: { current: CURRENT } },
		...context,
	} );

	return getStore( 'elio/weather-report' ).state[ getter ];
}

/**
 * Same cases as tests/Unit/Interactivity/DerivedStateTest.php: what the server
 * printed must not change when the scripts take over.
 */
describe( 'leaf block view scripts', () => {
	it( 'print the values of the item in context', () => {
		expect( evaluate( 'humidity' ) ).toBe( '64' );
		expect( evaluate( 'humidityUnit' ) ).toBe( '%' );
		expect( evaluate( 'cloudCover' ) ).toBe( '40' );
		expect( evaluate( 'cloudCoverUnit' ) ).toBe( '%' );
		expect( evaluate( 'precipitationProbability' ) ).toBe( '15' );
		expect( evaluate( 'precipitationProbabilityUnit' ) ).toBe( '%' );
		expect( evaluate( 'precipitation' ) ).toBe( '0' );
		expect( evaluate( 'pressure' ) ).toBe( '1013.2' );
		expect( evaluate( 'conditionDescription' ) ).toBe( 'Partly cloudy' );
		expect( evaluate( 'uvIndex' ) ).toBe( '7.5' );
		expect( evaluate( 'windSpeed' ) ).toBe( '12' );
		expect( evaluate( 'windSpeed', { displayType: 'gusts' } ) ).toBe(
			'30.5'
		);
		expect( evaluate( 'windDirection' ) ).toBe( 'SW' );
		expect( evaluate( 'windDirection', { format: 'degrees' } ) ).toBe(
			'225°'
		);
	} );

	it( 'print the temperature of the report, of a day, of an hour', () => {
		const daily = {
			item: { temperature_min: 11, temperature_max: 24.5 },
		};

		expect( String( evaluate( 'temperature' ) ) ).toBe( '28.1' );
		expect(
			String( evaluate( 'temperature', { displayType: 'feels-like' } ) )
		).toBe( '31' );
		expect( evaluate( 'formattedTemperature' ) ).toBe( '28.1°C' );
		expect( evaluate( 'dailyTemperature', daily ) ).toBe( '11' );
		expect(
			evaluate( 'dailyTemperature', { ...daily, displayType: 'max' } )
		).toBe( '24.5' );
		expect( evaluate( 'hourlyTemperature' ) ).toBe( '28.1' );
		expect(
			evaluate( 'hourlyTemperature', { displayType: 'feels-like' } )
		).toBe( '31' );
	} );

	it( 'label values with the unit they were converted to', () => {
		const imperial = { units: 'imperial' };
		const overrides = {
			units: 'imperial',
			unitSettings: {
				temperature: 'celsius',
				wind: 'ms',
				pressure: 'inhg',
				precipitation: 'mm',
			},
		};

		expect( evaluate( 'unit' ) ).toBe( '°C' );
		expect( evaluate( 'unit', imperial ) ).toBe( '°F' );
		expect( evaluate( 'unit', overrides ) ).toBe( '°C' );
		expect( evaluate( 'unit', { unitFormat: 'degree-symbol' } ) ).toBe(
			'°'
		);
		expect( evaluate( 'unit', { showUnit: false } ) ).toBe( '' );
		expect( evaluate( 'hourlyTemperatureUnit', imperial ) ).toBe( '°F' );
		expect(
			evaluate( 'dailyTemperatureUnit', {
				...overrides,
				item: { temperature_min: 11 },
			} )
		).toBe( '°C' );
		expect( evaluate( 'windSpeedUnit' ) ).toBe( `${ NBSP }km/h` );
		expect( evaluate( 'windSpeedUnit', imperial ) ).toBe( `${ NBSP }mph` );
		expect( evaluate( 'windSpeedUnit', overrides ) ).toBe( `${ NBSP }m/s` );
		expect( evaluate( 'pressureUnit' ) ).toBe( `${ NBSP }hPa` );
		expect( evaluate( 'pressureUnit', overrides ) ).toBe( `${ NBSP }inHg` );
		expect( evaluate( 'precipitationUnit', imperial ) ).toBe(
			`${ NBSP }in`
		);
		expect( evaluate( 'precipitationUnit', overrides ) ).toBe(
			`${ NBSP }mm`
		);
	} );

	it( 'print nothing, unit included, without data', () => {
		const empty = { item: null, query: { data: null } };

		[
			'humidity',
			'humidityUnit',
			'cloudCover',
			'cloudCoverUnit',
			'precipitation',
			'precipitationUnit',
			'precipitationProbability',
			'precipitationProbabilityUnit',
			'pressure',
			'pressureUnit',
			'windSpeed',
			'windSpeedUnit',
			'windDirection',
			'uvIndex',
			'conditionDescription',
			'dailyTemperature',
			'dailyTemperatureUnit',
			'hourlyTemperature',
			'hourlyTemperatureUnit',
			'unit',
			'formattedTemperature',
		].forEach( ( getter ) => {
			expect( [ getter, evaluate( getter, empty ) ] ).toEqual( [
				getter,
				'',
			] );
		} );
	} );
} );
