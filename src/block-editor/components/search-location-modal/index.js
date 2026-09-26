/**
 * WordPress dependencies
 */
import { __, sprintf, _n } from '@wordpress/i18n';
import { useState, useEffect, useCallback } from '@wordpress/element';
import {
	Modal,
	Spinner,
	SearchControl,
	Notice,
	Button,
	BaseControl,
	Flex,
	FlexItem,
	__experimentalItemGroup as ItemGroup,
	__experimentalItem as Item,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	__experimentalText as Text,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import { formatCoordinates } from '../../utils/format-coordinates';
import { useLocationSearch } from '../../hooks/use-location-search';

/**
 * Renders the content of a modal searching locations via the geocoding API.
 *
 * Can be used in the report placeholder or by SearchLocationControl. Calls onSelect with
 * { latitude, longitude, name } when user picks a result, and onRequestClose when cancelled.
 *
 * @param {Object}                     props                Component props.
 * @param {boolean}                    props.isOpen         Whether the modal is open.
 * @param {() => void}                 props.onRequestClose Callback when modal should close (e.g. Cancel).
 * @param {(location: Object) => void} props.onSelect       Callback when a location is selected; receives { latitude, longitude, name }.
 * @return {Element} Component element.
 */
export default function SearchLocationModal( {
	isOpen,
	onRequestClose,
	onSelect,
} ) {
	const [ searchQuery, setSearchQuery ] = useState( '' );
	const {
		results: searchResults,
		isSearching,
		error: searchError,
	} = useLocationSearch( searchQuery, { enabled: isOpen } );

	// Start from an empty search each time the modal opens.
	useEffect( () => {
		if ( isOpen ) {
			setSearchQuery( '' );
		}
	}, [ isOpen ] );

	const handleSelectLocation = useCallback(
		( selectedLocation ) => {
			onSelect( {
				latitude: String( selectedLocation.latitude ),
				longitude: String( selectedLocation.longitude ),
				name: selectedLocation.name || undefined,
			} );
			onRequestClose();
		},
		[ onSelect, onRequestClose ]
	);

	const formatShortName = useCallback( ( result ) => result.name || '', [] );
	const formatDetailedAddress = useCallback( ( result ) => {
		const parts = [];
		if ( result.admin1 ) {
			parts.push( result.admin1 );
		}
		if ( result.country ) {
			parts.push( result.country );
		}
		return parts.join( ', ' );
	}, [] );

	if ( ! isOpen ) {
		return null;
	}

	return (
		<Modal
			title={ __( 'Search for a location', 'elio-blocks' ) }
			onRequestClose={ onRequestClose }
			overlayClassName="weather-location-search-modal"
			focusOnMount="firstContentElement"
			size="medium"
		>
			<VStack spacing={ 4 }>
				<Text>
					{ __(
						'Enter a city name, country or postal code.',
						'elio-blocks'
					) }
				</Text>

				<VStack spacing={ 2 }>
					<SearchControl
						value={ searchQuery }
						onChange={ ( value ) => setSearchQuery( value || '' ) }
						placeholder={ __( 'Search', 'elio-blocks' ) }
					/>

					{ isSearching && (
						<HStack justify="center">
							<Spinner />
						</HStack>
					) }

					{ searchError && (
						<Notice status="error" isDismissible={ false }>
							{ searchError }
						</Notice>
					) }

					{ ! isSearching &&
						! searchError &&
						searchQuery &&
						searchResults.length === 0 && (
							<Text>
								{ __(
									'No results found. Try a different search term.',
									'elio-blocks'
								) }
							</Text>
						) }

					{ ! isSearching &&
						! searchError &&
						searchResults.length > 0 && (
							<VStack spacing={ 1 }>
								<BaseControl.VisualLabel className="weather-location-search-modal__results-label">
									{ sprintf(
										/* translators: %d: number of results */
										_n(
											'%d Result',
											'%d Results',
											searchResults.length,
											'elio-blocks'
										),
										searchResults.length
									) }
								</BaseControl.VisualLabel>
								<ItemGroup
									className="weather-location-search-modal__results"
									isBordered
									isSeparated
								>
									{ searchResults.map( ( result, index ) => {
										const shortName =
											formatShortName( result );
										const detailedAddress =
											formatDetailedAddress( result );
										const coordinates =
											formatCoordinates( result );

										return (
											<Item
												className="weather-location-search-modal__result"
												key={ `location-search-result-${ index }` }
												onClick={ () =>
													handleSelectLocation(
														result
													)
												}
											>
												<VStack
													spacing={ 0 }
													alignment="left"
												>
													<Text weight="500" truncate>
														{ shortName }
													</Text>
													{ detailedAddress && (
														<Text
															variant="muted"
															truncate
														>
															{ detailedAddress }
														</Text>
													) }
													{ coordinates && (
														<Text
															variant="muted"
															truncate
														>
															{ coordinates }
														</Text>
													) }
												</VStack>
											</Item>
										);
									} ) }
								</ItemGroup>
							</VStack>
						) }

					<Flex justify="flex-end" expanded={ false }>
						<FlexItem>
							<Button
								variant="tertiary"
								onClick={ onRequestClose }
								__next40pxDefaultSize
							>
								{ __( 'Cancel', 'elio-blocks' ) }
							</Button>
						</FlexItem>
					</Flex>
				</VStack>
			</VStack>
		</Modal>
	);
}
