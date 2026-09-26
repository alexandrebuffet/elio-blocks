/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { InspectorControls } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import {
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
	SelectControl,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import LocationControl from '../../block-editor/components/location-control';
import { store as elioDataStore } from '../../stores/elio-data';
import { getProviderOptions } from './provider-options';
import { useConditionIconCollections } from '../../block-editor/hooks';
import { resolveConditionIconCollection } from '../../block-editor/utils';
import IconCollectionControl from '../../block-editor/components/icon-collection-control';

const HTML_ELEMENT_OPTIONS = [
	{ label: __( 'Default (<section>)', 'elio-blocks' ), value: 'section' },
	{ label: '<article>', value: 'article' },
	{ label: '<div>', value: 'div' },
];

/**
 * Renders the inspector controls of the Report block.
 *
 * @param {Object}                       props               Component props.
 * @param {Object}                       props.attributes    Block attributes.
 * @param {(attributes: Object) => void} props.setAttributes Function to set block attributes.
 * @return {Element} Inspector controls element.
 */
export default function Inspector( { attributes, setAttributes } ) {
	const {
		provider = '',
		units = '',
		location = {},
		tagName = 'section',
		iconCollection,
	} = attributes;
	const { customName = '' } = location;
	const providers = useSelect(
		( select ) => select( elioDataStore ).getWeatherForecastProviders(),
		[]
	);
	const { collections, defaultCollection, isResolving } =
		useConditionIconCollections();
	const collection = resolveConditionIconCollection(
		[ iconCollection ],
		isResolving ? null : collections,
		defaultCollection
	);

	const handleLocationChange = ( newLocation ) => {
		setAttributes( {
			location: {
				...newLocation,
				customName: location.customName || undefined,
			},
		} );
	};

	const handleCustomNameChange = ( newCustomName ) => {
		setAttributes( {
			location: {
				...location,
				customName: newCustomName === '' ? undefined : newCustomName,
			},
		} );
	};

	const handleProviderChange = ( newProvider ) => {
		setAttributes( {
			provider: newProvider === '' ? undefined : newProvider,
		} );
	};

	const handleUnitsChange = ( newUnits ) => {
		setAttributes( {
			units: newUnits === '' ? undefined : newUnits,
		} );
	};

	return (
		<>
			<InspectorControls group="advanced">
				<SelectControl
					__next40pxDefaultSize
					label={ __( 'HTML element', 'elio-blocks' ) }
					options={ HTML_ELEMENT_OPTIONS }
					value={ tagName }
					onChange={ ( value ) =>
						setAttributes( { tagName: value } )
					}
				/>
			</InspectorControls>
			<InspectorControls>
				<ToolsPanel
					label={ __( 'Settings', 'elio-blocks' ) }
					resetAll={ () =>
						setAttributes( {
							location: undefined,
							provider: undefined,
							units: undefined,
						} )
					}
				>
					<ToolsPanelItem
						label={ __( 'Location', 'elio-blocks' ) }
						hasValue={ () => !! location?.latitude }
						isShownByDefault={ true }
						onDeselect={ () =>
							setAttributes( { location: undefined } )
						}
					>
						<LocationControl
							location={ location }
							customName={ customName }
							onChange={ handleLocationChange }
							onCustomNameChange={ handleCustomNameChange }
						/>
					</ToolsPanelItem>
					<ToolsPanelItem
						label={ __( 'Provider', 'elio-blocks' ) }
						hasValue={ () => !! provider }
						isShownByDefault={ false }
						onDeselect={ () =>
							setAttributes( { provider: undefined } )
						}
					>
						<SelectControl
							label={ __( 'Provider', 'elio-blocks' ) }
							value={ provider }
							options={ getProviderOptions(
								providers,
								provider
							) }
							onChange={ handleProviderChange }
						/>
					</ToolsPanelItem>
					<ToolsPanelItem
						label={ __( 'Unit System', 'elio-blocks' ) }
						hasValue={ () => !! units }
						isShownByDefault={ false }
						onDeselect={ () =>
							setAttributes( { units: undefined } )
						}
					>
						<SelectControl
							label={ __( 'Unit System', 'elio-blocks' ) }
							help={ __(
								'Overrides the global unit system for this block. By default, the International System of Units (SI / metric) is used.',
								'elio-blocks'
							) }
							value={ units }
							options={ [
								{
									label: __( 'Default', 'elio-blocks' ),
									value: '',
								},
								{
									label: __(
										'Metric (°C, km/h…)',
										'elio-blocks'
									),
									value: 'metric',
								},
								{
									label: __(
										'Imperial (°F, mph…)',
										'elio-blocks'
									),
									value: 'imperial',
								},
							] }
							onChange={ handleUnitsChange }
						/>
					</ToolsPanelItem>
				</ToolsPanel>
			</InspectorControls>
			<InspectorControls group="styles">
				<ToolsPanel
					label={ __( 'Icons Collection', 'elio-blocks' ) }
					resetAll={ () =>
						setAttributes( { iconCollection: undefined } )
					}
				>
					<ToolsPanelItem
						label={ __( 'Collection', 'elio-blocks' ) }
						hasValue={ () => !! iconCollection }
						isShownByDefault
						onDeselect={ () =>
							setAttributes( { iconCollection: undefined } )
						}
					>
						<IconCollectionControl
							label={ __( 'Icons Collection', 'elio-blocks' ) }
							collections={ collections }
							value={ collection }
							// The site collection is no choice to keep: the
							// block follows the site setting.
							onChange={ ( value ) =>
								setAttributes( {
									iconCollection:
										value === defaultCollection
											? undefined
											: value,
								} )
							}
						/>
					</ToolsPanelItem>
				</ToolsPanel>
			</InspectorControls>
		</>
	);
}
