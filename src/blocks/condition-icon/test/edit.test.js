/**
 * External dependencies
 */
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * Internal dependencies
 */
import ConditionIconEdit from '../edit';
import { useWeatherReport } from '../../../block-editor/hooks';

// WordPress 6.9 and older have no getDimensionsClassesAndStyles().
const blockEditor = vi.hoisted( () => ( {
	getDimensionsClassesAndStyles: () => ( {} ),
} ) );
vi.mock( '@wordpress/block-editor', () => ( {
	useBlockProps: ( props ) => props,
	__experimentalUseColorProps: () => ( {} ),
	__experimentalUseBorderProps: () => ( {} ),
	__experimentalGetSpacingClassesAndStyles: () => ( {} ),
	get getDimensionsClassesAndStyles() {
		return blockEditor.getDimensionsClassesAndStyles;
	},
} ) );
vi.mock( '../../../block-editor/hooks', () => ( {
	useWeatherReport: vi.fn(),
	useConditionIconCollections: () => ( {
		collections: [
			{ slug: 'elio', is_default: true },
			{ slug: 'theme', is_default: false },
		],
		defaultCollection: 'elio',
		isResolving: false,
	} ),
} ) );
vi.mock( '../inspector', () => ( { default: () => null } ) );

const WEATHER_FORECAST = {
	current: { condition_icons: { elio: 'elio/sun', theme: 'theme/sunny' } },
	daily: [ { condition_icons: { elio: 'elio/moon', theme: null } } ],
	icons: {
		'elio/sun': { content: '<svg data-icon="sun"></svg>', style: 'fill' },
		'elio/moon': {
			content: '<svg data-icon="moon"></svg>',
			style: 'stroke',
		},
		'theme/sunny': {
			content: '<svg data-icon="sunny"></svg>',
			style: 'fill',
		},
	},
};

global.IS_REACT_ACT_ENVIRONMENT = true;

function renderEdit( context = {}, attributes = {} ) {
	const container = document.createElement( 'div' );

	act( () => {
		createRoot( container ).render(
			<ConditionIconEdit
				clientId="abc"
				attributes={ attributes }
				context={ context }
				setAttributes={ () => {} }
				isSelected={ false }
			/>
		);
	} );

	return container.innerHTML;
}

describe( 'condition-icon edit', () => {
	it( 'draws the current icon from the icons dictionary of the weather forecast', () => {
		useWeatherReport.mockReturnValue( { data: WEATHER_FORECAST } );

		expect( renderEdit() ).toContain( 'data-icon="sun"' );
	} );

	it( 'draws the icon of its forecast item inside a forecast template', () => {
		useWeatherReport.mockReturnValue( { data: WEATHER_FORECAST } );

		const html = renderEdit( {
			'elio/forecastItem': WEATHER_FORECAST.daily[ 0 ],
		} );

		expect( html ).toContain( 'data-icon="moon"' );
		expect( html ).toContain( 'is-stroke-symbol' );
	} );

	it( 'shows the placeholder while there is no weather forecast', () => {
		useWeatherReport.mockReturnValue( { data: null } );

		expect( renderEdit() ).toContain(
			'wp-block-elio-condition-icon__placeholder'
		);
	} );

	it( 'draws the icon of the collection the block chose', () => {
		useWeatherReport.mockReturnValue( { data: WEATHER_FORECAST } );

		expect( renderEdit( {}, { iconCollection: 'theme' } ) ).toContain(
			'data-icon="sunny"'
		);
	} );

	it( 'follows the collection of its report', () => {
		useWeatherReport.mockReturnValue( { data: WEATHER_FORECAST } );

		expect(
			renderEdit( { 'elio/reportIconCollection': 'theme' } )
		).toContain( 'data-icon="sunny"' );
	} );

	it( 'shows the placeholder when the collection has no icon for the condition', () => {
		useWeatherReport.mockReturnValue( { data: WEATHER_FORECAST } );

		const html = renderEdit(
			{ 'elio/forecastItem': WEATHER_FORECAST.daily[ 0 ] },
			{ iconCollection: 'theme' }
		);

		expect( html ).toContain( 'wp-block-elio-condition-icon__placeholder' );
	} );

	describe( 'on WordPress 6.9 and older', () => {
		const getDimensionsClassesAndStyles =
			blockEditor.getDimensionsClassesAndStyles;

		afterEach( () => {
			blockEditor.getDimensionsClassesAndStyles =
				getDimensionsClassesAndStyles;
		} );

		it( 'sizes the icon to the width of the block', () => {
			blockEditor.getDimensionsClassesAndStyles = undefined;
			useWeatherReport.mockReturnValue( { data: WEATHER_FORECAST } );

			const style = { dimensions: { width: '48px' } };

			expect( renderEdit( {}, { style } ) ).toContain( 'width: 48px' );
		} );

		it( 'reads a width preset as its custom property', () => {
			blockEditor.getDimensionsClassesAndStyles = undefined;
			useWeatherReport.mockReturnValue( { data: null } );

			const style = { dimensions: { width: 'var:preset|dimension|m' } };

			expect( renderEdit( {}, { style } ) ).toContain(
				'width: var(--wp--preset--dimension--m)'
			);
		} );
	} );
} );
