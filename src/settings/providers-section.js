/**
 * WordPress dependencies
 */
import {
	Button,
	SelectControl,
	__experimentalVStack as VStack,
	__experimentalInputControl as InputControl,
	__experimentalInputControlSuffixWrapper as InputControlSuffixWrapper,
} from '@wordpress/components';
import { __, _x, sprintf } from '@wordpress/i18n';
import { createInterpolateElement, useState } from '@wordpress/element';
import { seen, unseen } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { CONFIG_SETTINGS_DEFAULTS } from './elio-blocks-config';

const fieldLayout = { type: 'regular', labelPosition: 'top' };

/**
 * Renders the field of a credential a provider declares.
 *
 * A secret starts empty: the server never sends it back, it only says whether
 * one is saved. Typing replaces it; Remove forgets it on save. Another value
 * shows what is saved, and emptying it forgets it on save. A value set in
 * wp-config.php cannot be changed here.
 *
 * @param {Object}                                 props            Component props.
 * @param {Object}                                 props.credential Credential, from the REST API.
 * @param {string|null|undefined}                  props.value      Typed; null to remove the saved secret, undefined when untouched.
 * @param {(value: string|null|undefined) => void} props.onChange   Called with the new edit.
 */
function CredentialControl( { credential, value, onChange } ) {
	const [ isVisible, setIsVisible ] = useState( false );

	const label = credential.required
		? sprintf(
				/* translators: %s: Credential label (e.g. API Key). */
				__( '%s (Required)', 'elio-blocks' ),
				credential.label
			)
		: credential.label;

	if ( credential.isDefinedInConfig ) {
		return (
			<InputControl
				__next40pxDefaultSize
				label={ label }
				value=""
				disabled
				help={ createInterpolateElement(
					sprintf(
						/* translators: %s: wp-config.php constant name. */
						__(
							'Set in <code>wp-config.php</code>, with the constant %s.',
							'elio-blocks'
						),
						`<constant>${ credential.constant }</constant>`
					),
					{ code: <code />, constant: <code /> }
				) }
			/>
		);
	}

	if ( ! credential.secret ) {
		return (
			<InputControl
				__next40pxDefaultSize
				label={ label }
				value={ typeof value === 'string' ? value : credential.value }
				onChange={ ( nextValue ) => onChange( nextValue ?? '' ) }
				help={ credential.description || undefined }
			/>
		);
	}

	const isRemoved = value === null;
	const isSavedAndUntouched = credential.isSet && ! isRemoved && ! value;
	let status;
	if ( isRemoved ) {
		status = __( 'Removed when the settings are saved.', 'elio-blocks' );
	} else if ( isSavedAndUntouched ) {
		status = __( 'Saved. Type a new one to replace it.', 'elio-blocks' );
	}

	return (
		<VStack spacing={ 2 } alignment="stretch">
			<InputControl
				__next40pxDefaultSize
				label={ label }
				type={ isVisible ? 'text' : 'password' }
				autoComplete="off"
				value={ typeof value === 'string' ? value : '' }
				disabled={ isRemoved }
				onChange={ ( nextValue ) => onChange( nextValue ?? '' ) }
				help={
					[ credential.description, status ]
						.filter( Boolean )
						.join( ' ' ) || undefined
				}
				suffix={
					<InputControlSuffixWrapper variant="control">
						<Button
							size="small"
							icon={ isVisible ? unseen : seen }
							label={
								isVisible
									? sprintf(
											/* translators: %s: Credential label (e.g. API Key). */
											__( 'Hide %s', 'elio-blocks' ),
											credential.label
										)
									: sprintf(
											/* translators: %s: Credential label (e.g. API Key). */
											__( 'Show %s', 'elio-blocks' ),
											credential.label
										)
							}
							onClick={ () =>
								setIsVisible( ( visible ) => ! visible )
							}
						/>
					</InputControlSuffixWrapper>
				}
			/>
			{ isRemoved && (
				<div>
					<Button
						variant="link"
						onClick={ () => onChange( undefined ) }
					>
						{ __( 'Keep', 'elio-blocks' ) }
					</Button>
				</div>
			) }
			{ isSavedAndUntouched && (
				<div>
					<Button
						variant="link"
						isDestructive
						onClick={ () => onChange( null ) }
					>
						{ __( 'Remove', 'elio-blocks' ) }
					</Button>
				</div>
			) }
		</VStack>
	);
}

/**
 * Builds the field of the default weather forecast provider.
 *
 * @param {Object[]} weatherForecastProviders Providers that serve the weather forecast, from the REST API.
 * @return {Object} DataViews field config.
 */
function buildWeatherForecastProviderField( weatherForecastProviders ) {
	const defaultSlug =
		CONFIG_SETTINGS_DEFAULTS.elio_blocks_weather_forecast_provider;
	const defaultProvider = weatherForecastProviders.find(
		( p ) => p.slug === defaultSlug
	);
	const defaultLabel = defaultProvider?.label ?? defaultSlug;

	const providerOptions = [
		{
			label: sprintf(
				/* translators: %s: Provider label (e.g. Open-Meteo). */
				_x( 'Default (%s)', 'weather provider', 'elio-blocks' ),
				defaultLabel
			),
			value: defaultSlug,
		},
		...weatherForecastProviders
			.filter( ( p ) => p.slug !== defaultSlug )
			.map( ( p ) => ( { label: p.label, value: p.slug } ) ),
	];

	return {
		id: 'elio_blocks_weather_forecast_provider',
		label: __( 'Default Provider', 'elio-blocks' ),
		type: 'text',
		Edit: ( { data, onChange } ) => (
			<SelectControl
				label={ __( 'Default Provider', 'elio-blocks' ) }
				help={ __(
					'Sets which weather forecast provider fetches weather data for the site by default. Each block can still pick another provider in its own settings.',
					'elio-blocks'
				) }
				value={
					data.elio_blocks_weather_forecast_provider ?? defaultSlug
				}
				options={ providerOptions }
				onChange={ ( value ) =>
					onChange( { elio_blocks_weather_forecast_provider: value } )
				}
			/>
		),
	};
}

