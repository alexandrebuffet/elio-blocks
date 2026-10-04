/**
 * WordPress dependencies
 */
import { Page } from '@wordpress/admin-ui';
import { DataForm } from '@wordpress/dataviews/wp';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import {
	Button,
	SnackbarList,
	SelectControl,
	ToggleControl,
	__experimentalHStack as HStack,
} from '@wordpress/components';
import { __, _x, sprintf } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { useState, useMemo, useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import IntervalControl, {
	CACHE_DURATION_PRESETS,
	DEFAULT_INTERVAL_PRESETS,
} from '../block-editor/components/interval-control';
import {
	AUTO_REFRESH_INTERVAL_PRESETS,
	CACHE_DURATION_INTERVAL_PRESETS,
} from './settings-interval-presets';
import {
	CONFIG_SETTINGS_DEFAULTS,
	getConfigSettingsDefaults,
} from './elio-blocks-config';
import { useSaveSettings } from './use-settings-actions';
import { useProviders, useWeatherForecastProviders } from './use-providers';
import { ConditionIconCollectionPicker } from './condition-icons-section';
import { getAutoRefreshHelp, isRefreshIntervalUsed } from './auto-refresh';
import { SectionLink, useSettingsSections } from './settings-sections';
import {
	buildProvidersFields,
	buildProvidersForm,
	getCredentialFieldValues,
	getCredentialsToSave,
	splitCredentialEdits,
} from './providers-section';
import { store as elioDataStore } from '../stores/elio-data';
import elioLogo from '../icons/brand/components/elio-logo';

/**
 * Merges the site settings record from core-data onto defaults without letting null or undefined overwrite.
 *
 * @param {Record<string, unknown>}           defaults Registered defaults (PHP-aligned).
 * @param {Record<string, unknown>|undefined} record   Edited entity from `getEditedEntityRecord`.
 * @return {Record<string, unknown>} Merged values for the settings form controls.
 */
function mergeSettingsFormData( defaults, record ) {
	const merged = { ...defaults };
	if ( ! record || typeof record !== 'object' ) {
		return merged;
	}
	for ( const [ key, value ] of Object.entries( record ) ) {
		if ( value !== undefined && value !== null ) {
			merged[ key ] = value;
		}
	}
	return merged;
}

const fieldLayout = { type: 'regular', labelPosition: 'top' };

/**
 * Returns the short label for the plugin default unit system (empty option), aligned with PHP DEFAULT_UNIT_SYSTEM.
 *
 * @return {string} Translated name for sprintf( _x( 'Default (%s)', 'unit system' ), … ).
 */
function getUnitSystemDefaultPresetLabel() {
	const metricLabel = __( 'Metric', 'elio-blocks' );
	const imperialLabel = __( 'Imperial', 'elio-blocks' );
	return CONFIG_SETTINGS_DEFAULTS.elio_blocks_unit_system === 'imperial'
		? imperialLabel
		: metricLabel;
}

const advancedFields = [
	{
		id: 'elio_blocks_cache_enabled',
		label: __( 'Enable cache', 'elio-blocks' ),
		description: __(
			'Cache weather API responses to reduce requests and improve performance.',
			'elio-blocks'
		),
		type: 'boolean',
		Edit: 'toggle',
	},
	{
		id: 'elio_blocks_cache_time',
		label: __( 'Cache Duration', 'elio-blocks' ),
		type: 'integer',
		isVisible: ( item ) => !! item.elio_blocks_cache_enabled,
		Edit: ( { data, onChange } ) => (
			<IntervalControl
				label={ __( 'Cache Duration', 'elio-blocks' ) }
				help={ sprintf(
					/* translators: %s: Short duration label (e.g. "30m"). */
					__(
						'Length of time weather API responses are kept in the server cache before refetching. Fewer requests improve performance. Auto-refresh updates the blocks in the visitor’s browser at the same pace. Default: %s.',
						'elio-blocks'
					),
					CACHE_DURATION_PRESETS.find(
						( p ) =>
							p.value ===
							CONFIG_SETTINGS_DEFAULTS.elio_blocks_cache_time
					)?.label ?? ''
				) }
				value={ data.elio_blocks_cache_time }
				onChange={ ( value ) =>
					onChange( { elio_blocks_cache_time: value } )
				}
				presets={ CACHE_DURATION_INTERVAL_PRESETS }
				resetValue={ CONFIG_SETTINGS_DEFAULTS.elio_blocks_cache_time }
			/>
		),
	},
	{
		id: 'elio_blocks_cleanup_on_delete',
		label: __( 'Delete all plugin data on uninstall', 'elio-blocks' ),
		description: __(
			'Removes the settings, the provider credentials and the cached weather forecasts when the plugin is deleted. This cannot be undone.',
			'elio-blocks'
		),
		type: 'boolean',
		Edit: 'toggle',
	},
];

const advancedForm = {
	fields: [
		{
			id: 'cache',
			label: __( 'Cache', 'elio-blocks' ),
			layout: { type: 'card', withHeader: true, isCollapsible: true },
			children: [
				{ id: 'elio_blocks_cache_enabled', layout: fieldLayout },
				{ id: 'elio_blocks_cache_time', layout: fieldLayout },
			],
		},
		{
			id: 'uninstall',
			label: __( 'Uninstall', 'elio-blocks' ),
			layout: { type: 'card', withHeader: true, isCollapsible: true },
			children: [
				{ id: 'elio_blocks_cleanup_on_delete', layout: fieldLayout },
			],
		},
	],
};

const weatherFields = [
	{
		id: 'elio_blocks_condition_icon_collection',
		label: __( 'Icon Collection', 'elio-blocks' ),
		type: 'text',
		Edit: ( { data, onChange } ) => (
			<ConditionIconCollectionPicker
				value={ data.elio_blocks_condition_icon_collection }
				onChange={ ( value ) =>
					onChange( { elio_blocks_condition_icon_collection: value } )
				}
			/>
		),
	},
];

const weatherForm = {
	fields: [
		{
			id: 'icons',
			label: __( 'Condition Icons', 'elio-blocks' ),
			description: __(
				'Icons the blocks show for the weather conditions. A weather block, or a condition icon inside it, can pick another collection in the editor.',
				'elio-blocks'
			),
			layout: { type: 'card', withHeader: true, isCollapsible: true },
			children: [
				{
					id: 'elio_blocks_condition_icon_collection',
					layout: fieldLayout,
				},
			],
		},
	],
};

const generalFields = [
	{
		id: 'elio_blocks_unit_system',
		label: __( 'Unit System', 'elio-blocks' ),
		description: __(
			'Default unit system. Individual domains can be overridden below.',
			'elio-blocks'
		),
		type: 'text',
		Edit: ( { data, onChange } ) => (
			<SelectControl
				label={ __( 'Unit System', 'elio-blocks' ) }
				help={ __(
					'By default, the plugin uses the International System of Units (SI) that uses metric units (°C, km/h, mm). You can change unit system or configure unit individually for each domain using the settings below.',
					'elio-blocks'
				) }
				value={ data.elio_blocks_unit_system ?? '' }
				options={ [
					{
						label: sprintf(
							/* translators: %s: Short unit system name (e.g. Metric). */
							_x( 'Default (%s)', 'unit system', 'elio-blocks' ),
							getUnitSystemDefaultPresetLabel()
						),
						value: '',
					},
					{
						label: __( 'Metric (SI, °C, km/h, mm)', 'elio-blocks' ),
						value: 'metric',
					},
					{
						label: __( 'Imperial (°F, mph, in)', 'elio-blocks' ),
						value: 'imperial',
					},
				] }
				onChange={ ( value ) =>
					onChange( { elio_blocks_unit_system: value } )
				}
			/>
		),
	},
	{
		id: 'elio_blocks_unit_temperature',
		label: __( 'Temperature', 'elio-blocks' ),
		type: 'text',
		Edit: ( { data, onChange } ) => {
			const isImperial = data.elio_blocks_unit_system === 'imperial';
			return (
				<SelectControl
					label={ __( 'Temperature', 'elio-blocks' ) }
					value={ data.elio_blocks_unit_temperature ?? '' }
					options={ [
						{
							label: isImperial
								? __( 'Default (°F)', 'elio-blocks' )
								: __( 'Default (°C)', 'elio-blocks' ),
							value: '',
						},
						{
							label: __( 'Celsius (°C)', 'elio-blocks' ),
							value: 'celsius',
						},
						{
							label: __( 'Fahrenheit (°F)', 'elio-blocks' ),
							value: 'fahrenheit',
						},
					] }
					onChange={ ( value ) =>
						onChange( { elio_blocks_unit_temperature: value } )
					}
				/>
			);
		},
	},
	{
		id: 'elio_blocks_unit_wind',
		label: __( 'Wind Speed', 'elio-blocks' ),
		type: 'text',
		Edit: ( { data, onChange } ) => {
			const isImperial = data.elio_blocks_unit_system === 'imperial';
			return (
				<SelectControl
					label={ __( 'Wind Speed', 'elio-blocks' ) }
					value={ data.elio_blocks_unit_wind ?? '' }
					options={ [
						{
							label: isImperial
								? __( 'Default (mph)', 'elio-blocks' )
								: __( 'Default (km/h)', 'elio-blocks' ),
							value: '',
						},
						{ label: __( 'km/h', 'elio-blocks' ), value: 'kmh' },
						{ label: __( 'mph', 'elio-blocks' ), value: 'mph' },
						{ label: __( 'm/s', 'elio-blocks' ), value: 'ms' },
						{
							label: __( 'Knots (kt)', 'elio-blocks' ),
							value: 'knots',
						},
						{
							label: __( 'Beaufort (Bft)', 'elio-blocks' ),
							value: 'beaufort',
						},
					] }
					onChange={ ( value ) =>
						onChange( { elio_blocks_unit_wind: value } )
					}
				/>
			);
		},
	},
	{
		id: 'elio_blocks_unit_precipitation',
		label: __( 'Precipitation', 'elio-blocks' ),
		type: 'text',
		Edit: ( { data, onChange } ) => {
			const isImperial = data.elio_blocks_unit_system === 'imperial';
			return (
				<SelectControl
					label={ __( 'Precipitation', 'elio-blocks' ) }
					value={ data.elio_blocks_unit_precipitation ?? '' }
					options={ [
						{
							label: isImperial
								? __( 'Default (in)', 'elio-blocks' )
								: __( 'Default (mm)', 'elio-blocks' ),
							value: '',
						},
						{
							label: __( 'Millimeters (mm)', 'elio-blocks' ),
							value: 'mm',
						},
						{
							label: __( 'Inches (in)', 'elio-blocks' ),
							value: 'in',
						},
					] }
					onChange={ ( value ) =>
						onChange( { elio_blocks_unit_precipitation: value } )
					}
				/>
			);
		},
	},
	{
		id: 'elio_blocks_unit_pressure',
		label: __( 'Pressure', 'elio-blocks' ),
		type: 'text',
		Edit: ( { data, onChange } ) => (
			<SelectControl
				label={ __( 'Pressure', 'elio-blocks' ) }
				value={ data.elio_blocks_unit_pressure ?? '' }
				options={ [
					{
						label: __( 'Default (hPa)', 'elio-blocks' ),
						value: '',
					},
					{
						label: __( 'Hectopascals (hPa)', 'elio-blocks' ),
						value: 'hpa',
					},
					{
						label: __( 'Inches of mercury (inHg)', 'elio-blocks' ),
						value: 'inhg',
					},
					{
						label: __( 'Millibars (mbar)', 'elio-blocks' ),
						value: 'mbar',
					},
				] }
				onChange={ ( value ) =>
					onChange( { elio_blocks_unit_pressure: value } )
				}
			/>
		),
	},
	{
		id: 'elio_blocks_unit_distance',
		label: __( 'Distance', 'elio-blocks' ),
		type: 'text',
		Edit: ( { data, onChange } ) => {
			const isImperial = data.elio_blocks_unit_system === 'imperial';
			return (
				<SelectControl
					label={ __( 'Distance', 'elio-blocks' ) }
					value={ data.elio_blocks_unit_distance ?? '' }
					options={ [
						{
							label: isImperial
								? __( 'Default (mi)', 'elio-blocks' )
								: __( 'Default (km)', 'elio-blocks' ),
							value: '',
						},
						{
							label: __( 'Kilometers (km)', 'elio-blocks' ),
							value: 'km',
						},
						{
							label: __( 'Miles (mi)', 'elio-blocks' ),
							value: 'mi',
						},
						{
							label: __( 'Meters (m)', 'elio-blocks' ),
							value: 'm',
						},
					] }
					onChange={ ( value ) =>
						onChange( { elio_blocks_unit_distance: value } )
					}
				/>
			);
		},
	},
	{
		id: 'elio_blocks_auto_refresh_enabled',
		label: __( 'Enable auto-refresh', 'elio-blocks' ),
		type: 'boolean',
		// The help tells the pace, which the cache settings set.
		Edit: ( { data, onChange } ) => (
			<ToggleControl
				label={ __( 'Enable auto-refresh', 'elio-blocks' ) }
				help={ getAutoRefreshHelp( data ) }
				checked={ !! data.elio_blocks_auto_refresh_enabled }
				onChange={ ( value ) =>
					onChange( { elio_blocks_auto_refresh_enabled: value } )
				}
			/>
		),
	},
	{
		id: 'elio_blocks_refresh_interval',
		label: __( 'Auto-Refresh Interval', 'elio-blocks' ),
		type: 'integer',
		isVisible: isRefreshIntervalUsed,
		Edit: ( { data, onChange } ) => (
			<IntervalControl
				label={ __( 'Auto-Refresh Interval', 'elio-blocks' ) }
				help={ sprintf(
					/* translators: %s: Short duration label (e.g. "15m"). */
					__(
						'Time between two updates of the data in the visitor’s browser. With the cache off, each update asks the data provider. Default: %s.',
						'elio-blocks'
					),
					DEFAULT_INTERVAL_PRESETS.find(
						( p ) =>
							p.value ===
							CONFIG_SETTINGS_DEFAULTS.elio_blocks_refresh_interval
					)?.label ?? ''
				) }
				value={ data.elio_blocks_refresh_interval }
				onChange={ ( value ) =>
					onChange( { elio_blocks_refresh_interval: value } )
				}
				presets={ AUTO_REFRESH_INTERVAL_PRESETS }
			/>
		),
	},
];

const generalForm = {
	fields: [
		{
			id: 'units',
			label: __( 'Units', 'elio-blocks' ),
			layout: { type: 'card', withHeader: true, isCollapsible: true },
			children: [
				{ id: 'elio_blocks_unit_system', layout: fieldLayout },
				{ id: 'elio_blocks_unit_temperature', layout: fieldLayout },
				{ id: 'elio_blocks_unit_wind', layout: fieldLayout },
				{ id: 'elio_blocks_unit_precipitation', layout: fieldLayout },
				{ id: 'elio_blocks_unit_pressure', layout: fieldLayout },
				{ id: 'elio_blocks_unit_distance', layout: fieldLayout },
			],
		},
		{
			id: 'refresh',
			label: __( 'Data Refresh', 'elio-blocks' ),
			layout: {
				type: 'card',
				withHeader: true,
				isCollapsible: true,
				isOpened: false,
			},
			children: [
				{
					id: 'elio_blocks_auto_refresh_enabled',
					layout: fieldLayout,
				},
				{ id: 'elio_blocks_refresh_interval', layout: fieldLayout },
			],
		},
	],
};

const SECTIONS = [
	{ name: 'general', label: __( 'General', 'elio-blocks' ) },
	{ name: 'weather', label: __( 'Weather', 'elio-blocks' ) },
	{ name: 'providers', label: __( 'Providers', 'elio-blocks' ) },
	{ name: 'advanced', label: __( 'Advanced', 'elio-blocks' ) },
];

export default function SettingsPage() {
	const [ notices, setNotices ] = useState( [] );
	const [ isPurging, setIsPurging ] = useState( false );
	const { section, navigation } = useSettingsSections( SECTIONS );

	const addNotice = useCallback(
		( status, message ) =>
			setNotices( ( prev ) => [
				...prev,
				{ id: String( Date.now() ), content: message, status },
			] ),
		[]
	);

	const providers = useProviders( addNotice );
	const weatherForecastProviders = useWeatherForecastProviders( addNotice );

	const data = useSelect(
		( select ) =>
			select( coreStore ).getEditedEntityRecord(
				'root',
				'site',
				undefined
			),
		[]
	);

	const formData = useMemo(
		() => mergeSettingsFormData( getConfigSettingsDefaults(), data ),
		[ data ]
	);

	const providersFields = useMemo(
		() => buildProvidersFields( weatherForecastProviders, providers ),
		[ weatherForecastProviders, providers ]
	);
	const providersForm = useMemo(
		() => buildProvidersForm( providers ),
		[ providers ]
	);

	// Credentials typed, by provider slug and name: saved with the settings, then cleared.
	const [ credentials, setCredentials ] = useState( {} );
	const credentialsToSave = useMemo(
		() => getCredentialsToSave( providers, credentials ),
		[ providers, credentials ]
	);
	// As in the post editor, Save is enabled once something changed: core-data
	// drops an edit set back to the saved value, and a secret typed then
	// emptied is not saved.
	const hasEdits = useSelect(
		( select ) =>
			select( coreStore ).hasEditsForEntityRecord(
				'root',
				'site',
				undefined
			),
		[]
	);
	const canSave = hasEdits || Object.keys( credentialsToSave ).length > 0;
	const providersData = useMemo(
		() => ( { ...formData, ...getCredentialFieldValues( credentials ) } ),
		[ formData, credentials ]
	);

	const { editEntityRecord } = useDispatch( coreStore );
	const { invalidateResolution } = useDispatch( elioDataStore );
	const { save, isSaving } = useSaveSettings( addNotice );

	const onSave = async () => {
		const hasCredentialsToSave =
			Object.keys( credentialsToSave ).length > 0;
		if ( await save( credentialsToSave ) ) {
			setCredentials( {} );
			// The providers say again which credentials are set.
			if ( hasCredentialsToSave ) {
				invalidateResolution( 'getProviders' );
			}
		}
	};

	const onChange = ( edits ) => {
		const { settings, credentials: credentialEdits } =
			splitCredentialEdits( edits );
		if ( Object.keys( credentialEdits ).length > 0 ) {
			setCredentials( ( prev ) => {
				const next = { ...prev };
				for ( const [ slug, values ] of Object.entries(
					credentialEdits
				) ) {
					next[ slug ] = { ...prev[ slug ], ...values };
				}
				return next;
			} );
		}
		if ( Object.keys( settings ).length > 0 ) {
			editEntityRecord( 'root', 'site', undefined, settings );
		}
	};

	const onPurge = async () => {
		setIsPurging( true );
		try {
			await apiFetch( {
				path: '/elio/v1/cache/purge',
				method: 'POST',
			} );
			addNotice( 'success', __( 'Cache purged.', 'elio-blocks' ) );
		} catch {
			addNotice( 'error', __( 'Failed to purge cache.', 'elio-blocks' ) );
		} finally {
			setIsPurging( false );
		}
	};

	if ( ! data ) {
		return null;
	}

	return (
		<Page
			visual={ elioLogo }
			title={ __( 'Elio Blocks', 'elio-blocks' ) }
			subTitle={ __(
				'Site-wide defaults for the weather blocks.',
				'elio-blocks'
			) }
			actions={
				<HStack spacing={ 3 }>
					<Button
						variant="secondary"
						onClick={ onPurge }
						isBusy={ isPurging }
						disabled={
							isPurging || ! formData.elio_blocks_cache_enabled
						}
						accessibleWhenDisabled
					>
						{ __( 'Purge Cache', 'elio-blocks' ) }
					</Button>
					<Button
						variant="primary"
						onClick={ onSave }
						isBusy={ isSaving }
						disabled={ isSaving || ! canSave }
						accessibleWhenDisabled
					>
						{ __( 'Save Settings', 'elio-blocks' ) }
					</Button>
				</HStack>
			}
			navigation={ navigation }
			components={ { link: SectionLink } }
		>
			<div className="elio-blocks-settings-page__content">
				{ section === 'general' && (
					<DataForm
						data={ formData }
						fields={ generalFields }
						form={ generalForm }
						onChange={ onChange }
					/>
				) }
				{ section === 'weather' && (
					<DataForm
						data={ formData }
						fields={ weatherFields }
						form={ weatherForm }
						onChange={ onChange }
					/>
				) }
				{ section === 'providers' && (
					<DataForm
						data={ providersData }
						fields={ providersFields }
						form={ providersForm }
						onChange={ onChange }
					/>
				) }
				{ section === 'advanced' && (
					<DataForm
						data={ formData }
						fields={ advancedFields }
						form={ advancedForm }
						onChange={ onChange }
					/>
				) }
			</div>
			<SnackbarList
				className="elio-blocks-settings__snackbar"
				notices={ notices }
				onRemove={ ( id ) =>
					setNotices( ( prev ) =>
						prev.filter( ( n ) => n.id !== id )
					)
				}
			/>
		</Page>
	);
}
