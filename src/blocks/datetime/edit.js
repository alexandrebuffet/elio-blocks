/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { WeatherValueEdit } from '../../block-editor/components';
import { useNow } from '../../block-editor/hooks';
import { getEditorDateSettings } from '../../block-editor/utils';
import { createDateApi } from '../../shared/date-format';
import {
	formatItemDate,
	getWeatherForecastTimezone,
	withWeatherForecastTimezone,
} from '../../shared/weather-dates';
import Inspector from './inspector';

export default function DatetimeEdit( props ) {
	// The time the forecast list of the row counts its rows from.
	const now = useNow();

	return (
		<WeatherValueEdit
			{ ...props }
			prefixClassName="wp-block-elio-datetime__prefix"
			valueClassName="wp-block-elio-datetime__value"
			valueTagName="time"
			getValue={ ( item ) => item?.timestamp }
			getValueProps={ ( timestamp ) => ( { dateTime: timestamp } ) }
			formatValue={ ( timestamp, attributes, weatherForecast ) =>
				formatItemDate(
					createDateApi(
						withWeatherForecastTimezone(
							getEditorDateSettings(),
							weatherForecast
						)
					),
					timestamp,
					{
						...attributes,
						todayLabel:
							attributes.todayLabel ||
							__( 'Today', 'elio-blocks' ),
						nowLabel:
							attributes.nowLabel || __( 'Now', 'elio-blocks' ),
						timezone: getWeatherForecastTimezone( weatherForecast ),
						now,
					}
				)
			}
			inspector={ <Inspector { ...props } /> }
		/>
	);
}
