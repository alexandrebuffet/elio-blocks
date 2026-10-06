/**
 * WordPress dependencies
 */
import {
	Button,
	Icon,
	RangeControl,
	__experimentalNumberControl as NumberControl,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { scheduled, settings as settingsIcon } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';

export const DEFAULT_INTERVAL_PRESETS = [
	{
		label: /* translators: Short label for no duration (zero). */ __(
			'0',
			'elio-blocks'
		),
		value: 0,
	},
	{
		label: /* translators: Short label for a duration of 1 minute. */ __(
			'1m',
			'elio-blocks'
		),
		value: 60,
	},
	{
		label: /* translators: Short label for a duration of 15 minutes. */ __(
			'15m',
			'elio-blocks'
		),
		value: 900,
	},
	{
		label: /* translators: Short label for a duration of 30 minutes. */ __(
			'30m',
			'elio-blocks'
		),
		value: 1800,
	},
	{
		label: /* translators: Short label for a duration of 1 hour. */ __(
			'1h',
			'elio-blocks'
		),
		value: 3600,
	},
	{
		label: /* translators: Short label for a duration of 1 day. */ __(
			'1d',
			'elio-blocks'
		),
		value: 86400,
	},
];

export const CACHE_DURATION_PRESETS = [
	{
		label: /* translators: Short label for a duration of 5 minutes. */ __(
			'5m',
			'elio-blocks'
		),
		value: 300,
	},
	{
		label: /* translators: Short label for a duration of 15 minutes. */ __(
			'15m',
			'elio-blocks'
		),
		value: 900,
	},
	{
		label: /* translators: Short label for a duration of 30 minutes. */ __(
			'30m',
			'elio-blocks'
		),
		value: 1800,
	},
	{
		label: /* translators: Short label for a duration of 1 hour. */ __(
			'1h',
			'elio-blocks'
		),
		value: 3600,
	},
	{
		label: /* translators: Short label for a duration of 6 hours. */ __(
			'6h',
			'elio-blocks'
		),
		value: 21600,
	},
	{
		label: /* translators: Short label for a duration of 12 hours. */ __(
			'12h',
			'elio-blocks'
		),
		value: 43200,
	},
	{
		label: /* translators: Short label for a duration of 1 day. */ __(
			'1d',
			'elio-blocks'
		),
		value: 86400,
	},
];

/**
 * Renders a duration picker combining a preset range slider and an optional number input.
 *
 * Shows a clock icon + preset slider when in preset mode, or a number input +
 * continuous slider in custom mode. Includes an optional label row with a Reset
 * button (à la BoxControl) that sets the value back to `resetValue`, shown only
 * when the value differs from it.
 *
 * @param {Object}                            props
 * @param {string}                            [props.label]      Label shown above the control.
 * @param {string}                            [props.help]       Help text shown below the control.
 * @param {number}                            [props.value]      Current value in seconds. `undefined` = unset.
 * @param {(value: number|undefined) => void} props.onChange     Called with the new value.
 * @param {Array}                             [props.presets]    Array of preset objects: { label, value, markTooltip? }. Optional markTooltip overrides the slider mark tooltip; otherwise label is used.
 * @param {number}                            [props.resetValue] Value Reset restores, and for which Reset is hidden: the default of a setting always given a value. `undefined` = unset.
 */
export default function IntervalControl( {
	label,
	help,
	value,
	onChange,
	presets = DEFAULT_INTERVAL_PRESETS,
	resetValue,
} ) {
	const marks = presets.map( ( preset, index ) => ( {
		value: index,
		label: '',
		tooltip: preset.markTooltip ?? preset.label,
	} ) );

	// When unset, treat as 0 for slider position calculations only.
	const effectiveValue = value ?? 0;
	const presetIndex = presets.findIndex(
		( p ) => p.value === effectiveValue
	);
	// isCustom is only true when a value is explicitly set and doesn't match any preset.
	const isCustom = value !== undefined && presetIndex === -1;
	const [ showCustom, setShowCustom ] = useState( isCustom );

	const handleReset = () => {
		onChange( resetValue );
		setShowCustom( false );
	};

	const handleCustomToggle = () => {
		const next = ! showCustom;
		setShowCustom( next );
		// Leaving custom mode with a non-preset value → reset.
		if ( ! next && isCustom ) {
			onChange( resetValue );
		}
	};

	const sliderPresetIndex = presetIndex >= 0 ? presetIndex : 0;

	return (
		<VStack spacing={ 2 }>
			{ label && (
				<HStack justify="space-between" alignment="center">
					<span className="elio-interval-control__label">
						{ label }
					</span>
					{ value !== resetValue && (
						<Button
							size="small"
							variant="tertiary"
							onClick={ handleReset }
						>
							{ __( 'Reset', 'elio-blocks' ) }
						</Button>
					) }
				</HStack>
			) }
			<HStack spacing={ 3 } alignment="center">
				{ showCustom ? (
					<NumberControl
						hideLabelFromVision
						label={ __( 'Duration (seconds)', 'elio-blocks' ) }
						value={ effectiveValue }
						min={ 0 }
						step={ 1 }
						className="elio-interval-control__seconds"
						onChange={ ( v ) =>
							onChange( v ? parseInt( v, 10 ) : 0 )
						}
					/>
				) : (
					<Icon icon={ scheduled } />
				) }
				<div className="elio-interval-control__slider">
					{ showCustom ? (
						<RangeControl
							hideLabelFromVision
							label={ __( 'Duration', 'elio-blocks' ) }
							value={ effectiveValue }
							min={ 0 }
							max={ 86400 }
							step={ 1 }
							withInputField={ false }
							onChange={ ( v ) => onChange( v ?? 0 ) }
						/>
					) : (
						<RangeControl
							hideLabelFromVision
							label={ __( 'Duration', 'elio-blocks' ) }
							value={ sliderPresetIndex }
							min={ 0 }
							max={ marks.length - 1 }
							marks={ marks }
							step={ 1 }
							withInputField={ false }
							renderTooltipContent={ ( index ) =>
								presets[ index ]?.markTooltip ??
								presets[ index ]?.label ??
								''
							}
							onChange={ ( index ) => {
								if (
									index !== undefined &&
									presets[ index ] !== undefined
								) {
									onChange( presets[ index ].value );
								}
							} }
						/>
					) }
				</div>
				<Button
					icon={ settingsIcon }
					isPressed={ showCustom }
					size="small"
					label={ __( 'Custom value', 'elio-blocks' ) }
					onClick={ handleCustomToggle }
				/>
			</HStack>
			{ help && <p className="elio-interval-control__help">{ help }</p> }
		</VStack>
	);
}
