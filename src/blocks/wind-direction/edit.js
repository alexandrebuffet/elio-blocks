/**
 * Internal dependencies
 */
import { WeatherValueEdit } from '../../block-editor/components';
import { windDirectionText } from '../../shared/weather-values';
import Inspector from './inspector';

export default function WindDirectionEdit( props ) {
	return (
		<WeatherValueEdit
			{ ...props }
			prefixClassName="wp-block-elio-wind-direction__prefix"
			valueClassName="wp-block-elio-wind-direction__value"
			getValue={ ( item ) => item?.wind_direction }
			formatValue={ ( degrees, { displayFormat } ) =>
				windDirectionText( degrees, displayFormat )
			}
			inspector={ <Inspector { ...props } /> }
		/>
	);
}
