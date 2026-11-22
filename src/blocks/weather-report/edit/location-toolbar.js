/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { BlockControls } from '@wordpress/block-editor';
import { ToolbarButton } from '@wordpress/components';

/**
 * Internal dependencies
 */
import SearchLocationModal from '../../../block-editor/components/search-location-modal';

/**
 * Renders the toolbar button of the Report block that opens the location
 * search, a text button like the "Replace" of the core Image block.
 *
 * @param {Object}                       props                   Component props.
 * @param {Object}                       props.location          Report location attribute.
 * @param {(attributes: Object) => void} props.setAttributes     Block attributes setter.
 * @param {boolean}                      [props.isInitiallyOpen] Opens the search at once.
 * @param {() => void}                   [props.onClose]         Called when the search closes.
 * @return {Element} Element to render.
 */
export default function LocationToolbar( {
	location = {},
	setAttributes,
	isInitiallyOpen = false,
	onClose = () => {},
} ) {
	const [ isModalOpen, setIsModalOpen ] = useState( isInitiallyOpen );
	const closeModal = () => {
		setIsModalOpen( false );
		onClose();
	};
	const hasLocation = Boolean( location.latitude && location.longitude );

	// Same as the sidebar: a new place keeps the custom name.
	const handleSelect = ( selectedLocation ) => {
		setAttributes( {
			location: {
				...selectedLocation,
				customName: location.customName || undefined,
			},
		} );
	};

	return (
		<>
			<BlockControls group="other">
				<ToolbarButton onClick={ () => setIsModalOpen( true ) }>
					{ hasLocation
						? __( 'Edit location', 'elio-blocks' )
						: __( 'Search a location', 'elio-blocks' ) }
				</ToolbarButton>
			</BlockControls>
			<SearchLocationModal
				isOpen={ isModalOpen }
				onRequestClose={ closeModal }
				onSelect={ handleSelect }
			/>
		</>
	);
}
