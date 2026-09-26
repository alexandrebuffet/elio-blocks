/**
 * WordPress dependencies
 */
import {
	useBlockProps,
	useInnerBlocksProps,
	InspectorControls,
} from '@wordpress/block-editor';
import { PanelBody, RangeControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

const DEFAULT_TEMPLATE = [
	[
		'elio/forecast-template',
		{},
		[
			[ 'elio/datetime' ],
			[ 'elio/condition-icon' ],
			[ 'elio/temperature' ],
		],
	],
];

/**
 * Renders the Forecast block in the editor.
 *
 * @param {Object}                       props               Block props.
 * @param {Object}                       props.attributes    Block attributes.
 * @param {(attributes: Object) => void} props.setAttributes Set block attributes.
 * @return {Element} Element to render.
 */
export default function ForecastEdit( { attributes, setAttributes } ) {
	const { type, count } = attributes;

	const blockProps = useBlockProps();
	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		template: DEFAULT_TEMPLATE,
		templateLock: false,
	} );

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Forecast settings', 'elio-blocks' ) }>
					<RangeControl
						label={ __( 'Number of items', 'elio-blocks' ) }
						value={ count }
						onChange={ ( value ) =>
							setAttributes( { count: value } )
						}
						min={ 1 }
						max={ type === 'daily' ? 16 : 48 }
					/>
				</PanelBody>
			</InspectorControls>
			<div { ...innerBlocksProps } />
		</>
	);
}
