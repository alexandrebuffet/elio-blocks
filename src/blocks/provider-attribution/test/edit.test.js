/**
 * External dependencies
 */
import { describe, expect, it, vi } from 'vitest';

/**
 * WordPress dependencies
 */
import { createRegistry, createReduxStore } from '@wordpress/data';

/**
 * Internal dependencies
 */
import ProviderAttributionEdit from '../edit';
import { renderWithRegistry } from '../../../test-utils/render-hook';

vi.mock( '@wordpress/block-editor', () => ( {
	useBlockProps: ( props ) => ( {
		className: 'wp-block-elio-provider-attribution',
		...props,
	} ),
} ) );
vi.mock( '../../../stores/elio-data', () => ( { store: 'elio/data' } ) );

const OPEN_METEO = {
	slug: 'open-meteo',
	label: 'Open-Meteo',
	isDefault: true,
	attribution: {
		text: 'Weather data by Open-Meteo.com',
		url: 'https://open-meteo.com/',
		license: 'CC BY 4.0',
		licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
	},
};
const SILENT = {
	slug: 'silent',
	label: 'Silent',
	isDefault: false,
	attribution: null,
};

function renderEdit( providers, provider = '' ) {
	const registry = createRegistry();
	registry.register(
		createReduxStore( 'elio/data', {
			reducer: ( state = {} ) => state,
			selectors: { getWeatherForecastProviders: () => providers },
		} )
	);

	return renderWithRegistry(
		registry,
		<ProviderAttributionEdit
			context={ { 'elio/reportProvider': provider } }
		/>
	).container;
}

describe( 'provider-attribution edit', () => {
	it( 'shows the credit of the site default provider as render.php prints it', () => {
		const container = renderEdit( [ OPEN_METEO, SILENT ] );

		const credit = container.querySelector(
			'.wp-block-elio-provider-attribution__provider-link'
		);
		const license = container.querySelector(
			'.wp-block-elio-provider-attribution__license-link'
		);
		expect( credit.textContent ).toBe( 'Weather data by Open-Meteo.com' );
		expect( credit.getAttribute( 'href' ) ).toBe(
			'https://open-meteo.com/'
		);
		expect( license.getAttribute( 'rel' ) ).toBe( 'license' );
		expect(
			container.querySelector(
				'.wp-block-elio-provider-attribution__license'
			).textContent
		).toBe( '(CC BY 4.0)' );
	} );

	it( 'shows the credit of the provider its report picked', () => {
		const container = renderEdit(
			[
				{ ...OPEN_METEO, isDefault: false },
				{
					...SILENT,
					slug: 'acme',
					isDefault: true,
					attribution: {
						text: 'Data by Acme',
						url: '',
						license: '',
						licenseUrl: '',
					},
				},
			],
			'open-meteo'
		);

		expect( container.textContent ).toContain(
			'Weather data by Open-Meteo.com'
		);
	} );

	it( 'keeps a click on a credit link in the editor', () => {
		const container = renderEdit( [ OPEN_METEO ] );
		const event = new window.MouseEvent( 'click', {
			bubbles: true,
			cancelable: true,
		} );

		container
			.querySelector(
				'.wp-block-elio-provider-attribution__provider-link'
			)
			.dispatchEvent( event );

		expect( event.defaultPrevented ).toBe( true );
	} );

	it( 'stays selectable when the provider asks for no credit', () => {
		const container = renderEdit( [ OPEN_METEO, SILENT ], 'silent' );

		expect( container.querySelector( 'a' ) ).toBeNull();
		expect( container.textContent ).toBe(
			'This provider asks for no attribution.'
		);
	} );
} );
