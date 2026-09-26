/**
 * Internal dependencies
 */
import {
	PrefixSettingsPanel,
	WeatherValueEdit,
} from '../../block-editor/components';
import { percentLabel } from '../../shared/weather-values';

export default function HumidityEdit( props ) {
	return (
		<WeatherValueEdit
			{ ...props }
			prefixClassName="wp-block-elio-humidity__prefix"
			valueClassName="wp-block-elio-humidity__value"
			unitClassName="wp-block-elio-humidity__unit"
			getValue={ ( item ) => item?.humidity }
			getUnit={ percentLabel }
			inspector={ <PrefixSettingsPanel { ...props } /> }
		/>
	);
}
