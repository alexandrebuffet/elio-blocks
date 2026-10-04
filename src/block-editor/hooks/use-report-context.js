/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import reportMetadata from '../../blocks/weather-report/block.json';

/**
 * Report context of the Weather Report example: Paris, the location the
 * inserter previews the report with.
 */
const EXAMPLE_REPORT_CONTEXT = {
	'elio/reportLocation': reportMetadata.example.attributes.location,
};

/**
 * Returns the report context of a block: the one its Weather Report provides,
 * else, in a block preview, the one of the Weather Report example.
 *
 * The inserter previews the example of a block alone, out of any report: with
 * no location to show the weather of, its values would stay empty. In the
 * editor itself, a report without a location keeps its blocks empty: no
 * stand-in there.
 *
 * @param {Object} context Block context (props.context).
 * @return {Object} Block context, with the location of the example in a preview without one.
 */
export function useReportContext( context ) {
	const hasLocation = !! context?.[ 'elio/reportLocation' ];
	const isPreviewWithoutLocation = useSelect(
		( select ) => {
			if ( hasLocation ) {
				return false;
			}
			const settings = select( 'core/block-editor' ).getSettings();
			// WordPress 6.7 names it __unstableIsPreviewMode.
			return !! (
				settings.isPreviewMode ?? settings.__unstableIsPreviewMode
			);
		},
		[ hasLocation ]
	);

	return isPreviewWithoutLocation
		? { ...context, ...EXAMPLE_REPORT_CONTEXT }
		: context;
}
