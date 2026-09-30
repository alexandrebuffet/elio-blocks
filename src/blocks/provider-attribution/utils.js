/**
 * Returns the provider of a report's weather forecast.
 *
 * @param {Object[]|null} providers Providers from getWeatherForecastProviders(), null while they load.
 * @param {string}        provider  Provider slug of the report, empty for the site default.
 * @return {Object|null} Provider (slug, label, isDefault, attribution), null when unknown.
 */
export function getProvider( providers, provider ) {
	return (
		( providers ?? [] ).find( ( { slug, isDefault } ) =>
			provider ? slug === provider : isDefault
		) ?? null
	);
}
