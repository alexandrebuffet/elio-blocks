/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	InspectorControls,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useSelect, useDispatch } from '@wordpress/data';
import {
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
	__experimentalVStack as VStack,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import LocationControl from '../../block-editor/components/location-control';

const REPORT_BLOCK_NAME = 'elio/weather-report';

/**
 * Checks whether a location has coordinates.
 *
 * @param {Object} loc Report location from context.
 * @return {boolean} True when latitude and longitude are finite numbers.
 */
function hasLocationCoordinates( loc ) {
	const lat = Number( loc?.latitude );
	const lng = Number( loc?.longitude );
	return Number.isFinite( lat ) && Number.isFinite( lng );
}

/**
 * Renders the inspector controls of the Location block.
 *
 * @param {Object} props          Component props.
 * @param {string} props.clientId Block client id.
 * @param {Object} props.location Report location from block context.
 * @return {Element} Inspector controls element.
 */
export default function Inspector( { clientId, location = {} } ) {
	const { customName = '' } = location;

	const reportClientId = useSelect(
		( select ) => {
			const parents = select(
				blockEditorStore
			).getBlockParentsByBlockName( clientId, REPORT_BLOCK_NAME );
			return parents?.[ 0 ] ?? null;
		},
		[ clientId ]
	);

	const showLocationControls = Boolean( reportClientId );

	const { updateBlockAttributes } = useDispatch( blockEditorStore );

	const handleLocationChange = ( newLocation ) => {
		if ( ! showLocationControls ) {
			return;
		}
		updateBlockAttributes( reportClientId, {
			location: {
				...newLocation,
				customName: location.customName || undefined,
			},
		} );
	};

	const handleDeselectLocation = () => {
		if ( ! showLocationControls ) {
			return;
		}
		updateBlockAttributes( reportClientId, {
			location: undefined,
		} );
	};

	const handleCustomNameChange = ( newCustomName ) => {
		if ( ! showLocationControls ) {
			return;
		}
		updateBlockAttributes( reportClientId, {
			location: {
				...location,
				customName: newCustomName === '' ? undefined : newCustomName,
			},
		} );
	};

	return (
		<InspectorControls>
			<ToolsPanel
				label={ __( 'Settings', 'elio-blocks' ) }
				resetAll={ () => {
					if ( showLocationControls ) {
						updateBlockAttributes( reportClientId, {
							location: undefined,
						} );
					}
				} }
			>
				{ showLocationControls ? (
					<ToolsPanelItem
						label={ __( 'Location', 'elio-blocks' ) }
						hasValue={ () => hasLocationCoordinates( location ) }
						onDeselect={ handleDeselectLocation }
						isShownByDefault={ true }
					>
						<VStack
							style={ { gridColumn: '1 / -1' } }
							spacing={ 3 }
						>
							<LocationControl
								location={ location }
								customName={ customName }
								onChange={ handleLocationChange }
								onCustomNameChange={ handleCustomNameChange }
							/>
						</VStack>
					</ToolsPanelItem>
				) : null }
			</ToolsPanel>
		</InspectorControls>
	);
}
