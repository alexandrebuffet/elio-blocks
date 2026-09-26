/**
 * Internal dependencies
 */
import { WeatherValueEdit } from '../../block-editor/components';
import { getEditorDateSettings } from '../../block-editor/utils';
import { createDateApi } from '../../shared/date-format';
import {
	formatItemDate,
	getWeatherForecastTimezone,
	withWeatherForecastTimezone,
	getSunEvent,
} from '../../shared/weather-dates';
import Inspector from './inspector';

export default function SunEventEdit( props ) {
	return (
		<WeatherValueEdit
			{ ...props }
			prefixClassName="wp-block-elio-sun-event__prefix"
			valueClassName="wp-block-elio-sun-event__value"
			valueTagName="time"
			getValue={ ( item, { displayType }, weatherForecast ) =>
				getSunEvent( item, weatherForecast, displayType )
			}
			getValueProps={ ( event ) => ( { dateTime: event } ) }
			formatValue={ ( event, { format }, weatherForecast ) =>
				formatItemDate(
					createDateApi(
						withWeatherForecastTimezone(
							getEditorDateSettings(),
							weatherForecast
						)
					),
					event,
					{
						displayType: 'time',
						format,
						timezone: getWeatherForecastTimezone( weatherForecast ),
					}
				)
			}
			inspector={ <Inspector { ...props } /> }
		/>
	);
}
