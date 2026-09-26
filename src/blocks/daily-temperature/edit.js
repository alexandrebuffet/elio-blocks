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
	return (
		<WeatherValueEdit
			{ ...props }
			prefixClassName="wp-block-elio-daily-temperature__prefix"
			valueClassName="wp-block-elio-daily-temperature__value"
			unitClassName="wp-block-elio-daily-temperature__unit"
			getValue={ ( item, { displayType } ) =>
				getDailyTemperature( item, displayType )
			}
			getUnit={ temperatureUnitLabel }
			emptyText="—"
			inspector={ <Inspector { ...props } /> }
		/>
	);
}
