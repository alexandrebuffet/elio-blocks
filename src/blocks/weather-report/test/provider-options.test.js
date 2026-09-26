/**
 * External dependencies
 */
import { describe, expect, it } from 'vitest';

/**
 * Internal dependencies
 */
import { getProviderOptions } from '../provider-options';

const PROVIDERS = [
	{ slug: 'open-meteo', label: 'Open-Meteo', isDefault: false },
	{ slug: 'acme-weather', label: 'Acme Weather', isDefault: true },
];

describe( 'weather-report provider options', () => {
	it( 'names the site default provider, then offers every registered provider', () => {
		expect( getProviderOptions( PROVIDERS, '' ) ).toEqual( [
			{ label: 'Default (Acme Weather)', value: '' },
			{ label: 'Open-Meteo', value: 'open-meteo' },
			// Picking the default provider itself pins the block to it.
			{ label: 'Acme Weather', value: 'acme-weather' },
		] );
	} );

	it( 'says Default while the providers are not there', () => {
		expect( getProviderOptions( null, '' ) ).toEqual( [
			{ label: 'Default', value: '' },
		] );
	} );

	it( 'keeps the provider of the block when it is not registered, instead of showing Default', () => {
		expect( getProviderOptions( PROVIDERS, 'uninstalled' ) ).toEqual( [
			{ label: 'Default (Acme Weather)', value: '' },
			{ label: 'Open-Meteo', value: 'open-meteo' },
			{ label: 'Acme Weather', value: 'acme-weather' },
			{ label: 'uninstalled', value: 'uninstalled' },
		] );
	} );

	it( 'keeps the provider of the block while the providers are not there', () => {
		expect( getProviderOptions( null, 'acme-weather' ) ).toEqual( [
			{ label: 'Default', value: '' },
			{ label: 'acme-weather', value: 'acme-weather' },
		] );
	} );
} );
