/**
 * External dependencies
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * WordPress dependencies
 */
import { createRegistry } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { useWeatherReport } from '../../block-editor/hooks';
import { renderWithRegistry } from '../../test-utils/render-hook';
import HumidityEdit from '../humidity/edit';
import CloudCoverEdit from '../cloud-cover/edit';
import PrecipitationProbabilityEdit from '../precipitation-probability/edit';
import PrecipitationEdit from '../precipitation/edit';
import PressureEdit from '../pressure/edit';
import WindSpeedEdit from '../wind-speed/edit';
import WindDirectionEdit from '../wind-direction/edit';
import UvIndexEdit from '../uv-index/edit';
import ConditionDescriptionEdit from '../condition-description/edit';
import TemperatureEdit from '../temperature/edit';
import DailyTemperatureEdit from '../daily-temperature/edit';
import HourlyTemperatureEdit from '../hourly-temperature/edit';
import DatetimeEdit from '../datetime/edit';
import SunEventEdit from '../sun-event/edit';
import LastUpdatedEdit from '../last-updated/edit';

vi.mock( '@wordpress/block-editor', () => ( {
	useBlockProps: ( props ) => props ?? {},
	InspectorControls: () => null,
	RichText: ( { value, className } ) => (
		<span className={ className }>{ value }</span>
	),
} ) );
vi.mock( '@wordpress/components', () => ( {
	__experimentalToolsPanel: () => null,
	__experimentalToolsPanelItem: () => null,
	ToggleControl: () => null,
} ) );
vi.mock( '../../block-editor/hooks', () => ( {
	useNow: () => Date.now(),
	useWeatherReport: vi.fn(),
} ) );
vi.mock( '../temperature/inspector', () => ( { default: () => null } ) );
vi.mock( '../daily-temperature/inspector', () => ( { default: () => null } ) );
vi.mock( '../hourly-temperature/inspector', () => ( { default: () => null } ) );
vi.mock( '../wind-direction/inspector', () => ( { default: () => null } ) );
vi.mock( '../datetime/inspector', () => ( { default: () => null } ) );
vi.mock( '../sun-event/inspector', () => ( { default: () => null } ) );
vi.mock( '../last-updated/inspector', () => ( { default: () => null } ) );

const NBSP = ' ';

const CURRENT = {
	temperature: 28.1,
	temperature_feels_like: 31,
	humidity: 64,
	pressure: 29.92,
	wind_speed: 3.3,
	wind_gusts: 8.5,
	wind_direction: 225,
	cloud_cover: 40,
	precipitation: 0,
	precipitation_probability: 15,
	uv_index: 7.5,
	condition_description: 'Partly cloudy',
};

const DAY = {
	temperature_min: 11,
	temperature_max: 24.5,
	humidity: 80,
	uv_index_max: 9,
	wind_speed: 5,
	condition_description: 'Overcast',
};

/** An imperial site that overrides every domain: no label can come from the preset. */
const WEATHER_FORECAST = {
	meta: {
		units: 'imperial',
		unit_settings: {
			temperature: 'celsius',
			wind: 'ms',
			pressure: 'inhg',
			precipitation: 'mm',
		},
	},
	current: CURRENT,
};

/** Edit component of each block, by slug. */
const EDITS = {
	humidity: HumidityEdit,
	'cloud-cover': CloudCoverEdit,
	'precipitation-probability': PrecipitationProbabilityEdit,
	precipitation: PrecipitationEdit,
	pressure: PressureEdit,
	'wind-speed': WindSpeedEdit,
	'wind-direction': WindDirectionEdit,
	'uv-index': UvIndexEdit,
	'condition-description': ConditionDescriptionEdit,
	temperature: TemperatureEdit,
	'daily-temperature': DailyTemperatureEdit,
	'hourly-temperature': HourlyTemperatureEdit,
	datetime: DatetimeEdit,
	'sun-event': SunEventEdit,
	'last-updated': LastUpdatedEdit,
};

/**
 * Renders an edit component and returns its paragraph.
 *
 * @param {(props: Object) => Element} Edit               Edit component.
 * @param {Object}                     [props]            Attributes and context.
 * @param {Object}                     [props.attributes] Block attributes.
 * @param {Object}                     [props.context]    Block context.
 * @return {HTMLElement} Paragraph the edit component renders.
 */
function render( Edit, { attributes = {}, context = {} } = {} ) {
	const { container } = renderWithRegistry(
		createRegistry(),
		<Edit
			clientId="block"
			attributes={ attributes }
			context={ context }
			setAttributes={ () => {} }
			isSelected={ false }
		/>
	);

	return container.querySelector( 'p' );
}

/**
 * Returns the text of a block as the editor shows it.
 *
 * @param {(props: Object) => Element} Edit    Edit component.
 * @param {Object}                     [props] Attributes and context, as render() takes them.
 * @return {string} Text of the block as the editor shows it: prefix, value, unit and what separates them.
 */
function shown( Edit, props ) {
	return render( Edit, props ).textContent;
}

