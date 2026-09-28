/**
 * Returns the credit a report shows for the provider of its weather forecast.
 *
 * @param {Object[]|null} providers Providers from getWeatherForecastProviders(), null while they load.
 * @param {string}        provider  Provider slug of the report, empty for the site default.
 * @return {Object|null} Attribution (text, url, license, licenseUrl), null when the provider asks for none or is unknown.
 */
export function getProviderAttribution( providers, provider ) {
	const match = ( providers ?? [] ).find( ( { slug, isDefault } ) =>
		provider ? slug === provider : isDefault
	);

	return match?.attribution ?? null;
}
