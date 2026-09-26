/**
 * WordPress dependencies
 */
import { __, _x, sprintf } from '@wordpress/i18n';

/**
 * Returns the options of the Provider select of the report block.
 *
 * "Default" names the site default provider, as the settings page does. Every
 * registered provider follows, the default one too: picking it pins the block
 * to it whatever the site default becomes. A provider the block uses and the
 * list lacks (its plugin deactivated, or the list not there yet) stays an
 * option, labelled with its slug: the select would otherwise show "Default".
 *
 * @param {Object[]|null} providers Providers from getWeatherForecastProviders(), null while they load.
 * @param {string}        provider  Provider slug of the block, empty for the site default.
 * @return {Object[]} Options: label, value.
 */
export function getProviderOptions( providers, provider ) {
	const defaultProvider = providers?.find( ( { isDefault } ) => isDefault );
	const options = [
		{
			label: defaultProvider
				? sprintf(
						/* translators: %s: Provider label (e.g. Open-Meteo). */
						_x( 'Default (%s)', 'weather provider', 'elio-blocks' ),
						defaultProvider.label
					)
				: __( 'Default', 'elio-blocks' ),
			value: '',
		},
		...( providers ?? [] ).map( ( { slug, label } ) => ( {
			label,
			value: slug,
		} ) ),
	];

	if ( provider && ! options.some( ( { value } ) => value === provider ) ) {
		options.push( { label: provider, value: provider } );
	}

	return options;
}
