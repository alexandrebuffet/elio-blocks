/**
 * WordPress dependencies
 */
import { __, sprintf, _n } from '@wordpress/i18n';
import { useState, useEffect, useCallback } from '@wordpress/element';
import {
	Modal,
	Spinner,
	Button,
	Flex,
	FlexItem,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	__experimentalText as Text,
} from '@wordpress/components';
import {
	Autocomplete,
	Icon,
	Input,
	InputLayout,
	VisuallyHidden,
} from '@wordpress/ui';
import { search } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { formatCoordinates } from '../../utils/format-coordinates';
import { useLocationSearch } from '../../hooks/use-location-search';

/**
 * Region and country of a result, e.g. "Île-de-France, France".
 *
 * @param {Object} result Geocoding result.
 * @return {string} Detailed address.
 */
function formatDetailedAddress( result ) {
	return [ result.admin1, result.country ].filter( Boolean ).join( ', ' );
}

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

				{ /* The geocoding endpoint has matched the results already: no filter here. */ }
				<Autocomplete.Root
					items={ searchResults }
					value={ searchQuery }
					onValueChange={ setSearchQuery }
					filter={ null }
					itemToStringValue={ ( result ) => result.name }
				>
					<Autocomplete.InputGroup>
						<Autocomplete.Input
							aria-label={ __( 'Search', 'elio-blocks' ) }
							placeholder={ __( 'Search', 'elio-blocks' ) }
							render={
								<Input
									prefix={
										<InputLayout.Slot padding="minimal">
											<Icon icon={ search } />
										</InputLayout.Slot>
									}
									suffix={
										<InputLayout.Slot padding="minimal">
											<Autocomplete.Clear />
										</InputLayout.Slot>
									}
								/>
							}
						/>
					</Autocomplete.InputGroup>
					<Autocomplete.Popup className="weather-location-search-modal__suggestions">
						<Autocomplete.Status>
							{ isSearching && (
								<HStack justify="flex-start" spacing={ 2 }>
									<Spinner />
									<span>
										{ __( 'Searching…', 'elio-blocks' ) }
									</span>
								</HStack>
							) }
							{ ! isSearching && searchResults.length > 0 && (
								<VisuallyHidden>
									{ sprintf(
										/* translators: %d: number of results */
										_n(
											'%d result found.',
											'%d results found.',
											searchResults.length,
											'elio-blocks'
										),
										searchResults.length
									) }
								</VisuallyHidden>
							) }
						</Autocomplete.Status>
						<Autocomplete.Empty>
							{ ! isSearching &&
								searchQuery.trim() &&
								( searchError ||
									__(
										'No results found. Try a different search term.',
										'elio-blocks'
									) ) }
						</Autocomplete.Empty>
						<Autocomplete.List>
							<Autocomplete.ListBody>
								<Autocomplete.Collection>
									{ ( result ) => (
										<Autocomplete.Item
											key={ `${ result.latitude },${ result.longitude }` }
											value={ result }
											onClick={ () =>
												handleSelectLocation( result )
											}
										>
											<VStack
												spacing={ 0 }
												alignment="left"
											>
												<Text weight="500" truncate>
													{ result.name }
												</Text>
												{ formatDetailedAddress(
													result
												) && (
													<Text
														variant="muted"
														truncate
													>
														{ formatDetailedAddress(
															result
														) }
													</Text>
												) }
												<Text variant="muted" truncate>
													{ formatCoordinates(
														result
													) }
												</Text>
											</VStack>
										</Autocomplete.Item>
									) }
								</Autocomplete.Collection>
							</Autocomplete.ListBody>
						</Autocomplete.List>
					</Autocomplete.Popup>
				</Autocomplete.Root>

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
		</Modal>
	);
}
