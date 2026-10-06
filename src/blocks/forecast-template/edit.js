/**
 * WordPress dependencies
 */
import { memo, useMemo, useState } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import {
	BlockContextProvider,
	__experimentalUseBlockPreview as useBlockPreview,
	useBlockProps,
	useInnerBlocksProps,
} from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { useNow, useWeatherReport } from '../../block-editor/hooks';
import { selectForecastItems } from '../../shared/forecast-window';

const EMPTY_ROW_CONTEXT = {
	'elio/forecastItem': null,
	'elio/forecastItemIndex': 0,
};

const TEMPLATE = [
	[ 'elio/datetime' ],
	[ 'elio/condition-icon' ],
	[ 'elio/daily-temperature' ],
];

function ForecastTemplateInnerBlocks() {
	const innerBlocksProps = useInnerBlocksProps(
		{ className: 'wp-block-elio-forecast-template__item' },
		{
			template: TEMPLATE,
			templateLock: false,
			__unstableDisableLayoutClassNames: true,
			orientation: 'vertical',
		}
	);
	return <li { ...innerBlocksProps } />;
}

function ForecastTemplateBlockPreview( {
	blocks,
	blockContextId,
	isHidden,
	setActiveContextId,
} ) {
	const blockPreviewProps = useBlockPreview( {
		blocks,
		props: { className: 'wp-block-elio-forecast-template__item' },
	} );

	return (
		<li
			{ ...blockPreviewProps }
			tabIndex={ 0 }
			// eslint-disable-next-line jsx-a11y/no-noninteractive-element-to-interactive-role
			role="button"
			onClick={ () => setActiveContextId( blockContextId ) }
			onKeyDown={ ( event ) => {
				// A button answers to Enter and Space; Tab must keep moving focus.
				if ( event.key === 'Enter' || event.key === ' ' ) {
					event.preventDefault();
					setActiveContextId( blockContextId );
				}
			} }
			style={ { display: isHidden ? 'none' : undefined } }
		/>
	);
}

const MemoizedPreview = memo( ForecastTemplateBlockPreview );

/**
 * Renders the Forecast Template block in the editor. Iterates over forecast
 * items with BlockContextProvider, showing the active item as editable
 * InnerBlocks and others as block previews.
 * Clicking a preview makes it the active (editable) item.
 *
 * @param {Object} props                            Block props.
 * @param {string} props.clientId                   Block client ID.
 * @param {Object} props.context                    Block context.
 * @param {string} props.__unstableLayoutClassNames Layout class names from the block supports.
 * @return {Element} Element to render.
 */
export default function ForecastTemplateEdit( {
	clientId,
	context,
	__unstableLayoutClassNames,
} ) {
	const [ activeContextId, setActiveContextId ] = useState( 0 );

	// Only stable values come out of useSelect: a selector building a new array
	// on each call would re-render the block on every change in the editor.
	const { type, count, blocks } = useSelect(
		( select ) => {
			const {
				getBlockParentsByBlockName,
				getBlockAttributes,
				getBlocks,
			} = select( 'core/block-editor' );
			const [ forecastClientId ] = getBlockParentsByBlockName(
				clientId,
				'elio/forecast',
				true
			);
			const forecastAttributes = forecastClientId
				? getBlockAttributes( forecastClientId )
				: null;

			return {
				type: forecastAttributes?.type ?? 'daily',
				count: forecastAttributes?.count ?? 7,
				blocks: getBlocks( clientId ),
			};
		},
		[ clientId ]
	);

	const { data } = useWeatherReport( context );
	// The time the date blocks of the rows label "Now" and "Today" from.
	const now = useNow();

	// One context object per row, kept between renders: BlockContextProvider
	// re-renders every inner block when its value changes identity.
	const rowContexts = useMemo(
		() =>
			( selectForecastItems( data, type, count, now ) ?? [] ).map(
				( item, index ) => ( {
					'elio/forecastItem': item,
					'elio/forecastItemIndex': index,
				} )
			),
		[ data, type, count, now ]
	);

	const blockProps = useBlockProps( {
		className: __unstableLayoutClassNames,
	} );
	const hasItems = rowContexts.length > 0;
	const activeId = hasItems
		? Math.min( activeContextId, rowContexts.length - 1 )
		: 0;

	// No data yet: render the inner blocks once with null item so the
	// template is accessible and configurable before data loads.
	if ( ! hasItems ) {
		return (
			<ol { ...blockProps }>
				<BlockContextProvider value={ EMPTY_ROW_CONTEXT }>
					<ForecastTemplateInnerBlocks />
				</BlockContextProvider>
			</ol>
		);
	}

	return (
		<ol { ...blockProps }>
			{ rowContexts.map( ( rowContext, index ) => (
				<BlockContextProvider key={ index } value={ rowContext }>
					{ index === activeId ? (
						<ForecastTemplateInnerBlocks />
					) : null }
					<MemoizedPreview
						blocks={ blocks }
						blockContextId={ index }
						isHidden={ index === activeId }
						setActiveContextId={ setActiveContextId }
					/>
				</BlockContextProvider>
			) ) }
		</ol>
	);
}