describe( 'leaf blocks in the editor', () => {
	beforeEach( () => {
		useWeatherReport.mockReturnValue( {
			data: WEATHER_FORECAST,
			item: CURRENT,
			isLoading: false,
			error: null,
		} );
	} );

	it.each( [
		[ 'humidity', HumidityEdit, {}, '64%' ],
		[ 'cloud cover', CloudCoverEdit, {}, '40%' ],
		[
			'precipitation probability',
			PrecipitationProbabilityEdit,
			{},
			'15%',
		],
		[ 'precipitation', PrecipitationEdit, {}, `0${ NBSP }mm` ],
		[ 'pressure', PressureEdit, {}, `29.92${ NBSP }inHg` ],
		[ 'wind speed', WindSpeedEdit, {}, `3.3${ NBSP }m/s` ],
		[
			'wind gusts',
			WindSpeedEdit,
			{ displayType: 'gusts' },
			`8.5${ NBSP }m/s`,
		],
		[ 'wind direction', WindDirectionEdit, {}, 'SW' ],
		[
			'wind direction in degrees',
			WindDirectionEdit,
			{ displayFormat: 'degrees' },
			'225°',
		],
		[ 'uv index', UvIndexEdit, {}, '7.5' ],
		[ 'condition', ConditionDescriptionEdit, {}, 'Partly cloudy' ],
		[ 'temperature', TemperatureEdit, {}, '28.1°C' ],
		[
			'temperature it feels like',
			TemperatureEdit,
			{ displayType: 'feels-like' },
			'31°C',
		],
		[
			'temperature with a bare degree',
			TemperatureEdit,
			{ unitFormat: 'degree-symbol' },
			'28.1°',
		],
		[
			'temperature without unit',
			TemperatureEdit,
			{ showUnit: false },
			'28.1',
		],
		[ 'hourly temperature', HourlyTemperatureEdit, {}, '28.1°C' ],
	] )(
		'%s shows the current conditions in the units of the site',
		( name, Edit, attributes, expected ) => {
			expect( shown( Edit, { attributes } ) ).toBe( expected );
		}
	);

	it.each( [
		[ 'humidity', HumidityEdit, {}, '80%' ],
		[ 'uv index', UvIndexEdit, {}, '9' ],
		[ 'wind speed', WindSpeedEdit, {}, `5${ NBSP }m/s` ],
		[ 'condition', ConditionDescriptionEdit, {}, 'Overcast' ],
		[ 'daily minimum', DailyTemperatureEdit, {}, '11°C' ],
		[
			'daily maximum',
			DailyTemperatureEdit,
			{ displayType: 'max' },
			'24.5°C',
		],
	] )(
		'%s shows its row inside a forecast list',
		( name, Edit, attributes, expected ) => {
			const context = { 'elio/forecastItem': DAY };

			expect( shown( Edit, { attributes, context } ) ).toBe( expected );
		}
	);

	it( 'gives the daily temperatures of today out of a row, as in their preview', () => {
		useWeatherReport.mockReturnValue( {
			data: { ...WEATHER_FORECAST, daily: [ DAY ] },
			item: CURRENT,
		} );

		expect( shown( DailyTemperatureEdit ) ).toBe( '11°C' );
		expect(
			shown( DailyTemperatureEdit, {
				attributes: { displayType: 'max' },
			} )
		).toBe( '24.5°C' );
	} );

	it( 'follows the unit system of the site when nothing overrides it', () => {
		useWeatherReport.mockReturnValue( {
			data: { meta: { units: 'imperial' }, current: CURRENT },
			item: CURRENT,
		} );

		expect( shown( TemperatureEdit ) ).toBe( '28.1°F' );
		expect( shown( HourlyTemperatureEdit ) ).toBe( '28.1°F' );
		expect( shown( WindSpeedEdit ) ).toBe( `3.3${ NBSP }mph` );
		expect( shown( PrecipitationEdit ) ).toBe( `0${ NBSP }in` );
	} );

	it( 'shows a dash, and no unit, where a value is expected but not there yet', () => {
		useWeatherReport.mockReturnValue( { data: null, item: null } );

		expect( shown( TemperatureEdit ) ).toBe( '—' );
		expect( shown( DailyTemperatureEdit ) ).toBe( '—' );
		expect( shown( HourlyTemperatureEdit ) ).toBe( '—' );
		expect( shown( ConditionDescriptionEdit ) ).toBe( '—' );
		expect( shown( HumidityEdit ) ).toBe( '' );
		expect( shown( PressureEdit ) ).toBe( '' );
	} );

	// The unit label carries its own separator: a non-breaking space before a
	// word, nothing before ° and %.
	it( 'separates the prefix from the value with a space, like the front', () => {
		const prefixed = ( prefix ) => ( {
			attributes: { showPrefix: true, prefix },
		} );

		expect( shown( TemperatureEdit, prefixed( 'Now' ) ) ).toBe(
			'Now 28.1°C'
		);
		expect( shown( PressureEdit, prefixed( 'Pressure' ) ) ).toBe(
			`Pressure 29.92${ NBSP }inHg`
		);
	} );

	// Digits of one width: values do not shift when they change, and forecast
	// rows take the room they take on the page.
	it.each( Object.keys( EDITS ) )(
		'%s lines digits up in columns in the editor when the front does',
		( slug ) => {
			const front = readFileSync(
				join( __dirname, '..', slug, 'render.php' ),
				'utf8'
			).includes( 'elio-tabular-nums' );

			expect(
				render( EDITS[ slug ] ).classList.contains(
					'elio-tabular-nums'
				)
			).toBe( front );
		}
	);

	// Each edit.js writes its class names in full: they must be the ones its
	// render.php prints, a typo would leave the editor unstyled.
	it.each( Object.keys( EDITS ) )(
		'%s gives its prefix, value and unit the class names of the front',
		( slug ) => {
			const dir = join( __dirname, '..', slug );
			const front = [
				...readFileSync( join( dir, 'render.php' ), 'utf8' ).matchAll(
					/class="(wp-block-elio-[a-z-]+__[a-z]+)"/g
				),
			].map( ( [ , name ] ) => name );
			const { attributes = {} } = JSON.parse(
				readFileSync( join( dir, 'block.json' ), 'utf8' )
			);
			const paragraph = render( EDITS[ slug ], {
				attributes: attributes.showPrefix
					? { showPrefix: true, prefix: 'Prefix' }
					: {},
			} );

			expect(
				[ ...paragraph.querySelectorAll( '*' ) ].map(
					( element ) => element.className
				)
			).toEqual( front );
		}
	);

	describe( 'dates', () => {
		const TOKYO = {
			meta: {
				timezone: 'Asia/Tokyo',
				fetched_at: '2026-07-01T05:32:10+00:00',
			},
			current: {
				timestamp: '2026-07-01T14:15:00+09:00',
				sunrise: '2026-07-01T04:29:00+09:00',
				sunset: '2026-07-01T19:01:00+09:00',
			},
		};

		beforeEach( () => {
			useWeatherReport.mockReturnValue( { data: TOKYO } );
		} );

		afterEach( () => {
			vi.useRealTimers();
		} );

		it( 'are shown in the timezone of the location, like on the front', () => {
			const time = { displayType: 'time', format: 'H:i' };

			expect( shown( DatetimeEdit, { attributes: time } ) ).toBe(
				'14:15'
			);
			expect(
				shown( SunEventEdit, { attributes: { format: 'H:i' } } )
			).toBe( '04:29' );
			expect(
				shown( SunEventEdit, {
					attributes: { displayType: 'sunset', format: 'H:i' },
				} )
			).toBe( '19:01' );
			expect(
				shown( LastUpdatedEdit, { attributes: { format: 'H:i' } } )
			).toBe( '14:32' );
		} );

		it( 'say when the weather data was last updated, unless told otherwise', () => {
			const lastUpdated = ( attributes ) =>
				shown( LastUpdatedEdit, {
					attributes: {
						showPrefix: true,
						format: 'H:i',
						...attributes,
					},
				} );

			expect( lastUpdated() ).toBe( 'Updated 14:32' );
			expect( lastUpdated( { prefix: 'Refreshed at' } ) ).toBe(
				'Refreshed at 14:32'
			);
			expect( lastUpdated( { showPrefix: false } ) ).toBe( '14:32' );
		} );

		it( 'label the current day and hour where the weather forecast is', () => {
			vi.useFakeTimers().setSystemTime(
				new Date( '2026-07-02T00:30:00+09:00' )
			);
			const labelled = { currentAsLabel: true, format: 'Y-m-d' };
			const row = ( timestamp ) => ( {
				'elio/forecastItem': { timestamp },
			} );

			expect(
				shown( DatetimeEdit, {
					attributes: labelled,
					context: row( '2026-07-02T00:00:00+09:00' ),
				} )
			).toBe( 'Today' );
			expect(
				shown( DatetimeEdit, {
					attributes: labelled,
					context: row( '2026-07-01T12:00:00+09:00' ),
				} )
			).toBe( '2026-07-01' );
			expect(
				shown( DatetimeEdit, {
					attributes: {
						...labelled,
						displayType: 'time',
						nowLabel: 'Maintenant',
					},
					context: row( '2026-07-02T00:00:00+09:00' ),
				} )
			).toBe( 'Maintenant' );
		} );

		it( 'word a relative date like the front, the "human-diff" format of the picker', () => {
			vi.useFakeTimers().setSystemTime(
				new Date( '2026-07-01T05:37:10Z' )
			);
			const relative = { format: 'human-diff' };

			expect( shown( LastUpdatedEdit, { attributes: relative } ) ).toBe(
				'5 minutes ago'
			);
			expect(
				shown( DatetimeEdit, {
					attributes: { ...relative, displayType: 'time' },
				} )
			).toBe( '22 minutes ago' );
			expect(
				shown( SunEventEdit, {
					attributes: { ...relative, displayType: 'sunset' },
				} )
			).toBe( 'in 4 hours' );
		} );

		it( 'give an hourly row the sun event of the day', () => {
			expect(
				shown( SunEventEdit, {
					attributes: { format: 'H:i' },
					context: { 'elio/forecastItem': { temperature: 21 } },
				} )
			).toBe( '04:29' );
		} );
	} );
} );
