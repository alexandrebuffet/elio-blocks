/**
 * Internal dependencies
 */
import { WeatherValueEdit } from '../../block-editor/components';
import { percentLabel } from '../../shared/weather-values';

export default function PrecipitationProbabilityEdit( props ) {
	return (
		<WeatherValueEdit
			{ ...props }
			valueClassName="wp-block-elio-precipitation-probability__value"
			unitClassName="wp-block-elio-precipitation-probability__unit"
			getValue={ ( item ) => item?.precipitation_probability }
			getUnit={ percentLabel }
		/>
	);
}
