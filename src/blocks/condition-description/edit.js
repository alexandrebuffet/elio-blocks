/**
 * Internal dependencies
 */
import {
	PrefixSettingsPanel,
	WeatherValueEdit,
} from '../../block-editor/components';

export default function ConditionDescriptionEdit( props ) {
	return (
		<WeatherValueEdit
			{ ...props }
			prefixClassName="wp-block-elio-condition-description__prefix"
			valueClassName="wp-block-elio-condition-description__value"
			getValue={ ( item ) => item?.condition_description }
			emptyText="—"
			tabularNums={ false }
			inspector={ <PrefixSettingsPanel { ...props } /> }
		/>
	);
}
