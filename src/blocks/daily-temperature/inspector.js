import { __ } from '@wordpress/i18n';
import { InspectorControls } from '@wordpress/block-editor';
import {
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
	SelectControl,
	ToggleControl,
} from '@wordpress/components';

const UNIT_FORMAT_OPTIONS = [
	{ label: __( 'Default', 'elio-blocks' ), value: '' },
	{
		label: __( 'Degree symbol only (°)', 'elio-blocks' ),
		value: 'degree-symbol',
	},
	{ label: __( 'Full (°C / °F)', 'elio-blocks' ), value: 'full' },
];

export default function Inspector( { attributes, setAttributes } ) {
	const { showUnit = true, unitFormat = '', showPrefix = false } = attributes;

	return (
		<InspectorControls>
			<ToolsPanel
				label={ __( 'Settings', 'elio-blocks' ) }
				resetAll={ () =>
					setAttributes( {
						showUnit: undefined,
						unitFormat: undefined,
						showPrefix: undefined,
						prefix: undefined,
					} )
				}
			>
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
						options={ UNIT_FORMAT_OPTIONS }
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
