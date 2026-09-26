/**
 * External dependencies
 */
import { existsSync, readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';

const BLOCKS = join( __dirname, '..' );

const REPORT_CONTEXT = [
	'elio/reportLocation',
	'elio/reportProvider',
	'elio/reportUnits',
];

/**
 * Blocks whose edit shows the weather forecast of the report:
 * useWeatherReport() finds it with the query the report provides as block
 * context.
 */
const showsWeatherForecast = readdirSync( BLOCKS ).filter( ( slug ) => {
	const edit = join( BLOCKS, slug, 'edit.js' );

	return (
		existsSync( edit ) &&
		/\b(WeatherValueEdit|useWeatherReport)\b/.test(
			readFileSync( edit, 'utf8' )
		)
	);
} );

describe( 'blocks showing the weather forecast of the report', () => {
	it( 'are found', () => {
		expect( showsWeatherForecast ).toEqual(
			expect.arrayContaining( [
				'condition-icon',
				'datetime',
				'forecast-template',
				'humidity',
			] )
		);
	} );

	// Without them the block gets no weather forecast: the editor passes a
	// block only the context it uses.
	it.each( showsWeatherForecast )(
		'%s uses the query of the report as block context',
		( slug ) => {
			const { usesContext = [] } = JSON.parse(
				readFileSync( join( BLOCKS, slug, 'block.json' ), 'utf8' )
			);

			expect( usesContext ).toEqual(
				expect.arrayContaining( REPORT_CONTEXT )
			);
		}
	);
} );
