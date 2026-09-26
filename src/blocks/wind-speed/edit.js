/**
 * Internal dependencies
 */
import {
	PrefixSettingsPanel,
	WeatherValueEdit,
} from '../../block-editor/components';
import { getWindSpeed, windUnitLabel } from '../../shared/weather-values';

export default function WindSpeedEdit( props ) {
	return (
		<WeatherValueEdit
			{ ...props }
			prefixClassName="wp-block-elio-wind-speed__prefix"
			valueClassName="wp-block-elio-wind-speed__value"
			unitClassName="wp-block-elio-wind-speed__unit"
			getValue={ ( item, { displayType } ) =>
				getWindSpeed( item, displayType )
			}
			getUnit={ windUnitLabel }
			inspector={ <PrefixSettingsPanel { ...props } /> }
		/>
	);
}
