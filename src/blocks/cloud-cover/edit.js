/**
 * Internal dependencies
 */
import {
	PrefixSettingsPanel,
	WeatherValueEdit,
} from '../../block-editor/components';
import { percentLabel } from '../../shared/weather-values';

export default function CloudCoverEdit( props ) {
	return (
		<WeatherValueEdit
			{ ...props }
			prefixClassName="wp-block-elio-cloud-cover__prefix"
			valueClassName="wp-block-elio-cloud-cover__value"
			unitClassName="wp-block-elio-cloud-cover__unit"
			getValue={ ( item ) => item?.cloud_cover }
			getUnit={ percentLabel }
			inspector={ <PrefixSettingsPanel { ...props } /> }
		/>
	);
}
