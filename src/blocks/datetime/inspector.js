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
	TextControl,
	ToggleControl,
} from '@wordpress/components';

/**
 * Renders the inspector controls of the Datetime block.
 *
 * @param {Object}                       props               Component props.
 * @param {Object}                       props.attributes    Block attributes.
 * @param {(attributes: Object) => void} props.setAttributes Function to set block attributes.
 * @return {Element} Inspector controls element.
 */
export default function Inspector( { attributes, setAttributes } ) {
	const {
		displayType = '',
		format = '',
		currentAsLabel = false,
		todayLabel = '',
		nowLabel = '',
		showPrefix = false,
	} = attributes;

	const isTime = displayType === 'time';

	const dateSettings = getDateSettings();
	const defaultFormat = isTime
		? dateSettings.formats.time
		: dateSettings.formats.date;

	return (
		<InspectorControls>
			<ToolsPanel
				label={ __( 'Settings', 'elio-blocks' ) }
				resetAll={ () =>
					setAttributes( {
						format: undefined,
						currentAsLabel: undefined,
						todayLabel: undefined,
						nowLabel: undefined,
						showPrefix: undefined,
						prefix: undefined,
					} )
				}
			>
				<ToolsPanelItem
					label={
						isTime
							? __( 'Time Format', 'elio-blocks' )
							: __( 'Date Format', 'elio-blocks' )
					}
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
					label={ __( 'Current period as label', 'elio-blocks' ) }
					hasValue={ () => currentAsLabel === true }
					onDeselect={ () =>
						setAttributes( { currentAsLabel: undefined } )
					}
				>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Current period as label', 'elio-blocks' ) }
						help={
							isTime
								? __(
										'Shows "Now" for the current hour.',
										'elio-blocks'
									)
								: __(
										'Shows "Today" for today\'s date.',
										'elio-blocks'
									)
						}
						checked={ currentAsLabel }
						onChange={ ( value ) =>
							setAttributes( { currentAsLabel: value } )
						}
					/>
				</ToolsPanelItem>
				{ currentAsLabel && (
					<ToolsPanelItem
						label={
							isTime
								? __( 'Now label', 'elio-blocks' )
								: __( 'Today label', 'elio-blocks' )
						}
						hasValue={ () =>
							isTime ? nowLabel !== '' : todayLabel !== ''
						}
						onDeselect={ () =>
							setAttributes(
								isTime
									? { nowLabel: undefined }
									: { todayLabel: undefined }
							)
						}
					>
						<TextControl
							__nextHasNoMarginBottom
							__next40pxDefaultSize
							label={
								isTime
									? __( 'Now label', 'elio-blocks' )
									: __( 'Today label', 'elio-blocks' )
							}
							placeholder={
								isTime
									? __( 'Now', 'elio-blocks' )
									: __( 'Today', 'elio-blocks' )
							}
							value={ isTime ? nowLabel : todayLabel }
							onChange={ ( value ) =>
								setAttributes(
									isTime
										? { nowLabel: value }
										: { todayLabel: value }
								)
							}
						/>
					</ToolsPanelItem>
				) }
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
