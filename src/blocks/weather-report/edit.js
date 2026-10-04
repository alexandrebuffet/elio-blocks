/**
 * WordPress dependencies.
 */
import { useSelect } from '@wordpress/data';
import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';
import { Notice } from '@wordpress/components';

/**
 * Internal dependencies.
 */
import './editor.scss';
import { useWeatherForecastQuery } from '../../block-editor/hooks';
import Inspector from './inspector';
import ReportPlaceholder from './edit/report-placeholder';
import LocationToolbar from './edit/location-toolbar';
import { PROVIDER_ATTRIBUTION_BLOCK } from './variations';

/**
 * Renders the Weather Report block in the editor.
 *
 * @param {Object}                       props               Block properties.
 * @param {string}                       props.clientId      Block clientId.
 * @param {Object}                       props.attributes    Block attributes.
 * @param {(attributes: Object) => void} props.setAttributes Function to set block attributes.
 * @param {Array}                        props.allowedBlocks Allowed inner blocks.
 * @param {boolean}                      props.isSelected    Whether the block is selected.
 * @return {Element} Element to render.
 */
export default function ReportEdit( props ) {
	const { clientId, attributes, allowedBlocks, setAttributes, isSelected } =
		props;
	const hasInnerBlocks = useSelect(
		( select ) =>
			( select( 'core/block-editor' ).getBlocks( clientId )?.length ??
				0 ) > 0,
		[ clientId ]
	);

	const { location = {}, provider = '', units = '' } = attributes;
	const { latitude = '', longitude = '' } = location;

	const weatherForecastQuery = useWeatherForecastQuery( {
		latitude,
		longitude,
		provider,
		units,
	} );

	// Call hooks unconditionally so hook count is stable when switching placeholder ↔ content.
	const blockProps = useBlockProps();
	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		allowedBlocks,
		template: [
			[ 'elio/location' ],
			[ 'elio/condition-icon' ],
			[ 'elio/temperature' ],
			PROVIDER_ATTRIBUTION_BLOCK,
		],
		templateLock: false,
	} );

	if ( ! hasInnerBlocks ) {
		return (
			<ReportPlaceholder
				clientId={ clientId }
				attributes={ attributes }
				setAttributes={ setAttributes }
				isSelected={ isSelected }
			/>
		);
	}

	const TagName =
		attributes.tagName &&
		[ 'div', 'section', 'article' ].includes( attributes.tagName )
			? attributes.tagName
			: 'section';

	const { children, ...restInnerBlocksProps } = innerBlocksProps;
	const { isLoading, error } = weatherForecastQuery;

	// Inner blocks stay mounted whatever the request does: replacing them with a
	// spinner dropped the selection and re-created every block on each refresh.
	// No spinner over them either: they keep the weather forecast shown until
	// the next one is there and fill in place, as core blocks bound to data do.
	return (
		<>
			{ isSelected && (
				<>
					<Inspector { ...props } />
					<LocationToolbar
						location={ location }
						setAttributes={ setAttributes }
					/>
				</>
			) }
			<TagName { ...restInnerBlocksProps } aria-busy={ !! isLoading }>
				{ error && (
					<Notice status="error" isDismissible={ false }>
						{ error }
					</Notice>
				) }
				{ children }
			</TagName>
		</>
	);
}
