/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import {
	useBlockProps,
	__experimentalUseColorProps as useColorProps,
	__experimentalUseBorderProps as useBorderProps,
	__experimentalGetSpacingClassesAndStyles as useSpacingProps,
	getDimensionsClassesAndStyles as useDimensionsProps,
} from '@wordpress/block-editor';
import { Path, Rect, SVG } from '@wordpress/primitives';

/**
 * Internal dependencies
 */
import {
	useConditionIconCollections,
	useWeatherReport,
} from '../../block-editor/hooks';
import { resolveConditionIconCollection } from '../../block-editor/utils';
import HtmlRenderer from '../../block-editor/components/html-renderer';
import Inspector from './inspector';

/**
 * Renders the placeholder displayed when no weather data is available yet.
 *
 * @param {Object} props           Component props.
 * @param {string} props.className Class names (border, spacing, dimensions).
 * @param {Object} props.style     Inline styles.
 * @return {Element} Placeholder SVG.
 */
const WeatherIconPlaceholder = ( { className, style } ) => (
	<SVG
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 60 60"
		preserveAspectRatio="none"
		fill="none"
		aria-hidden="true"
		className={ clsx(
			'wp-block-elio-condition-icon__placeholder',
			className
		) }
		style={ style }
	>
		<Rect width="60" height="60" fill="currentColor" fillOpacity={ 0.1 } />
		<Path
			vectorEffect="non-scaling-stroke"
			stroke="currentColor"
			strokeOpacity={ 0.25 }
			d="M60 60 0 0"
		/>
	</SVG>
);

/**
 * Renders the Condition Icon block in the editor.
 *
 * Follows the same pattern as core/icon (Gutenberg):
 * – HtmlRenderer for safe SVG rendering in the editor
 * – useColorProps / useDimensionsProps merged as wrapperProps so styles land
 *   directly on the SVG element rather than on an extra wrapper
 * – WeatherIconPlaceholder when no weather data is available
 *
 * item.condition_icons names the icon of each collection; the SVG comes from
 * the icons dictionary of the weather forecast response — no separate REST
 * call to condition-icons.
 *
 * @param {Object}                       props               Block props.
 * @param {Object}                       props.attributes    Block attributes.
 * @param {Object}                       props.context       Block context.
 * @param {(attributes: Object) => void} props.setAttributes Block attributes setter.
 * @param {boolean}                      props.isSelected    Whether the block is selected.
 * @return {Element} Element to render.
 */
export default function ConditionIconEdit( {
	context,
	attributes,
	setAttributes,
	isSelected,
} ) {
	const {
		strokeWidth = 2,
		strokeLinecap = 'round',
		strokeLinejoin = 'round',
	} = attributes;
	const { data } = useWeatherReport( context );
	const { collections, defaultCollection, isResolving } =
		useConditionIconCollections();
	const item = context?.[ 'elio/forecastItem' ] ?? data?.current ?? null;

	// Its own collection, else the one of its report, else the site one:
	// ConditionIconCollectionResolver does the same for render.php.
	const collection = resolveConditionIconCollection(
		[ attributes.iconCollection, context?.[ 'elio/reportIconCollection' ] ],
		isResolving ? null : collections,
		defaultCollection
	);
	const iconName = item?.condition_icons?.[ collection ] ?? null;
	const iconEntry = ( iconName && data?.icons?.[ iconName ] ) ?? null;
	const isStroke = iconEntry?.style === 'stroke';

	const colorProps = useColorProps( attributes );
	const borderProps = useBorderProps( attributes );
	const spacingProps = useSpacingProps( attributes );
	const dimensionsProps = useDimensionsProps( attributes );

	const strokeStyle = isStroke
		? {
				fill: 'none',
				stroke: 'currentColor',
				strokeWidth,
				strokeLinecap,
				strokeLinejoin,
			}
		: {};

	const wrapperProps = {
		className: clsx(
			'wp-block-elio-condition-icon__symbol',
			colorProps.className,
			borderProps.className,
			spacingProps.className,
			dimensionsProps.className
		),
		style: {
			...colorProps.style,
			...borderProps.style,
			...spacingProps.style,
			...dimensionsProps.style,
			...strokeStyle,
		},
	};

	let iconElement;
	if ( iconEntry?.content ) {
		iconElement = (
			<HtmlRenderer
				html={ iconEntry.content }
				wrapperProps={ wrapperProps }
			/>
		);
	} else {
		iconElement = (
			<WeatherIconPlaceholder
				className={ clsx(
					borderProps.className,
					spacingProps.className,
					dimensionsProps.className
				) }
				style={ {
					...borderProps.style,
					...spacingProps.style,
					...dimensionsProps.style,
				} }
			/>
		);
	}

	const blockProps = useBlockProps( {
		className: clsx(
			iconEntry?.content && 'has-svg-symbol',
			isStroke && 'is-stroke-symbol'
		),
	} );

	return (
		<>
			{ isSelected && (
				<Inspector
					attributes={ attributes }
					setAttributes={ setAttributes }
					context={ context }
					isStroke={ isStroke }
				/>
			) }
			<div { ...blockProps }>{ iconElement }</div>
		</>
	);
}
