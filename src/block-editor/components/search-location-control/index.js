/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useCallback, useMemo } from '@wordpress/element';
import { Button, __experimentalVStack as VStack } from '@wordpress/components';
import { Icon, mapMarker } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { formatCoordinates } from '../../utils/format-coordinates';
import SearchLocationModal from '../search-location-modal';

/**
 * Renders a search interface for finding locations via the shared SearchLocationModal.
 *
 * Shows a "Search a location" button when empty, or the location set as a button opening the search.
 * Used in the sidebar (LocationControl); the report placeholder uses SearchLocationModal directly.
 *
 * @param {Object}                     props          Component props.
 * @param {Object}                     props.location Current location value { latitude, longitude, name }.
 * @param {(location: Object) => void} props.onChange Callback when location changes.
 * @return {Element} Component element.
 */
export default function SearchLocationControl( { location = {}, onChange } ) {
	const { latitude = null, longitude = null, name = null } = location;
	const [ isModalOpen, setIsModalOpen ] = useState( false );

	const displayName = name;
	const locationCoordinatesText = useMemo(
		() => formatCoordinates( { latitude, longitude } ),
		[ latitude, longitude ]
	);
	const hasLocation = latitude && longitude;

	const handleOpenModal = useCallback( () => setIsModalOpen( true ), [] );
	const handleCloseModal = useCallback( () => setIsModalOpen( false ), [] );
	const handleSelectLocation = useCallback(
		( selectedLocation ) => {
			onChange( {
				latitude: selectedLocation.latitude,
				longitude: selectedLocation.longitude,
				name: selectedLocation.name,
			} );
			setIsModalOpen( false );
		},
		[ onChange ]
	);

	return (
		<div className="weather-search-location-control">
			{ ! hasLocation && (
				<Button
					className="weather-search-location-control__toggle"
					variant="secondary"
					onClick={ handleOpenModal }
				>
					{ __( 'Search a location', 'elio-blocks' ) }
				</Button>
			) }

			{ hasLocation && (
				<Button
					__next40pxDefaultSize
					className="weather-search-location-control__preview-button"
					describedBy={ __( 'Edit location', 'elio-blocks' ) }
					onClick={ handleOpenModal }
				>
					<Icon
						className="weather-search-location-control__preview-icon"
						icon={ mapMarker }
					/>
					<VStack
						as="span"
						className="weather-search-location-control__preview-content"
						spacing={ 0 }
						alignment="left"
					>
						<span className="weather-search-location-control__preview-name">
							{ displayName || locationCoordinatesText }
						</span>
						{ displayName && locationCoordinatesText && (
							<span className="weather-search-location-control__preview-coordinates">
								{ locationCoordinatesText }
							</span>
						) }
					</VStack>
				</Button>
			) }

			<SearchLocationModal
				isOpen={ isModalOpen }
				onRequestClose={ handleCloseModal }
				onSelect={ handleSelectLocation }
			/>
		</div>
	);
}
