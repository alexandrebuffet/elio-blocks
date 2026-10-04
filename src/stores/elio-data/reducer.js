/**
 * Reducer for the elio/data store: weather forecasts by request key, the
 * providers that serve the weather forecast, every provider with its
 * credentials, and the condition icon collections.
 */

const DEFAULT_STATE = {
	weatherForecasts: {},
	weatherForecastProviders: null,
	providers: null,
	// Null until the collections endpoint answers.
	conditionIconCollections: null,
};

export default function reducer( state = DEFAULT_STATE, action ) {
	switch ( action.type ) {
		case 'RECEIVE_WEATHER_FORECAST':
			return {
				...state,
				weatherForecasts: {
					...state.weatherForecasts,
					[ action.key ]: action.weatherForecast,
				},
			};
		case 'RECEIVE_WEATHER_FORECAST_PROVIDERS':
			return {
				...state,
				weatherForecastProviders: action.providers,
			};
		case 'RECEIVE_PROVIDERS':
			return { ...state, providers: action.providers };
		case 'RECEIVE_CONDITION_ICON_COLLECTIONS':
			return { ...state, conditionIconCollections: action.collections };
		default:
			return state;
	}
}
