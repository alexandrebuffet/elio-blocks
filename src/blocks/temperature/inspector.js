/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	InspectorControls,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import {
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
	__experimentalVStack as VStack,
	Notice,
	SelectControl,
	ToggleControl,
} from '@wordpress/components';

const TEMPERATURE_UNIT_FORMAT_OPTIONS = [
	{ label: __( 'Default', 'elio-blocks' ), value: '' },
	{
		label: __( 'Degree symbol only (°)', 'elio-blocks' ),
		value: 'degree-symbol',
	},
	{ label: __( 'Full (°C / °F)', 'elio-blocks' ), value: 'full' },
];

/**
 * Renders the inspector controls of the Temperature block.
 *
 * @param {Object}                       props               Component props.
 * @param {string}                       props.clientId      Block client ID.
 * @param {Object}                       props.attributes    Block attributes.
 * @param {(attributes: Object) => void} props.setAttributes Function to set block attributes.
 * @return {Element} Inspector controls element.
 */
export default function Inspector( { clientId, attributes, setAttributes } ) {
	const { unitFormat = '', showUnit = true, showPrefix = false } = attributes;

	const isInForecastTemplate = useSelect(
		( select ) =>
			select( blockEditorStore ).getBlockParentsByBlockName(
				clientId,
				'elio/forecast-template'
			).length > 0,
		[ clientId ]
	);

	return (
		<InspectorControls>
			<ToolsPanel
				label={ __( 'Settings', 'elio-blocks' ) }
				resetAll={ () =>
					setAttributes( {
						unitFormat: undefined,
						showUnit: undefined,
						showPrefix: undefined,
						prefix: undefined,
					} )
				}
			>
				{ isInForecastTemplate && (
					<VStack style={ { gridColumn: '1 / -1' } } spacing={ 0 }>
						<Notice status="warning" isDismissible={ false }>
							{ __(
								'This block always displays current weather conditions. To show temperatures within a weather forecast, use the Daily Temperature or Hourly Temperature block instead.',
								'elio-blocks'
							) }
						</Notice>
					</VStack>
				) }
				<ToolsPanelItem
					label={ __( 'Unit Format', 'elio-blocks' ) }
					hasValue={ () => !! unitFormat }
					onDeselect={ () =>
						setAttributes( { unitFormat: undefined } )
					}
				>
					<SelectControl
						__next40pxDefaultSize
						label={ __( 'Unit Format', 'elio-blocks' ) }
						options={ TEMPERATURE_UNIT_FORMAT_OPTIONS }
						value={ unitFormat }
						onChange={ ( value ) =>
							setAttributes( { unitFormat: value } )
						}
					/>
				</ToolsPanelItem>
				<ToolsPanelItem
					label={ __( 'Show Unit', 'elio-blocks' ) }
					hasValue={ () => ! showUnit }
					onDeselect={ () =>
						setAttributes( { showUnit: undefined } )
					}
				>
					<ToggleControl
						label={ __( 'Show Unit', 'elio-blocks' ) }
						checked={ showUnit }
						onChange={ ( value ) =>
							setAttributes( { showUnit: value } )
						}
					/>
				</ToolsPanelItem>
				<ToolsPanelItem
					label={ __( 'Show Prefix', 'elio-blocks' ) }
					hasValue={ () => showPrefix }
					onDeselect={ () =>
						setAttributes( {
							showPrefix: undefined,
							prefix: undefined,
						} )
					}
					isShownByDefault
				>
					<ToggleControl
						label={ __( 'Show Prefix', 'elio-blocks' ) }
						checked={ showPrefix }
						onChange={ ( value ) =>
							setAttributes( { showPrefix: value } )
						}
					/>
				</ToolsPanelItem>
			</ToolsPanel>
		</InspectorControls>
	);
}
