/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { InspectorControls } from '@wordpress/block-editor';
import {
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
	ToggleControl,
} from '@wordpress/components';

/**
 * Renders the inspector panel of the blocks whose only setting is an optional text prefix.
 *
 * @param {Object}                       props               Component props.
 * @param {Object}                       props.attributes    Block attributes (showPrefix, prefix).
 * @param {(attributes: Object) => void} props.setAttributes Block attributes setter.
 * @return {Element} Inspector controls.
 */
export default function PrefixSettingsPanel( { attributes, setAttributes } ) {
	const { showPrefix = false } = attributes;
	const reset = () =>
		setAttributes( { showPrefix: undefined, prefix: undefined } );

	return (
		<InspectorControls>
			<ToolsPanel
				label={ __( 'Settings', 'elio-blocks' ) }
				resetAll={ reset }
			>
				<ToolsPanelItem
					label={ __( 'Show Prefix', 'elio-blocks' ) }
					hasValue={ () => showPrefix }
					onDeselect={ reset }
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
