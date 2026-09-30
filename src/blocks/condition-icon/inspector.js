/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { InspectorControls } from '@wordpress/block-editor';
import {
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
	CheckboxControl,
	RangeControl,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import { useConditionIconCollections } from '../../block-editor/hooks';
import {
	getConditionIconStrokeWidth,
	resolveConditionIconCollection,
} from '../../block-editor/utils';
import IconCollectionControl from '../../block-editor/components/icon-collection-control';

/**
 * Renders the inspector controls of the Condition Icon block.
 *
 * @param {Object}                       props               Component props.
 * @param {Object}                       props.attributes    Block attributes.
 * @param {(attributes: Object) => void} props.setAttributes Function to set block attributes.
 * @param {Object}                       props.context       Block context.
 * @param {boolean}                      props.isStroke      Whether the current icon uses stroke rendering.
 * @return {Element} Inspector controls element.
 */
export default function Inspector( {
	attributes,
	setAttributes,
	context,
	isStroke,
} ) {
	const { isDecorative = false, iconCollection } = attributes;
	const { collections, defaultCollection, isResolving } =
		useConditionIconCollections();
	// What the block shows without a choice of its own: the collection of its report, else the site one.
	const inherited = resolveConditionIconCollection(
		[ context?.[ 'elio/reportIconCollection' ] ],
		isResolving ? null : collections,
		defaultCollection
	);
	const collection = resolveConditionIconCollection(
		[ iconCollection ],
		isResolving ? null : collections,
		inherited
	);
	// Stroke width of the symbol: the one of the block, else the one the icons of the collection are drawn with.
	const strokeWidth =
		attributes.strokeWidth ??
		getConditionIconStrokeWidth( collections, collection );

	return (
		<>
			<InspectorControls>
				<ToolsPanel
					label={ __( 'Settings', 'elio-blocks' ) }
					resetAll={ () =>
						setAttributes( { isDecorative: undefined } )
					}
				>
					<ToolsPanelItem
						label={ __( 'Mark as decorative', 'elio-blocks' ) }
						hasValue={ () => isDecorative !== false }
						onDeselect={ () =>
							setAttributes( { isDecorative: undefined } )
						}
						isShownByDefault
					>
						<CheckboxControl
							__nextHasNoMarginBottom
							label={ __( 'Mark as decorative', 'elio-blocks' ) }
							help={ __(
								'Hidden from assistive technologies.',
								'elio-blocks'
							) }
							checked={ isDecorative }
							onChange={ ( value ) =>
								setAttributes( { isDecorative: value } )
							}
						/>
					</ToolsPanelItem>
				</ToolsPanel>
			</InspectorControls>
			<InspectorControls group="styles">
				<ToolsPanel
					label={ __( 'Collection', 'elio-blocks' ) }
					resetAll={ () =>
						setAttributes( { iconCollection: undefined } )
					}
				>
					<ToolsPanelItem
						label={ __( 'Collection', 'elio-blocks' ) }
						hasValue={ () => !! iconCollection }
						onDeselect={ () =>
							setAttributes( { iconCollection: undefined } )
						}
						isShownByDefault
					>
						<IconCollectionControl
							label={ __( 'Collection', 'elio-blocks' ) }
							collections={ collections }
							value={ collection }
							// The inherited collection is no choice to keep:
							// the block follows its report, or the site.
							onChange={ ( value ) =>
								setAttributes( {
									iconCollection:
										value === inherited ? undefined : value,
								} )
							}
						/>
					</ToolsPanelItem>
				</ToolsPanel>
			</InspectorControls>
			<InspectorControls group="styles">
				<ToolsPanel
					label={ __( 'Symbol', 'elio-blocks' ) }
					resetAll={ () =>
						setAttributes( { strokeWidth: undefined } )
					}
				>
					{ isStroke && (
						<ToolsPanelItem
							label={ __( 'Stroke Width', 'elio-blocks' ) }
							hasValue={ () =>
								attributes.strokeWidth !== undefined
							}
							onDeselect={ () =>
								setAttributes( { strokeWidth: undefined } )
							}
							isShownByDefault
						>
							<RangeControl
								__nextHasNoMarginBottom
								__next40pxDefaultSize
								label={ __( 'Stroke Width', 'elio-blocks' ) }
								value={ strokeWidth }
								onChange={ ( value ) =>
									setAttributes( { strokeWidth: value } )
								}
								min={ 0.5 }
								max={ 5 }
								step={ 0.5 }
							/>
						</ToolsPanelItem>
					) }
				</ToolsPanel>
			</InspectorControls>
		</>
	);
}
