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

/**
 * Renders the inspector controls of the Last Updated block.
 *
 * The prefix is shown by default: without it, a time alone does not say what
 * it is the time of.
 *
 * @param {Object}                       props               Component props.
 * @param {Object}                       props.attributes    Block attributes.
 * @param {(attributes: Object) => void} props.setAttributes Function to set block attributes.
 * @return {Element} Inspector controls element.
 */
export default function Inspector( { attributes, setAttributes } ) {
	const { format, showPrefix = true, prefix } = attributes;

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
						defaultFormat={ getDateSettings().formats.time }
						onChange={ ( nextFormat ) =>
							setAttributes( { format: nextFormat } )
						}
					/>
				</ToolsPanelItem>
				<ToolsPanelItem
					label={ __( 'Show Prefix', 'elio-blocks' ) }
					hasValue={ () => ! showPrefix || prefix !== undefined }
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
