/**
 * Internal dependencies
 */
import { WeatherValueEdit } from '../../block-editor/components';
import {
	getDailyTemperature,
	temperatureUnitLabel,
} from '../../shared/weather-values';
import Inspector from './inspector';

export default function DailyTemperatureEdit( props ) {
	// Out of a row, as in its preview in the inserter, the day of today: the
	// current conditions have no minimum nor maximum.
	const isInRow = !! props.context?.[ 'elio/forecastItem' ];

	return (
		<WeatherValueEdit
			{ ...props }
			prefixClassName="wp-block-elio-daily-temperature__prefix"
			valueClassName="wp-block-elio-daily-temperature__value"
			unitClassName="wp-block-elio-daily-temperature__unit"
			getValue={ ( item, { displayType }, weatherForecast ) =>
				getDailyTemperature(
					isInRow ? item : weatherForecast?.daily?.[ 0 ],
					displayType
				)
			}
			getUnit={ temperatureUnitLabel }
			emptyText="—"
			inspector={ <Inspector { ...props } /> }
		/>
	);
}
