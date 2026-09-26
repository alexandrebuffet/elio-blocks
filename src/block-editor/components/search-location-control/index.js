/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useCallback, useMemo } from '@wordpress/element';
import {
	Button,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	__experimentalText as Text,
} from '@wordpress/components';
import { pencil } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { formatCoordinates } from '../../utils/format-coordinates';
import SearchLocationModal from '../search-location-modal';

/**
 * Renders a search interface for finding locations via the shared SearchLocationModal.
 *
 * Shows a "Search a location" button when empty, or a preview + edit button when a location is set.
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
				<HStack
					className="weather-search-location-control__preview-button"
					spacing={ 2 }
					alignment="center"
					justify="space-between"
				>
					<VStack
						as="span"
						className="weather-search-location-control__preview-content"
						spacing={ 0 }
						alignment="left"
						expanded={ false }
					>
						{ displayName ? (
							<Text
								className="weather-search-location-control__preview-name"
								weight="500"
								truncate
							>
								{ displayName }
							</Text>
						) : (
							<Text
								className="weather-search-location-control__preview-name"
								weight="500"
								truncate
							>
								{ locationCoordinatesText }
							</Text>
						) }
						{ locationCoordinatesText && (
							<Text
								className="weather-search-location-control__preview-coordinates"
								variant="muted"
							>
								{ locationCoordinatesText }
							</Text>
						) }
					</VStack>
					<Button
						className="weather-search-location-control__edit-button"
						label={ __( 'Edit location', 'elio-blocks' ) }
						icon={ pencil }
						size="small"
						onClick={ handleOpenModal }
					/>
				</HStack>
			) }

			<SearchLocationModal
				isOpen={ isModalOpen }
				onRequestClose={ handleCloseModal }
				onSelect={ handleSelectLocation }
			/>
		</div>
	);
}
