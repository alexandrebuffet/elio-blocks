/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useMemo, useState } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { cloneBlock } from '@wordpress/blocks';
import {
	store as blockEditorStore,
	__experimentalBlockPatternsList as BlockPatternsList,
} from '@wordpress/block-editor';
import { Modal, SearchControl } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { REPORT_BLOCK_NAME } from '../utils';

/**
 * Attributes of the report a new design keeps: where, from whom, in which
 * units and with which icons. Everything else is the layout the pattern
 * brings.
 */
export const REPORT_SETTINGS = [
	'location',
	'provider',
	'units',
	'iconCollection',
];

/**
 * Copies the blocks of a pattern, the settings of the current report put on
 * each report among them (as Query's getTransformedBlocksFromPattern() keeps
 * the post type of the query).
 *
 * @param {Object[]} blocks           Blocks of the pattern.
 * @param {Object}   reportAttributes Attributes of the current report.
 * @return {{newBlocks: Object[], reportClientIds: string[]}} Copies, and the reports among them.
 */
export function getTransformedBlocksFromPattern( blocks, reportAttributes ) {
	const settings = Object.fromEntries(
		REPORT_SETTINGS.filter(
			( key ) => reportAttributes?.[ key ] !== undefined
		).map( ( key ) => [ key, reportAttributes[ key ] ] )
	);
	const reportClientIds = [];
	const copy = ( block ) => {
		if ( block.name === REPORT_BLOCK_NAME ) {
			const report = cloneBlock( block, settings );
			reportClientIds.push( report.clientId );
			return report;
		}
		return cloneBlock(
			block,
			{},
			block.innerBlocks.map( ( innerBlock ) => copy( innerBlock ) )
		);
	};
	const newBlocks = blocks.map( copy );

	return { newBlocks, reportClientIds };
}

/**
 * Patterns made of one Weather Report, as the inserter offers them where the
 * block is.
 *
 * @param {string} clientId Report block clientId.
 * @return {Object[]} Patterns.
 */
export function useReportPatterns( clientId ) {
	const patterns = useSelect(
		( select ) => {
			const { getBlockRootClientId, getPatternsByBlockTypes } =
				select( blockEditorStore );
			return getPatternsByBlockTypes(
				REPORT_BLOCK_NAME,
				getBlockRootClientId( clientId )
			);
		},
		[ clientId ]
	);

	return useMemo(
		() =>
			patterns.filter(
				( pattern ) =>
					pattern.blocks?.length === 1 &&
					pattern.blocks[ 0 ].name === REPORT_BLOCK_NAME
			),
		[ patterns ]
	);
}

/**
 * Whether a pattern matches a search, by its title, description or keywords.
 *
 * @param {Object} pattern Pattern.
 * @param {string} search  Search typed.
 * @return {boolean} Whether it matches.
 */
function matchesSearch( pattern, search ) {
	const words = search.trim().toLowerCase().split( /\s+/ ).filter( Boolean );
	const text = [
		pattern.title,
		pattern.description,
		...( pattern.keywords ?? [] ),
	]
		.join( ' ' )
		.toLowerCase();

	return words.every( ( word ) => text.includes( word ) );
}

/**
 * Renders the modal listing the patterns of the report, previewed with its
 * location, provider, units and icons; the one clicked replaces the report
 * and keeps them.
 *
 * @param {Object}     props                Component props.
 * @param {string}     props.clientId       Report block clientId.
 * @param {Object}     props.attributes     Report block attributes.
 * @param {() => void} props.onRequestClose Closes the modal.
 * @return {Element} Element to render.
 */
export default function PatternSelectionModal( {
	clientId,
	attributes,
	onRequestClose,
} ) {
	const [ search, setSearch ] = useState( '' );
	const { replaceBlock, selectBlock } = useDispatch( blockEditorStore );
	const patterns = useReportPatterns( clientId );

	// Previews show the weather of the block being changed, not an empty report.
	const previewedPatterns = useMemo(
		() =>
			patterns
				.filter( ( pattern ) => matchesSearch( pattern, search ) )
				.map( ( pattern ) => ( {
					...pattern,
					blocks: getTransformedBlocksFromPattern(
						pattern.blocks,
						attributes
					).newBlocks,
				} ) ),
		[ patterns, search, attributes ]
	);

	const handleClickPattern = ( pattern, blocks ) => {
		const { newBlocks, reportClientIds } = getTransformedBlocksFromPattern(
			blocks,
			attributes
		);
		replaceBlock( clientId, newBlocks );
		if ( reportClientIds[ 0 ] ) {
			selectBlock( reportClientIds[ 0 ] );
		}
		onRequestClose();
	};

	return (
		<Modal
			overlayClassName="wp-block-elio-weather-report__pattern-selection-modal"
			title={ __( 'Choose a design', 'elio-blocks' ) }
			onRequestClose={ onRequestClose }
			isFullScreen
		>
			<div className="wp-block-elio-weather-report__pattern-selection-search">
				<SearchControl
					__nextHasNoMarginBottom
					label={ __( 'Search', 'elio-blocks' ) }
					placeholder={ __( 'Search', 'elio-blocks' ) }
					value={ search }
					onChange={ setSearch }
				/>
			</div>
			<BlockPatternsList
				blockPatterns={ previewedPatterns }
				onClickPattern={ handleClickPattern }
				label={ __( 'Designs of the Weather block', 'elio-blocks' ) }
			/>
		</Modal>
	);
}
