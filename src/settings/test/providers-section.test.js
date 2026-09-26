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
import {
	buildProvidersFields,
	buildProvidersForm,
	getCredentialFieldValues,
	getCredentialsToSave,
	splitCredentialEdits,
} from '../providers-section';
import { renderWithRegistry } from '../../test-utils/render-hook';

vi.mock( '@wordpress/api-fetch', () => ( { default: vi.fn() } ) );
vi.mock( '@wordpress/core-data', () => ( { store: 'core' } ) );
vi.mock( '@wordpress/components', () => ( {
	__experimentalVStack: ( { children } ) => <div>{ children }</div>,
	Button: ( { label, onClick, children } ) => (
		<button aria-label={ label } onClick={ onClick }>
			{ children }
		</button>
	),
	Notice: ( { children } ) => <div>{ children }</div>,
	SelectControl: ( { label, options } ) => (
		<select aria-label={ label }>
			{ options.map( ( option ) => (
				<option key={ option.value } value={ option.value }>
					{ option.label }
				</option>
			) ) }
		</select>
	),
	__experimentalInputControl: ( {
		label,
		help,
		type,
		value,
		disabled,
		onChange,
		suffix,
	} ) => (
		<>
			<label htmlFor="credential">{ label }</label>
			<input
				id="credential"
				type={ type }
				value={ value }
				disabled={ disabled }
				onChange={ ( event ) => onChange( event.target.value ) }
			/>
			{ suffix }
			{ help && <p>{ help }</p> }
		</>
	),
	__experimentalInputControlSuffixWrapper: ( { children } ) => children,
} ) );

function credential( overrides ) {
	return {
		description: '',
		required: false,
		secret: false,
		isDefinedInConfig: false,
		isSet: false,
		value: '',
		...overrides,
	};
}

const OPEN_METEO = {
	slug: 'open-meteo',
	label: 'Open-Meteo',
	credentials: [
		credential( {
			name: 'api_key',
			label: 'API Key',
			description: 'Only with a subscription.',
			secret: true,
			constant: 'ELIO_BLOCKS_OPEN_METEO_API_KEY',
		} ),
	],
};

const ACME_WEATHER = {
	slug: 'acme-weather',
	label: 'Acme Weather',
	credentials: [
		credential( {
			name: 'username',
			label: 'Username',
			description: 'Of your account.',
			required: true,
			isSet: true,
			value: 'me',
			constant: 'ELIO_BLOCKS_ACME_WEATHER_USERNAME',
		} ),
		credential( {
			name: 'password',
			label: 'Password',
			required: true,
			secret: true,
			isSet: true,
			constant: 'ELIO_BLOCKS_ACME_WEATHER_PASSWORD',
		} ),
	],
};

const ACME_AIR = { slug: 'acme-air', label: 'Acme Air', credentials: [] };

const PROVIDERS = [ OPEN_METEO, ACME_WEATHER, ACME_AIR ];

const WEATHER_FORECAST_PROVIDERS = [
	{ slug: 'open-meteo', label: 'Open-Meteo', isDefault: true },
	{ slug: 'acme-weather', label: 'Acme Weather', isDefault: false },
];

function getCard( form, id ) {
	return form.fields.find( ( card ) => card.id === id );
}

function renderField(
	id,
	data = {},
	onChange = () => {},
	providers = PROVIDERS
) {
	const field = buildProvidersFields(
		WEATHER_FORECAST_PROVIDERS,
		providers
	).find( ( candidate ) => candidate.id === id );

	return renderWithRegistry(
		createRegistry(),
		<field.Edit data={ data } field={ field } onChange={ onChange } />
	).container;
}

function buttonNames( container ) {
	return [ ...container.querySelectorAll( 'button' ) ].map(
		( button ) => button.getAttribute( 'aria-label' ) ?? button.textContent
	);
}

function codes( container ) {
	return [ ...container.querySelectorAll( 'code' ) ].map(
		( code ) => code.textContent
	);
}

