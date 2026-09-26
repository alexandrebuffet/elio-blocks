/**
 * Internal dependencies
 */
import { WeatherValueEdit } from '../../block-editor/components';
import {
	getHourlyTemperature,
	temperatureUnitLabel,
} from '../../shared/weather-values';
import Inspector from './inspector';

export default function HourlyTemperatureEdit( props ) {
	return (
		<WeatherValueEdit
			{ ...props }
			prefixClassName="wp-block-elio-hourly-temperature__prefix"
			valueClassName="wp-block-elio-hourly-temperature__value"
			unitClassName="wp-block-elio-hourly-temperature__unit"
			getValue={ ( item, { displayType } ) =>
				getHourlyTemperature( item, displayType )
			}
			getUnit={ temperatureUnitLabel }
			emptyText="—"
			inspector={ <Inspector { ...props } /> }
		/>
	);
}
