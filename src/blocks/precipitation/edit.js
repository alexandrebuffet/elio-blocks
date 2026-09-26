/**
 * Internal dependencies
 */
import {
	PrefixSettingsPanel,
	WeatherValueEdit,
} from '../../block-editor/components';
import { precipitationUnitLabel } from '../../shared/weather-values';

export default function PrecipitationEdit( props ) {
	return (
		<WeatherValueEdit
			{ ...props }
			prefixClassName="wp-block-elio-precipitation__prefix"
			valueClassName="wp-block-elio-precipitation__value"
			unitClassName="wp-block-elio-precipitation__unit"
			getValue={ ( item ) => item?.precipitation }
			getUnit={ precipitationUnitLabel }
			inspector={ <PrefixSettingsPanel { ...props } /> }
		/>
	);
}
