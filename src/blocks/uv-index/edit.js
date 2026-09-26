/**
 * Internal dependencies
 */
import {
	PrefixSettingsPanel,
	WeatherValueEdit,
} from '../../block-editor/components';
import { getUvIndex } from '../../shared/weather-values';

export default function UvIndexEdit( props ) {
	return (
		<WeatherValueEdit
			{ ...props }
			prefixClassName="wp-block-elio-uv-index__prefix"
			valueClassName="wp-block-elio-uv-index__value"
			getValue={ getUvIndex }
			inspector={ <PrefixSettingsPanel { ...props } /> }
		/>
	);
}
