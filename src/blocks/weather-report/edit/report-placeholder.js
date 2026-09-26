/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import {
	createBlocksFromInnerBlocksTemplate,
	store as blocksStore,
} from '@wordpress/blocks';
import { useState } from '@wordpress/element';
import {
	store as blockEditorStore,
	__experimentalBlockVariationPicker,
	useBlockProps,
} from '@wordpress/block-editor';
import { Button, Placeholder } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useResizeObserver } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { useReportBlockVariations, REPORT_BLOCK_NAME } from '../utils';
import weather from '../../../icons/components/weather';
import SearchLocationModal from '../../../block-editor/components/search-location-modal';

/**
 * Renders the variation picker for "Start blank" (same pattern as Query's QueryVariationPicker).
 *
 * @param {Object}                      props          Component props.
 * @param {Object}                      props.icon     Block icon.
 * @param {string}                      props.label    Block title.
 * @param {(variation: Object) => void} props.onSelect Applies the picked variation.
 * @return {Element} Element to render.
 */
function ReportVariationPicker( { icon, label, onSelect } ) {
	const variations = useReportBlockVariations();
	const blockProps = useBlockProps();

	return (
		<div { ...blockProps }>
			<__experimentalBlockVariationPicker
				icon={ icon }
				label={ label }
				variations={ variations }
				onSelect={ onSelect }
			/>
		</div>
	);
}

/**
 * Renders the Report block placeholder when it has no inner blocks (same structure as Query's
 * QueryPlaceholder).
 * Primary "Search a location" opens the location search modal; "Start blank" shows variation picker.
 *
 * @param {Object}                       props               Component props.
 * @param {string}                       props.clientId      Report block clientId.
 * @param {Object}                       props.attributes    Report block attributes.
 * @param {(attributes: Object) => void} props.setAttributes Block attributes setter.
 * @param {string}                       props.name          Block name.
 * @return {Element} Element to render.
 */
export default function ReportPlaceholder( {
	clientId,
	attributes,
	setAttributes,
	name = REPORT_BLOCK_NAME,
} ) {
	const [ isStartingBlank, setIsStartingBlank ] = useState( false );
	const [ isSearchModalOpen, setIsSearchModalOpen ] = useState( false );
	const [ containerWidth, setContainerWidth ] = useState( 0 );

	const resizeObserverRef = useResizeObserver( ( [ entry ] ) => {
		setContainerWidth( entry?.contentRect?.width ?? 0 );
	} );

	const SMALL_CONTAINER_BREAKPOINT = 160;
	const isSmallContainer =
		containerWidth > 0 && containerWidth < SMALL_CONTAINER_BREAKPOINT;

	const { blockType, activeBlockVariation, blockVariations } = useSelect(
		( select ) => {
			const {
				getActiveBlockVariation,
				getBlockType,
				getBlockVariations,
			} = select( blocksStore );
			return {
				blockType: getBlockType( name ),
				activeBlockVariation: getActiveBlockVariation(
					name,
					attributes
				),
				blockVariations: getBlockVariations( name, 'block' ) || [],
			};
		},
		[ name, attributes ]
	);

	const { replaceInnerBlocks } = useDispatch( blockEditorStore );
	const defaultVariation = blockVariations?.[ 0 ];

	const icon =
		activeBlockVariation?.icon?.src ||
		activeBlockVariation?.icon ||
		blockType?.icon?.src ||
		weather;
	const label = activeBlockVariation?.title || blockType?.title;
	const blockProps = useBlockProps( { ref: resizeObserverRef } );
	const { location = {} } = attributes;

	// The attributes of a variation are part of its layout, as its icon shows:
	// Minimal puts the icon and the temperature in a centered row.
	const applyVariation = ( variation ) => {
		if ( variation?.attributes ) {
			setAttributes( variation.attributes );
		}
		if ( variation?.innerBlocks?.length ) {
			replaceInnerBlocks(
				clientId,
				createBlocksFromInnerBlocksTemplate( variation.innerBlocks ),
				false
			);
		}
	};

	const handleSelectLocation = ( selectedLocation ) => {
		setAttributes( {
			location: {
				...location,
				latitude: selectedLocation.latitude,
				longitude: selectedLocation.longitude,
				name: selectedLocation.name,
			},
		} );
		setIsSearchModalOpen( false );
		// Apply the first (default) variation so the block shows content immediately.
		applyVariation( defaultVariation );
	};

	if ( isStartingBlank ) {
		return (
			<ReportVariationPicker
				icon={ icon }
				label={ label }
				onSelect={ applyVariation }
			/>
		);
	}

	return (
		<div { ...blockProps }>
			<Placeholder
				className="wp-block-elio-report-placeholder block-editor-media-placeholder"
				icon={ ! isSmallContainer && icon }
				label={ ! isSmallContainer && label }
				instructions={
					! isSmallContainer &&
					__( 'Search a location or start blank.', 'elio-blocks' )
				}
				withIllustration={ isSmallContainer }
			>
				{ ! isSmallContainer && (
					<>
						<Button
							variant="primary"
							onClick={ () => setIsSearchModalOpen( true ) }
							__next40pxDefaultSize
						>
							{ __( 'Search a location', 'elio-blocks' ) }
						</Button>
						<Button
							variant="secondary"
							onClick={ () => setIsStartingBlank( true ) }
							__next40pxDefaultSize
						>
							{ __( 'Start blank', 'elio-blocks' ) }
						</Button>
					</>
				) }
			</Placeholder>
			<SearchLocationModal
				isOpen={ isSearchModalOpen }
				onRequestClose={ () => setIsSearchModalOpen( false ) }
				onSelect={ handleSelectLocation }
			/>
		</div>
	);
}
