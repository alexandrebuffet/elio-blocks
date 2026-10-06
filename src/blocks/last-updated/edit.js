/**
 * WordPress dependencies
 */
import { _x } from '@wordpress/i18n';

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
} from '../../shared/weather-dates';
import Inspector from './inspector';

export default function LastUpdatedEdit( props ) {
	return (
		<WeatherValueEdit
			{ ...props }
			prefixClassName="wp-block-elio-last-updated__prefix"
			defaultPrefix={ _x(
				'Updated',
				'prefix of the time the weather data was last updated',
				'elio-blocks'
			) }
			valueClassName="wp-block-elio-last-updated__value"
			valueTagName="time"
			getValue={ ( item, attributes, weatherForecast ) =>
				weatherForecast?.meta?.fetched_at
			}
			getValueProps={ ( fetchedAt ) => ( { dateTime: fetchedAt } ) }
			formatValue={ ( fetchedAt, { format }, weatherForecast ) =>
				formatItemDate(
					createDateApi(
						withWeatherForecastTimezone(
							getEditorDateSettings(),
							weatherForecast
						)
					),
					fetchedAt,
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
