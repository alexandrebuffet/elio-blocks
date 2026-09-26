/**
 * What a weather value looks like on screen: its text and its unit label.
 *
 * One definition for the front (view scripts), the editor (edit components)
 * and, mirrored in PHP, the server-rendered HTML
 * (ElioBlocks\Interactivity\Blocks\Report\DerivedState). A label never converts
 * anything: values arrive in their final unit, this only names it.
 */

const NBSP = ' ';

const CARDINALS = [ 'N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW' ];

const DAILY_TEMPERATURE_FIELDS = {
	min: 'temperature_min',
	max: 'temperature_max',
	'feels-like-min': 'temperature_feels_like_min',
	'feels-like-max': 'temperature_feels_like_max',
};

const HOURLY_TEMPERATURE_FIELDS = {
	temperature: 'temperature',
	'feels-like': 'temperature_feels_like',
};

const WIND_LABELS = {
	kmh: 'km/h',
	mph: 'mph',
	ms: 'm/s',
	knots: 'kt',
	beaufort: 'Bft',
};

const PRESSURE_LABELS = { hpa: 'hPa', inhg: 'inHg', mbar: 'mbar' };

/**
 * @typedef {Object} UnitsContext
 * @property {string}  [units]        Unit system: 'metric' or 'imperial'.
 * @property {Object}  [unitSettings] Per-domain overrides (temperature, wind, precipitation, pressure). Empty: follow the unit system.
 * @property {boolean} [showUnit]     Temperature blocks: whether to show the unit.
 * @property {string}  [unitFormat]   Temperature blocks: 'degree-symbol' for a bare °.
 */

/**
 * Value of a weather item field: a number, a date-time or a description; null
 * or undefined when the provider has none.
 *
 * @typedef {number|string|null|undefined} WeatherValue
 */

/**
 * Tells whether there is a value to show. 0 is one.
 *
 * @param {WeatherValue} value Value of a weather item field.
 * @return {boolean} False for null and undefined.
 */
function hasValue( value ) {
	return value !== null && value !== undefined;
}

/**
 * Resolves the unit the values of a domain are in: the override, else the preset of the unit system.
 *
 * @param {string}       domain   'temperature', 'wind', 'precipitation' or 'pressure'.
 * @param {UnitsContext} context  Units context.
 * @param {string}       metric   Unit of the metric preset.
 * @param {string}       imperial Unit of the imperial preset.
 * @return {string} Unit slug.
 */
function resolveUnit( domain, context, metric, imperial ) {
	return (
		context?.unitSettings?.[ domain ] ||
		( context?.units === 'imperial' ? imperial : metric )
	);
}

/**
 * Returns a weather value as text.
 *
 * @param {WeatherValue} value Value of a weather item field.
 * @return {string} The value as text, empty when there is none.
 */
export function toText( value ) {
	return hasValue( value ) ? String( value ) : '';
}

/**
 * Returns the percent label of a value.
 *
 * @param {WeatherValue} value Value the label goes with.
 * @return {string} '%', or nothing without a value.
 */
export function percentLabel( value ) {
	return hasValue( value ) ? '%' : '';
}

/**
 * Returns the unit label of a temperature.
 *
 * @param {WeatherValue} value   Temperature the label goes with.
 * @param {UnitsContext} context Units context.
 * @return {string} '°C', '°F', '°', or nothing.
 */
export function temperatureUnitLabel( value, context = {} ) {
	if ( ! hasValue( value ) || context.showUnit === false ) {
		return '';
	}

	if ( context.unitFormat === 'degree-symbol' ) {
		return '°';
	}

	return resolveUnit( 'temperature', context, 'celsius', 'fahrenheit' ) ===
		'fahrenheit'
		? '°F'
		: '°C';
}

/**
 * Returns the unit label of a wind speed.
 *
 * @param {WeatherValue} value   Wind speed the label goes with.
 * @param {UnitsContext} context Units context.
 * @return {string} Unit label with a leading non-breaking space, or nothing.
 */
