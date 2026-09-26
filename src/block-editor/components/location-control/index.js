/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { settings } from '@wordpress/icons';
import {
	BaseControl,
	Button,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import SearchLocationControl from '../search-location-control';
import CustomLocationControls from '../custom-location-controls';

/**
 * Renders SearchLocationControl with a settings button to toggle CustomLocationControls display.
 *
 * @param {Object}                     props                      Component props.
 * @param {string}                     [props.label]              Fieldset label.
 * @param {Object}                     props.location             Current location value { latitude, longitude }.
 * @param {string}                     [props.customName]         Optional custom name override.
 * @param {(location: Object) => void} props.onChange             Callback when location coordinates change.
 * @param {(name: string) => void}     [props.onCustomNameChange] Callback when custom name changes.
 * @param {boolean}                    [props.showCustomName]     Whether to show the custom name field in manual mode (default true).
 * @param {boolean}                    [props.showFieldsetLabel]  Whether to show the fieldset legend above the search / custom rows (default true). A parent ToolsPanelItem only labels the sidebar row; it does not replace this legend for the fields.
 * @param {string}                     [props.help]               Help text under the control.
 * @return {Element} Component element.
 */
export default function LocationControl( {
	label = __( 'Location', 'elio-blocks' ),
	location,
	customName = '',
	onChange,
	onCustomNameChange,
	showCustomName = true,
	showFieldsetLabel = true,
	help = __( 'Search for a location or set a custom one.', 'elio-blocks' ),
} ) {
	const [ showCustomLocation, setShowCustomLocation ] = useState( false );

	return (
		<BaseControl
			className="weather-location-control"
			as="fieldset"
			__nextHasNoMarginBottom
			help={ help }
		>
			<HStack
				className="weather-location-control__header"
				spacing={ 2 }
				justify={ showFieldsetLabel ? 'space-between' : 'flex-end' }
				alignment="center"
			>
				{ showFieldsetLabel ? (
					<BaseControl.VisualLabel
						as="legend"
						className="weather-location-control__label"
					>
						{ label }
					</BaseControl.VisualLabel>
				) : null }
				<Button
					icon={ settings }
					size="small"
					onClick={ () =>
						setShowCustomLocation( ! showCustomLocation )
					}
					aria-label={ __( 'Custom location', 'elio-blocks' ) }
					isPressed={ showCustomLocation }
				/>
			</HStack>
			<VStack className="weather-location-control__content" spacing={ 2 }>
				{ ! showCustomLocation && (
					<SearchLocationControl
						location={ location }
						onChange={ onChange }
					/>
				) }
				{ showCustomLocation && (
					<CustomLocationControls
						location={ location }
						customName={ customName }
						onChange={ onChange }
						onCustomNameChange={ onCustomNameChange }
						showCustomName={ showCustomName }
					/>
				) }
			</VStack>
		</BaseControl>
	);
}
