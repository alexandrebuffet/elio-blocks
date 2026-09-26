/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	TextControl,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
} from '@wordpress/components';
/**
 * Renders manual fields for latitude, longitude, and custom name.
 *
 * The custom name is optional and used for display; coordinates are used for
 * the weather forecast.
 *
 * @param {Object}                     props                      Component props.
 * @param {Object}                     props.location             Location value { latitude, longitude, name }.
 * @param {string}                     props.customName           Optional custom name override.
 * @param {(location: Object) => void} props.onChange             Callback when custom location changes.
 * @param {(name: string) => void}     [props.onCustomNameChange] Callback when custom name changes.
 * @param {boolean}                    [props.showCustomName]     Show the custom name field (default true).
 * @return {Element} Component element.
 */
export default function CustomLocationControls( {
	location = {},
	customName = '',
	onChange,
	onCustomNameChange,
	showCustomName = true,
} ) {
	const { latitude = '', longitude = '', name = '' } = location;

	// Handle custom location coordinates change.
	const handleCustomLocationChange = ( field, newValue ) => {
		onChange( {
			...location,
			[ field ]: newValue,
		} );
	};

	// Handle custom name change.
	const handleCustomNameChange = ( newValue ) => {
		if ( onCustomNameChange ) {
			onCustomNameChange( newValue );
		}
	};

	return (
		<VStack className="weather-custom-location-controls" spacing={ 2 }>
			{ showCustomName && (
				<TextControl
					label={ __( 'Custom Name (optional)', 'elio-blocks' ) }
					help={ __(
						'Override the location name displayed in the block.',
						'elio-blocks'
					) }
					value={ customName || '' }
					placeholder={ name || '' }
					onChange={ handleCustomNameChange }
				/>
			) }
			<HStack className="weather-custom-location-controls" spacing={ 2 }>
				<TextControl
					label={ __( 'Latitude', 'elio-blocks' ) }
					value={ latitude }
					onChange={ ( newValue ) =>
						handleCustomLocationChange( 'latitude', newValue )
					}
					placeholder="48.8566"
					type="number"
					step="any"
				/>
				<TextControl
					label={ __( 'Longitude', 'elio-blocks' ) }
					value={ longitude }
					onChange={ ( newValue ) =>
						handleCustomLocationChange( 'longitude', newValue )
					}
					placeholder="2.3522"
					type="number"
					step="any"
				/>
			</HStack>
		</VStack>
	);
}
