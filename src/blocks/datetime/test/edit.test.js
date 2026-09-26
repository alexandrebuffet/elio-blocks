/**
 * External dependencies
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { createRegistry, createReduxStore } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store } from '../../../stores/elio-data';
import { advance, renderWithRegistry } from '../../../test-utils/render-hook';
import DatetimeEdit from '../edit';

vi.mock( '@wordpress/api-fetch', () => ( { default: vi.fn() } ) );
vi.mock( '@wordpress/block-editor', () => ( {
	useBlockProps: ( props ) => props ?? {},
	RichText: () => null,
} ) );
vi.mock( '../inspector', () => ( { default: () => null } ) );

const PARIS = { latitude: 48.8566, longitude: 2.3522, name: 'Paris' };

// Days start at midnight in Paris, 22:00 UTC the day before.
const day = ( date ) => ( { timestamp: `${ date }T00:00:00+02:00` } );
const WEATHER_FORECAST = {
	meta: { timezone: 'Europe/Paris' },
	current: { timestamp: '2026-09-25T14:00:00+02:00' },
	daily: [ day( '2026-09-25' ), day( '2026-09-26' ), day( '2026-09-27' ) ],
};

/**
 * Creates the registry of a Forecast Template row other than the one being
 * edited: a block preview, whose block editor store holds the inner blocks of the
 * template only. The report is not in it; its query reaches the row through
 * block context.
 *
 * @return {Object} Registry.
 */
function makePreviewRegistry() {
	const registry = createRegistry();
	registry.register( store );
	registry.register(
		createReduxStore( 'core/block-editor', {
			reducer: ( state = {} ) => state,
			selectors: {
				getBlockParentsByBlockName: () => [],
				getBlockAttributes: () => null,
			},
		} )
	);
	return registry;
}

async function dayLabel( item ) {
	const { container } = renderWithRegistry(
		makePreviewRegistry(),
		<DatetimeEdit
			clientId="datetime"
			attributes={ {
				displayType: 'date',
				format: 'l',
				currentAsLabel: true,
			} }
			context={ {
				'elio/reportLocation': PARIS,
				'elio/reportProvider': '',
				'elio/reportUnits': '',
				'elio/forecastItem': item,
			} }
			setAttributes={ () => {} }
			isSelected={ false }
		/>
	);
	await advance( 1000 );

	return container.querySelector( 'time' ).textContent;
}

describe( 'datetime edit in a forecast row', () => {
	beforeEach( () => {
		vi.useFakeTimers();
		apiFetch.mockReset();
		apiFetch.mockResolvedValue( WEATHER_FORECAST );
		// Site timezone left at the default: UTC.
		window.elioBlocksDateSettings = {
			formats: { date: 'F j, Y', time: 'g:i a' },
			timezone: { string: '', offset: 0 },
		};
	} );

	afterEach( () => {
		vi.useRealTimers();
		delete window.elioBlocksDateSettings;
	} );

	it.each( [
		[ 'Today', WEATHER_FORECAST.daily[ 0 ] ],
		[ 'Saturday', WEATHER_FORECAST.daily[ 1 ] ],
		[ 'Sunday', WEATHER_FORECAST.daily[ 2 ] ],
	] )(
		'names the day %s in the timezone of the location, not the one of the site',
		async ( label, item ) => {
			vi.setSystemTime( new Date( '2026-09-25T12:00:00Z' ) );

			expect( await dayLabel( item ) ).toBe( label );
		}
	);

	it( 'tells today from the date in the timezone of the location', async () => {
		// 01:30 on Saturday in Paris, still Friday in UTC.
		vi.setSystemTime( new Date( '2026-09-25T23:30:00Z' ) );

		expect( await dayLabel( WEATHER_FORECAST.daily[ 0 ] ) ).toBe(
			'Friday'
		);
		expect( await dayLabel( WEATHER_FORECAST.daily[ 1 ] ) ).toBe( 'Today' );
	} );
} );
