/**
 * WMO weather interpretation codes mapped to stable condition slugs.
 *
 * Mirrors ElioBlocks\Weather\Condition\WmoConditionCodes (PHP).
 *
 * @type {Object.<number, string>}
 */
export const WMO_CONDITIONS = {
	0: 'clear_sky',
	1: 'mainly_clear',
	2: 'partly_cloudy',
	3: 'overcast',
	45: 'fog',
	48: 'depositing_rime_fog',
	51: 'light_drizzle',
	53: 'moderate_drizzle',
	55: 'dense_drizzle',
	56: 'light_freezing_drizzle',
	57: 'dense_freezing_drizzle',
	61: 'slight_rain',
	63: 'moderate_rain',
	65: 'heavy_rain',
	66: 'light_freezing_rain',
	67: 'heavy_freezing_rain',
	71: 'slight_snowfall',
	73: 'moderate_snowfall',
	75: 'heavy_snowfall',
	77: 'snow_grains',
	80: 'slight_rain_showers',
	81: 'moderate_rain_showers',
	82: 'violent_rain_showers',
	85: 'slight_snow_showers',
	86: 'heavy_snow_showers',
	95: 'thunderstorm',
	96: 'thunderstorm_with_slight_hail',
	99: 'thunderstorm_with_heavy_hail',
};
