/**
 * Internal dependencies
 */
import { useReportContext } from './use-report-context';
import { useWeatherForecastQuery } from './use-weather-forecast-query';

/**
 * Returns the weather forecast of the Weather Report block a block sits in.
 *
 * The report block provides its query (location, provider, units) as block
 * context; the weather forecast itself lives in the elio/data store, fetched
 * once for every block showing it. Inside a Forecast Template, a block reads
 * its row from the `elio/forecastItem` block context rather than from `item`.
 *
 * Block context rather than the block tree: the rows of a Forecast Template
 * other than the one being edited are block previews, rendered with a block
 * editor store of their own that holds the inner blocks of the template only.
 * The report is not in it, block context reaches them. A block previewed out
 * of any report, as the inserter does, shows the one of the report example.
 *
 * @param {Object} context Block context (props.context): the block lists
 *                         elio/reportLocation, elio/reportProvider and
 *                         elio/reportUnits in its usesContext.
 * @return {{ data: Object|null, isLoading: boolean, error: string|null, item: Object|null }} Weather forecast, request state, and the current conditions as `item`.
 */
export function useWeatherReport( context ) {
	const reportContext = useReportContext( context );
	const location = reportContext?.[ 'elio/reportLocation' ];

	const query = useWeatherForecastQuery( {
		latitude: location?.latitude,
		longitude: location?.longitude,
		provider: reportContext?.[ 'elio/reportProvider' ],
		units: reportContext?.[ 'elio/reportUnits' ],
	} );

	return { ...query, item: query.data?.current ?? null };
}