describe( 'settings page: the Providers section', () => {
	it( 'sets the default weather forecast provider in its own card', () => {
		const card = getCard(
			buildProvidersForm( PROVIDERS ),
			'weather-forecast'
		);

		expect( card.label ).toBe( 'Weather Forecast' );
		expect( card.children.map( ( field ) => field.id ) ).toEqual( [
			'elio_blocks_weather_forecast_provider',
		] );
	} );

	it( 'gives each provider that declares credentials a card with their fields, whatever it serves', () => {
		const form = buildProvidersForm( PROVIDERS );
		const card = getCard( form, 'provider-acme-weather' );

		expect( form.fields.map( ( { id } ) => id ) ).toEqual( [
			'weather-forecast',
			'provider-open-meteo',
			'provider-acme-weather',
		] );
		expect( card.label ).toBe( 'Acme Weather' );
		expect( card.children.map( ( field ) => field.id ) ).toEqual( [
			'credential__acme-weather__username',
			'credential__acme-weather__password',
		] );
	} );

	it( 'offers the providers that serve the weather forecast as the default one', () => {
		const container = renderField(
			'elio_blocks_weather_forecast_provider'
		);

		expect(
			[ ...container.querySelectorAll( 'option' ) ].map(
				( option ) => option.textContent
			)
		).toEqual( [ 'Default (Open-Meteo)', 'Acme Weather' ] );
	} );

	it( 'hides a secret typed until asked to show it, under its description', () => {
		const container = renderField( 'credential__open-meteo__api_key', {
			'credential__open-meteo__api_key': 'k3y',
		} );
		const input = () => container.querySelector( 'input' );
		const toggle = () => container.querySelector( 'button' );

		expect( container.querySelector( 'label' ).textContent ).toBe(
			'API Key'
		);
		expect( container.querySelector( 'p' ).textContent ).toBe(
			'Only with a subscription.'
		);
		expect( input().value ).toBe( 'k3y' );
		expect( input().type ).toBe( 'password' );
		expect( buttonNames( container ) ).toEqual( [ 'Show API Key' ] );

		act( () => toggle().click() );
		expect( input().type ).toBe( 'text' );
		expect( toggle().getAttribute( 'aria-label' ) ).toBe( 'Hide API Key' );

		act( () => toggle().click() );
		expect( input().type ).toBe( 'password' );
	} );

	it( 'says a secret is saved without showing it, and offers to remove it', () => {
		const onChange = vi.fn();
		const container = renderField(
			'credential__acme-weather__password',
			{},
			onChange
		);

		expect( container.querySelector( 'label' ).textContent ).toBe(
			'Password (Required)'
		);
		expect( container.querySelector( 'input' ).value ).toBe( '' );
		expect( container.querySelector( 'p' ).textContent ).toBe(
			'Saved. Type a new one to replace it.'
		);
		expect( buttonNames( container ) ).toEqual( [
			'Show Password',
			'Remove',
		] );

		act( () => container.querySelectorAll( 'button' )[ 1 ].click() );
		expect( onChange ).toHaveBeenCalledWith( {
			'credential__acme-weather__password': null,
		} );
	} );

	it( 'keeps a secret marked for removal when asked to', () => {
		const onChange = vi.fn();
		const container = renderField(
			'credential__acme-weather__password',
			{ 'credential__acme-weather__password': null },
			onChange
		);

		expect( container.querySelector( 'input' ).disabled ).toBe( true );
		expect( container.querySelector( 'p' ).textContent ).toBe(
			'Removed when the settings are saved.'
		);
		expect( buttonNames( container ) ).toEqual( [
			'Show Password',
			'Keep',
		] );

		act( () => container.querySelectorAll( 'button' )[ 1 ].click() );
		expect( onChange ).toHaveBeenCalledWith( {
			'credential__acme-weather__password': undefined,
		} );
	} );

	it( 'shows a value that is not secret, saved or typed, under its description', () => {
		expect(
			renderField( 'credential__acme-weather__username' ).querySelector(
				'input'
			).value
		).toBe( 'me' );

		const container = renderField( 'credential__acme-weather__username', {
			'credential__acme-weather__username': 'you',
		} );

		expect( container.querySelector( 'input' ).value ).toBe( 'you' );
		expect( container.querySelector( 'input' ).type ).not.toBe(
			'password'
		);
		expect( container.querySelector( 'p' ).textContent ).toBe(
			'Of your account.'
		);
	} );

	it( 'cannot change a value set in wp-config.php, and names its constant', () => {
		const configured = {
			...OPEN_METEO,
			credentials: [
				{
					...OPEN_METEO.credentials[ 0 ],
					isDefinedInConfig: true,
					isSet: true,
				},
			],
		};
		const container = renderField(
			'credential__open-meteo__api_key',
			{},
			() => {},
			[ configured ]
		);

		expect( container.querySelector( 'input' ).disabled ).toBe( true );
		expect( codes( container ) ).toEqual( [
			'wp-config.php',
			'ELIO_BLOCKS_OPEN_METEO_API_KEY',
		] );
	} );

	it( 'keeps the credentials typed apart from the site settings', () => {
		expect(
			splitCredentialEdits( {
				elio_blocks_weather_forecast_provider: 'acme-weather',
				'credential__acme-weather__username': 'you',
				'credential__acme-weather__password': null,
				'credential__open-meteo__api_key': 'k3y',
			} )
		).toEqual( {
			settings: { elio_blocks_weather_forecast_provider: 'acme-weather' },
			credentials: {
				'acme-weather': { username: 'you', password: null },
				'open-meteo': { api_key: 'k3y' },
			},
		} );
		expect(
			getCredentialFieldValues( { 'open-meteo': { api_key: 'k3y' } } )
		).toEqual( { 'credential__open-meteo__api_key': 'k3y' } );
	} );

	it( 'saves only what changed: a secret typed, a secret removed, a value edited', () => {
		expect(
			getCredentialsToSave( PROVIDERS, {
				'open-meteo': { api_key: 'k3y' },
				'acme-weather': { username: 'you', password: null },
			} )
		).toEqual( {
			'open-meteo': { api_key: 'k3y' },
			'acme-weather': { username: 'you', password: '' },
		} );
	} );

	it( 'leaves as they are a secret typed then emptied, a value set back, and what is not saved', () => {
		expect(
			getCredentialsToSave( PROVIDERS, {
				'open-meteo': { api_key: '' },
				'acme-weather': { username: 'me', password: undefined },
				uninstalled: { api_key: 'k3y' },
			} )
		).toEqual( {} );
		// Removing a key that is not saved changes nothing.
		expect(
			getCredentialsToSave( PROVIDERS, {
				'open-meteo': { api_key: null },
			} )
		).toEqual( {} );
	} );

	it( 'never saves a value set in wp-config.php', () => {
		const configured = {
			...OPEN_METEO,
			credentials: [
				{ ...OPEN_METEO.credentials[ 0 ], isDefinedInConfig: true },
			],
		};

		expect(
			getCredentialsToSave( [ configured ], {
				'open-meteo': { api_key: 'k3y' },
			} )
		).toEqual( {} );
	} );
} );
