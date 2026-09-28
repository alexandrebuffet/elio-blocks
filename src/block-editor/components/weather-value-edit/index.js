/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { RichText, useBlockProps } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { useWeatherReport } from '../../hooks';
import { toText } from '../../../shared/weather-values';

/** @typedef {import('../../../shared/weather-values').WeatherValue} WeatherValue */

/**
 * Renders the edit component of the blocks that show one value of a weather
 * item: an optional prefix, the value, its unit.
 *
 * The item is the row of the surrounding Forecast Template, else the current
 * conditions of the report. Values come from the REST API already converted;
 * the units they are in travel with the weather forecast (meta.units,
 * meta.unit_settings), so labels match what the front shows whatever the site
 * settings are.
 *
 * The markup is the one of the render.php files: a space after the prefix,
 * none before the unit, whose label carries its own separator (a non-breaking
 * space before "km/h", nothing before "°C" or "%"). Each block passes the
 * class names its render.php prints, written in full.
 *
 * @param {Object}                                                                       props                   Component props.
 * @param {string}                                                                       [props.prefixClassName] Class of the prefix ('wp-block-elio-humidity__prefix'). Omit for a block without prefix.
 * @param {string}                                                                       [props.defaultPrefix]   Prefix while the block has none of its own (no prefix attribute). An empty prefix stays empty.
 * @param {string}                                                                       props.valueClassName    Class of the value ('wp-block-elio-humidity__value').
 * @param {string}                                                                       [props.unitClassName]   Class of the unit ('wp-block-elio-humidity__unit'). Goes with getUnit.
 * @param {Object}                                                                       props.context           Block context.
 * @param {Object}                                                                       props.attributes        Block attributes.
 * @param {(attributes: Object) => void}                                                 props.setAttributes     Block attributes setter.
 * @param {boolean}                                                                      props.isSelected        Whether the block is selected.
 * @param {(item: Object, attributes: Object, weatherForecast: Object) => WeatherValue}  props.getValue          Value of the item, or null.
 * @param {(value: WeatherValue, unitsContext: Object) => string}                        [props.getUnit]         Unit label. Omit for unitless values.
 * @param {(value: WeatherValue, attributes: Object, weatherForecast: Object) => string} [props.formatValue]     Text of the value. Defaults to the value as text.
 * @param {string}                                                                       [props.valueTagName]    Element holding the value: 'span', or 'time' for dates.
 * @param {(value: WeatherValue) => Object}                                              [props.getValueProps]   Extra props of that element (e.g. dateTime).
 * @param {string}                                                                       [props.emptyText]       Shown while there is no value (e.g. '—').
 * @param {boolean}                                                                      [props.currentOnly]     Ignore the forecast row: always the current conditions.
 * @param {boolean}                                                                      [props.tabularNums]     Digits of one width (elio-tabular-nums), like the front. False for text.
 * @param {Element}                                                                      [props.inspector]       Inspector controls, rendered when the block is selected.
 * @return {Element} Element to render.
 */
export default function WeatherValueEdit( {
	prefixClassName,
	defaultPrefix = '',
	valueClassName,
	unitClassName,
	context,
	attributes,
	setAttributes,
	isSelected,
	getValue,
	getUnit,
	formatValue = toText,
	valueTagName: ValueTagName = 'span',
	getValueProps,
	emptyText = '',
	currentOnly = false,
	tabularNums = true,
	inspector = null,
} ) {
	const { data } = useWeatherReport( context );
	const row = currentOnly ? null : context?.[ 'elio/forecastItem' ];
	const item = row ?? data?.current ?? null;
	const value = getValue( item, attributes, data ) ?? null;
	const hasValue = value !== null;

	const { showPrefix = false, prefix = defaultPrefix } = attributes;
	const blockProps = useBlockProps( {
		className: tabularNums ? 'elio-tabular-nums' : undefined,
	} );

	return (
		<>
			{ isSelected && inspector }
			<p { ...blockProps }>
				{ showPrefix && (
					<>
						<RichText
							tagName="span"
							className={ prefixClassName }
							allowedFormats={ [] }
							value={ prefix }
							onChange={ ( newPrefix ) =>
								setAttributes( { prefix: newPrefix } )
							}
							placeholder={ __( 'Prefix…', 'elio-blocks' ) }
						/>{ ' ' }
					</>
				) }
				<ValueTagName
					className={ valueClassName }
					{ ...( hasValue && getValueProps?.( value ) ) }
				>
					{ hasValue
						? formatValue( value, attributes, data )
						: emptyText }
				</ValueTagName>
				{ getUnit && (
					<span className={ unitClassName }>
						{ getUnit( value, {
							units: data?.meta?.units,
							unitSettings: data?.meta?.unit_settings,
							showUnit: attributes.showUnit,
							unitFormat: attributes.unitFormat,
						} ) }
					</span>
				) }
			</p>
		</>
	);
}