const CREDENTIAL_FIELD_PREFIX = 'credential__';

/**
 * Returns the field ID of a credential: its provider slug has hyphens, its name
 * underscores, neither a double underscore.
 *
 * @param {string} slug Provider slug.
 * @param {string} name Credential name.
 * @return {string} Field ID.
 */
function getCredentialFieldId( slug, name ) {
	return `${ CREDENTIAL_FIELD_PREFIX }${ slug }__${ name }`;
}

/**
 * Returns the providers that declare credentials.
 *
 * @param {Object[]} providers Every provider, from the REST API.
 * @return {Object[]} The providers that declare credentials.
 */
function getProvidersWithCredentials( providers ) {
	return providers.filter( ( provider ) => provider.credentials?.length > 0 );
}

/**
 * Splits DataForm edits into site settings and credentials typed: the
 * credentials are not site settings, they are saved apart.
 *
 * @param {Object} edits DataForm edits.
 * @return {{ settings: Object, credentials: Object<string, Object> }} Site settings, and credential edits by provider slug and name.
 */
export function splitCredentialEdits( edits ) {
	const settings = {};
	const credentials = {};

	for ( const [ id, value ] of Object.entries( edits ) ) {
		if ( id.startsWith( CREDENTIAL_FIELD_PREFIX ) ) {
			const [ slug, name ] = id
				.slice( CREDENTIAL_FIELD_PREFIX.length )
				.split( '__' );
			credentials[ slug ] = { ...credentials[ slug ], [ name ]: value };
		} else {
			settings[ id ] = value;
		}
	}

	return { settings, credentials };
}

/**
 * Maps credential edits to the values of their fields.
 *
 * @param {Object<string, Object>} credentials Credential edits, by provider slug and name.
 * @return {Object} Values of the credential fields, for the DataForm data.
 */
export function getCredentialFieldValues( credentials ) {
	return Object.fromEntries(
		Object.entries( credentials ).flatMap( ( [ slug, values ] ) =>
			Object.entries( values ).map( ( [ name, value ] ) => [
				getCredentialFieldId( slug, name ),
				value,
			] )
		)
	);
}

/**
 * Returns the credential edits worth saving, by provider slug and name: a secret
 * typed then emptied is left as it is, a removed one is sent empty (the
 * server forgets it), another value only when it changed.
 *
 * @param {Object[]}               providers   Every provider, from the REST API.
 * @param {Object<string, Object>} credentials Credential edits, by provider slug and name.
 * @return {Object<string, Object<string, string>>} Values to save, by provider slug and name.
 */
export function getCredentialsToSave( providers, credentials ) {
	const toSave = {};

	for ( const provider of providers ) {
		const values = {};

		for ( const credential of provider.credentials ?? [] ) {
			const value = credentials[ provider.slug ]?.[ credential.name ];

			if ( value === undefined || credential.isDefinedInConfig ) {
				continue;
			}

			if ( value === null ) {
				if ( credential.isSet ) {
					values[ credential.name ] = '';
				}
			} else if (
				credential.secret ? value !== '' : value !== credential.value
			) {
				values[ credential.name ] = value;
			}
		}

		if ( Object.keys( values ).length > 0 ) {
			toSave[ provider.slug ] = values;
		}
	}

	return toSave;
}

/**
 * Builds the fields of the Providers section: the default provider of each domain, and
 * the credentials each provider declares, whatever it serves.
 *
 * @param {Object[]} weatherForecastProviders Providers that serve the weather forecast, from the REST API.
 * @param {Object[]} providers                Every provider, from the REST API.
 * @return {Object[]} DataViews fields.
 */
export function buildProvidersFields( weatherForecastProviders, providers ) {
	return [
		buildWeatherForecastProviderField( weatherForecastProviders ),
		...getProvidersWithCredentials( providers ).flatMap( ( provider ) =>
			provider.credentials.map( ( credential ) => {
				const id = getCredentialFieldId(
					provider.slug,
					credential.name
				);

				return {
					id,
					label: credential.label,
					type: 'text',
					Edit: ( { data, onChange } ) => (
						<CredentialControl
							credential={ credential }
							value={ data[ id ] }
							onChange={ ( value ) =>
								onChange( { [ id ]: value } )
							}
						/>
					),
				};
			} )
		),
	];
}

/**
 * Builds the form of the Providers section: one card per domain, then one card per
 * provider that declares credentials, with their fields.
 *
 * @param {Object[]} providers Every provider, from the REST API.
 * @return {Object} DataForm form config.
 */
export function buildProvidersForm( providers ) {
	return {
		fields: [
			{
				id: 'weather-forecast',
				label: __( 'Weather Forecast', 'elio-blocks' ),
				layout: { type: 'card', withHeader: true, isCollapsible: true },
				children: [
					{
						id: 'elio_blocks_weather_forecast_provider',
						layout: fieldLayout,
					},
				],
			},
			...getProvidersWithCredentials( providers ).map( ( provider ) => ( {
				id: `provider-${ provider.slug }`,
				label: provider.label,
				layout: { type: 'card', withHeader: true, isCollapsible: true },
				children: provider.credentials.map( ( credential ) => ( {
					id: getCredentialFieldId( provider.slug, credential.name ),
					layout: fieldLayout,
				} ) ),
			} ) ),
		],
	};
}
