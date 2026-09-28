/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useBlockProps } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { store as elioDataStore } from '../../stores/elio-data';
import { getProviderAttribution } from './utils';

/**
 * Keeps a click on a credit link from leaving the editor.
 *
 * @param {Event} event Click event.
 */
function preventNavigation( event ) {
	event.preventDefault();
}

/**
 * Renders the Provider Attribution block in the editor: the credit its
 * render.php prints, from the providers the report block offers.
 *
 * @param {Object} props         Block props.
 * @param {Object} props.context Block context from the report.
 * @return {Element} Element to render.
 */
export default function ProviderAttributionEdit( { context } ) {
	const provider = context?.[ 'elio/reportProvider' ] ?? '';
	const providers = useSelect(
		( select ) => select( elioDataStore ).getWeatherForecastProviders(),
		[]
	);
	const blockProps = useBlockProps();
	const attribution = getProviderAttribution( providers, provider );

	if ( ! attribution ) {
		// Printed nowhere on the front: the block stays visible to be selected.
		return (
			<p { ...blockProps }>
				{ providers === null
					? __( 'Provider attribution', 'elio-blocks' )
					: __(
							'This provider asks for no attribution.',
							'elio-blocks'
						) }
			</p>
		);
	}

	const { text, url, license, licenseUrl } = attribution;

	return (
		<p { ...blockProps }>
			{ url ? (
				<a
					className="wp-block-elio-provider-attribution__provider-link"
					href={ url }
					onClick={ preventNavigation }
				>
					{ text }
				</a>
			) : (
				text
			) }
			{ license && (
				<>
					{ ' ' }
					<span className="wp-block-elio-provider-attribution__license">
						(
						{ licenseUrl ? (
							<a
								className="wp-block-elio-provider-attribution__license-link"
								href={ licenseUrl }
								rel="license"
								onClick={ preventNavigation }
							>
								{ license }
							</a>
						) : (
							license
						) }
						)
					</span>
				</>
			) }
		</p>
	);
}
