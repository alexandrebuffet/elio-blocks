/**
 * Internal dependencies
 */
import { WeatherValueEdit } from '../../block-editor/components';
import {
	getHourlyTemperature,
	temperatureUnitLabel,
} from '../../shared/weather-values';
import Inspector from './inspector';

export default function TemperatureEdit( props ) {
	return (
		<WeatherValueEdit
			{ ...props }
			prefixClassName="wp-block-elio-temperature__prefix"
			valueClassName="wp-block-elio-temperature__value"
			unitClassName="wp-block-elio-temperature__unit"
			currentOnly
			getValue={ ( current, { displayType } ) =>
				getHourlyTemperature(
					current,
					displayType === 'feels-like' ? 'feels-like' : 'temperature'
				)
			}
			getUnit={ temperatureUnitLabel }
			emptyText="—"
			inspector={ <Inspector { ...props } /> }
		/>
	);
}
