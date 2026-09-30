/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useBlockProps } from '@wordpress/block-editor';
import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { store as elioDataStore } from '../../stores/elio-data';
import { getProvider } from './utils';

/**
 * Keeps a click on a credit link from leaving the editor.
 *
 * @param {Event} event Click event.
 */
function preventNavigation( event ) {
	event.preventDefault();
}

/**
 * Renders the Provider Attribution block in the editor: the sentence its
 * render.php prints, from the providers the report block offers.
 *
 * @param {Object} props         Block props.
 * @param {Object} props.context Block context from the report.
 * @return {Element} Element to render.
 */
export default function ProviderAttributionEdit( { context } ) {
	const providers = useSelect(
		( select ) => select( elioDataStore ).getWeatherForecastProviders(),
		[]
	);
	const blockProps = useBlockProps();
	const provider = getProvider(
		providers,
		context?.[ 'elio/reportProvider' ] ?? ''
	);

	if ( ! provider?.attribution ) {
		// Printed nowhere on the front: the block stays visible to be selected.
		return (
			<p { ...blockProps }>
				{ providers === null
					? __( 'Provider Attribution', 'elio-blocks' )
					: __(
							'This provider asks for no attribution.',
							'elio-blocks'
						) }
			</p>
		);
	}

	const { url, license, licenseUrl } = provider.attribution;
	const elements = {
		provider: (
			<a
				className="wp-block-elio-provider-attribution__provider-link"
				href={ url }
				onClick={ preventNavigation }
			>
				{ provider.label }
			</a>
		),
		license: licenseUrl ? (
			<a
				className="wp-block-elio-provider-attribution__license-link"
				href={ licenseUrl }
				rel="license"
				onClick={ preventNavigation }
			>
				{ license }
			</a>
		) : (
			<>{ license }</>
		),
	};
	// The names go in after translation, as elements: a translator never sees
	// markup, and a name holding "<" cannot break the interpolation.
	const credit = license
		? sprintf(
				/* translators: 1: Name of the weather data provider, linked to its site (e.g. Open-Meteo). 2: Name of the license of its data, linked to it (e.g. CC BY 4.0). */
				__(
					'Weather data by %1$s, licensed under %2$s',
					'elio-blocks'
				),
				'<provider />',
				'<license />'
			)
		: sprintf(
				/* translators: %s: Name of the weather data provider, linked to its site (e.g. Open-Meteo). */
				__( 'Weather data by %s', 'elio-blocks' ),
				'<provider />'
			);

	return (
		<p { ...blockProps }>
			{ createInterpolateElement( credit, elements ) }
		</p>
	);
}