export function windUnitLabel( value, context = {} ) {
	if ( ! hasValue( value ) ) {
		return '';
	}

	const unit = resolveUnit( 'wind', context, 'kmh', 'mph' );

	return NBSP + ( WIND_LABELS[ unit ] ?? WIND_LABELS.kmh );
}

/**
 * Returns the unit label of a pressure.
 *
 * @param {WeatherValue} value   Pressure the label goes with.
 * @param {UnitsContext} context Units context.
 * @return {string} Unit label with a leading non-breaking space, or nothing.
 */
export function pressureUnitLabel( value, context = {} ) {
	if ( ! hasValue( value ) ) {
		return '';
	}

	// Both unit systems report hPa unless an override says otherwise.
	const unit = resolveUnit( 'pressure', context, 'hpa', 'hpa' );

	return NBSP + ( PRESSURE_LABELS[ unit ] ?? PRESSURE_LABELS.hpa );
}

/**
 * Returns the unit label of a precipitation amount.
 *
 * @param {WeatherValue} value   Precipitation the label goes with.
 * @param {UnitsContext} context Units context.
 * @return {string} Unit label with a leading non-breaking space, or nothing.
 */
export function precipitationUnitLabel( value, context = {} ) {
	if ( ! hasValue( value ) ) {
		return '';
	}

	return (
		NBSP +
		( resolveUnit( 'precipitation', context, 'mm', 'in' ) === 'in'
			? 'in'
			: 'mm' )
	);
}

/**
 * Returns a wind direction as text: in degrees or as a cardinal point.
 *
 * @param {number|null} degrees Wind direction in degrees.
 * @param {string}      format  'degrees' for "225°", anything else for a cardinal point.
 * @return {string} Direction as text, empty without a value.
 */
export function windDirectionText( degrees, format = '' ) {
	if ( ! hasValue( degrees ) ) {
		return '';
	}

	return format === 'degrees'
		? `${ degrees }°`
		: CARDINALS[ Math.round( degrees / 45 ) % 8 ];
}

/**
 * Returns the wind speed or gusts of a weather item.
 *
 * @param {Object|null} item        Weather item.
 * @param {string}      displayType 'gusts' for gusts, anything else for the speed.
 * @return {number|null} Wind speed or gusts.
 */
export function getWindSpeed( item, displayType = '' ) {
	return (
		( displayType === 'gusts' ? item?.wind_gusts : item?.wind_speed ) ??
		null
	);
}

/**
 * Returns the UV index of a weather item.
 *
 * @param {Object|null} item Weather item. Daily items only have a maximum.
 * @return {number|null} UV index.
 */
export function getUvIndex( item ) {
	return item?.uv_index ?? item?.uv_index_max ?? null;
}

/**
 * Returns a temperature of a daily item: its minimum, maximum or a feels-like one.
 *
 * @param {Object|null} item        Daily item.
 * @param {string}      displayType 'min', 'max', 'feels-like-min' or 'feels-like-max'.
 * @return {number|null} Temperature.
 */
export function getDailyTemperature( item, displayType = 'min' ) {
	return (
		item?.[
			DAILY_TEMPERATURE_FIELDS[ displayType ] ??
				DAILY_TEMPERATURE_FIELDS.min
		] ?? null
	);
}

/**
 * Returns the temperature of an hourly item, or its feels-like one.
 *
 * @param {Object|null} item        Hourly item (or the current conditions).
 * @param {string}      displayType 'temperature' or 'feels-like'.
 * @return {number|null} Temperature.
 */
export function getHourlyTemperature( item, displayType = 'temperature' ) {
	return (
		item?.[
			HOURLY_TEMPERATURE_FIELDS[ displayType ] ??
				HOURLY_TEMPERATURE_FIELDS.temperature
		] ?? null
	);
}
