/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import {
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
	ToggleControl,
} from '@wordpress/components';
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
 * Renders the settings of the block: whether its links open in a new tab.
 *
 * @param {Object}                       props               Component props.
 * @param {string}                       props.linkTarget    '_self' or '_blank'.
 * @param {(attributes: Object) => void} props.setAttributes Block attributes setter.
 * @return {Element} Inspector controls.
 */
function Inspector( { linkTarget, setAttributes } ) {
	const reset = () => setAttributes( { linkTarget: '_self' } );

	return (
		<InspectorControls>
			<ToolsPanel
				label={ __( 'Settings', 'elio-blocks' ) }
				resetAll={ reset }
			>
				<ToolsPanelItem
					label={ __( 'Open in new tab', 'elio-blocks' ) }
					hasValue={ () => linkTarget === '_blank' }
					onDeselect={ reset }
					isShownByDefault
				>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Open in new tab', 'elio-blocks' ) }
						checked={ linkTarget === '_blank' }
						onChange={ ( value ) =>
							setAttributes( {
								linkTarget: value ? '_blank' : '_self',
							} )
						}
					/>
				</ToolsPanelItem>
			</ToolsPanel>
		</InspectorControls>
	);
}

/**
 * Renders the Provider Attribution block in the editor: the sentence its
 * render.php prints, from the providers the report block offers.
 *
 * @param {Object}                       props               Block props.
 * @param {Object}                       props.attributes    Block attributes.
 * @param {(attributes: Object) => void} props.setAttributes Block attributes setter.
 * @param {Object}                       props.context       Block context from the report.
 * @return {Element} Element to render.
 */
export default function ProviderAttributionEdit( {
	attributes,
	setAttributes,
	context,
} ) {
	const { linkTarget = '_self' } = attributes ?? {};
	const inspector = (
		<Inspector linkTarget={ linkTarget } setAttributes={ setAttributes } />
	);
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
			<>
				{ inspector }
				<p { ...blockProps }>
					{ providers === null
						? __( 'Provider Attribution', 'elio-blocks' )
						: __(
								'This provider asks for no attribution.',
								'elio-blocks'
							) }
				</p>
			</>
		);
	}

	const { url, license, licenseUrl } = provider.attribution;
	// As render.php: a new tab is said to screen readers, in each link, and
	// rel stays noopener without noreferrer, as WordPress does since 5.6: the
	// provider still sees the visits its credit brings.
	const opensInNewTab = linkTarget === '_blank';
	const newTabNotice = opensInNewTab && (
		<span className="screen-reader-text">
			{ ' ' + __( '(opens in a new tab)', 'elio-blocks' ) }
		</span>
	);
	const elements = {
		provider: (
			// eslint-disable-next-line react/jsx-no-target-blank -- noopener, not noreferrer (see above).
			<a
				className="wp-block-elio-provider-attribution__provider-link"
				href={ url }
				target={ opensInNewTab ? '_blank' : undefined }
				rel={ opensInNewTab ? 'noopener' : undefined }
				onClick={ preventNavigation }
			>
				{ provider.label }
				{ newTabNotice }
			</a>
		),
		license: licenseUrl ? (
			// eslint-disable-next-line react/jsx-no-target-blank -- noopener, not noreferrer (see above).
			<a
				className="wp-block-elio-provider-attribution__license-link"
				href={ licenseUrl }
				target={ opensInNewTab ? '_blank' : undefined }
				rel={ opensInNewTab ? 'license noopener' : 'license' }
				onClick={ preventNavigation }
			>
				{ license }
				{ newTabNotice }
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
		<>
			{ inspector }
			<p { ...blockProps }>
				{ createInterpolateElement( credit, elements ) }
			</p>
		</>
	);
}
