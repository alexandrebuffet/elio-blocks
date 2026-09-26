/**
 * WordPress dependencies
 */
import { getSettings as getDateSettings } from '@wordpress/date';
import { __ } from '@wordpress/i18n';
import {
	InspectorControls,
	__experimentalDateFormatPicker as DateFormatPicker,
} from '@wordpress/block-editor';
import {
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
	ToggleControl,
} from '@wordpress/components';

export default function Inspector( { attributes, setAttributes } ) {
	const { format = '', showPrefix = false } = attributes;

	const dateSettings = getDateSettings();
	const defaultFormat = dateSettings.formats.time;

	return (
		<InspectorControls>
			<ToolsPanel
				label={ __( 'Settings', 'elio-blocks' ) }
				resetAll={ () =>
					setAttributes( {
						format: undefined,
						showPrefix: undefined,
						prefix: undefined,
					} )
				}
			>
				<ToolsPanelItem
					label={ __( 'Time Format', 'elio-blocks' ) }
					hasValue={ () => format !== undefined }
					onDeselect={ () => setAttributes( { format: undefined } ) }
					isShownByDefault
				>
					<DateFormatPicker
						format={ format }
						defaultFormat={ defaultFormat }
						onChange={ ( nextFormat ) =>
							setAttributes( { format: nextFormat } )
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
						__nextHasNoMarginBottom
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
