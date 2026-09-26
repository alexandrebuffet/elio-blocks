/**
 * Internal dependencies
 */
import {
	PrefixSettingsPanel,
	WeatherValueEdit,
} from '../../block-editor/components';
import { pressureUnitLabel } from '../../shared/weather-values';

export default function PressureEdit( props ) {
	return (
		<WeatherValueEdit
			{ ...props }
			prefixClassName="wp-block-elio-pressure__prefix"
			valueClassName="wp-block-elio-pressure__value"
			unitClassName="wp-block-elio-pressure__unit"
			getValue={ ( item ) => item?.pressure }
			getUnit={ pressureUnitLabel }
			inspector={ <PrefixSettingsPanel { ...props } /> }
		/>
	);
}
