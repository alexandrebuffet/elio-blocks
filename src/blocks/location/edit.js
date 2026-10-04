/**
 * WordPress dependencies.
 */
import {
	useBlockProps,
	BlockControls,
	HeadingLevelDropdown,
	RichText,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useSelect, useDispatch } from '@wordpress/data';
import {
	useState,
	useEffect,
	useRef,
	useCallback,
	useLayoutEffect,
} from '@wordpress/element';
import { ToolbarButton } from '@wordpress/components';
import { pencil, search } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';

/**
 * Internal dependencies.
 */
import './editor.scss';
import Inspector from './inspector';
import SearchLocationModal from '../../block-editor/components/search-location-modal';
import { useReportContext } from '../../block-editor/hooks';
import {
	formatCoordinates,
	formatCoordinatesPrecise,
} from '../../block-editor/utils/format-coordinates';

/** Default heading levels for the location block (0 = paragraph, 1–6 = H1–H6). */
const DEFAULT_LEVEL_OPTIONS = [ 0, 1, 2, 3, 4, 5, 6 ];

const REPORT_BLOCK_NAME = 'elio/weather-report';

/**
 * Strips HTML tags for storing custom display names and accessible labels (RichText output).
 *
 * @param {string} html HTML string from RichText.
 * @return {string} Plain text with tags removed.
 */
function stripHtmlToText( html ) {
	if ( typeof html !== 'string' ) {
		return '';
	}
	return html.replace( /<[^>]+>/g, '' ).trim();
}

/**
 * Checks whether a coordinate is a finite number.
 *
 * @param {unknown} value Coordinate from the report location object.
 * @return {boolean} True when the value is a finite number.
 */
function isFiniteCoordinate( value ) {
	const n = Number( value );
	return Number.isFinite( n );
}

/**
 * Renders the Location block in the editor. Displays the report location from
 * context, the one of the report example in a preview out of any report.
 *
 * @param {Object}                       props                 Block props.
 * @param {string}                       props.clientId        Block client id.
 * @param {Object}                       [props.context]       Block context from parent (report).
 * @param {Object}                       [props.attributes]    Block attributes.
 * @param {(attributes: Object) => void} [props.setAttributes] Set block attributes.
 * @param {boolean}                      props.isSelected      Whether the block is selected.
 * @return {Element}                       Element to render.
 */
export default function LocationEdit( {
	clientId,
	context,
	attributes,
	setAttributes,
	isSelected,
} ) {
	const location =
		useReportContext( context )?.[ 'elio/reportLocation' ] ?? {};

	const { level = 2, levelOptions, displayType = '' } = attributes;

	const resolvedLevel = typeof level === 'number' ? level : 2;

	const { customName = '', name = '' } = location;

	const hasPersistedCustomName = Boolean(
		stripHtmlToText( customName ).trim()
	);

	const hasReportLocation =
		isFiniteCoordinate( location?.latitude ) &&
		isFiniteCoordinate( location?.longitude );

	const locationHint =
		( name && String( name ).trim() ) ||
		formatCoordinates( location ) ||
		'';

	const searchLocationPlaceholder = __( 'Search a location…', 'elio-blocks' );

	const blockProps = useBlockProps();
	const { ref: blockPropsRef, ...blockPropsForRichText } = blockProps;

	const tagName = resolvedLevel === 0 ? 'p' : 'h' + resolvedLevel;

	const reportClientId = useSelect(
		( select ) => {
			const parents = select(
				blockEditorStore
			).getBlockParentsByBlockName( clientId, REPORT_BLOCK_NAME );
			return parents?.[ 0 ] ?? null;
		},
		[ clientId ]
	);

	const { updateBlockAttributes } = useDispatch( blockEditorStore );

	const [ isEditingCustomName, setIsEditingCustomName ] = useState( false );
	const [ isSearchModalOpen, setIsSearchModalOpen ] = useState( false );
	const richTextRef = useRef( null );
	const richTextMergedRef = useCallback(
		( node ) => {
			richTextRef.current = node;
			if ( ! blockPropsRef ) {
				return;
			}
			if ( typeof blockPropsRef === 'function' ) {
				blockPropsRef( node );
			} else {
				blockPropsRef.current = node;
			}
		},
		[ blockPropsRef ]
	);

	useEffect( () => {
		if ( ! isSelected ) {
			setIsEditingCustomName( false );
			setIsSearchModalOpen( false );
		}
	}, [ isSelected ] );

	const persistCustomName = ( html ) => {
		if ( ! reportClientId ) {
			return;
		}
		const plain = stripHtmlToText( html ).trim();
		updateBlockAttributes( reportClientId, {
			location: {
				...location,
				customName: plain === '' ? undefined : plain,
			},
		} );
	};

	const clearPersistedCustomName = () => {
		if ( ! reportClientId ) {
			return;
		}
		updateBlockAttributes( reportClientId, {
			location: {
				...location,
				customName: undefined,
			},
		} );
	};

	const handleEditCustomNameToggle = () => {
		// With a stored override, the toolbar action resets it instead of opening the field.
		if ( hasPersistedCustomName && ! isEditingCustomName ) {
			clearPersistedCustomName();
			return;
		}
		if ( isEditingCustomName ) {
			clearPersistedCustomName();
			setIsEditingCustomName( false );
		} else {
			setIsEditingCustomName( true );
		}
	};

	const handleSearchLocationSelect = ( selectedLocation ) => {
		if ( ! reportClientId ) {
			return;
		}
		updateBlockAttributes( reportClientId, {
			location: {
				...selectedLocation,
				customName: location.customName || undefined,
			},
		} );
		setIsSearchModalOpen( false );
	};

	const showSearchLocationToolbar =
		Boolean( reportClientId ) && ! hasReportLocation;

	const isCoordinatesDisplay = displayType === 'coordinates';
	const coordinatesPreview = hasReportLocation
		? formatCoordinatesPrecise( location )
		: '';

	let editModePlaceholder;
	if ( isCoordinatesDisplay ) {
		editModePlaceholder = coordinatesPreview || searchLocationPlaceholder;
	} else if ( hasReportLocation ) {
		editModePlaceholder = locationHint;
	} else {
		editModePlaceholder = searchLocationPlaceholder;
	}

	const canEditCustomName = Boolean( reportClientId && hasReportLocation );

	const resolvedPlaceLabel =
		stripHtmlToText( customName ).trim() ||
		( name && String( name ).trim() ) ||
		( hasReportLocation ? formatCoordinates( location ) : '' );

	const richTextReadOnlyValue = isCoordinatesDisplay
		? stripHtmlToText( customName ).trim() || coordinatesPreview
		: resolvedPlaceLabel;

	const showRichTextEditor = isEditingCustomName && canEditCustomName;

	useLayoutEffect( () => {
		if ( ! showRichTextEditor ) {
			return;
		}
		const el = richTextRef.current;
		if ( ! el || typeof el.focus !== 'function' ) {
			return;
		}
		let cancelled = false;
		// Defer past block wrapper / toolbar focus restoration in the editor.
		const outerId = window.requestAnimationFrame( () => {
			window.requestAnimationFrame( () => {
				if ( ! cancelled ) {
					el.focus( { preventScroll: true } );
				}
			} );
		} );
		return () => {
			cancelled = true;
			window.cancelAnimationFrame( outerId );
		};
	}, [ showRichTextEditor ] );

	const richTextAriaLabel =
		stripHtmlToText( customName ).trim() ||
		( isCoordinatesDisplay ? coordinatesPreview : locationHint ) ||
		searchLocationPlaceholder;

	const TagName = tagName;

	const staticShowsPlaceholder =
		! hasReportLocation || ! richTextReadOnlyValue;

	const editCustomNameToolbarLabel =
		hasPersistedCustomName || isEditingCustomName
			? __( 'Reset custom location name', 'elio-blocks' )
			: __( 'Set custom location name', 'elio-blocks' );

	const selectedChrome = isSelected ? (
		<>
			<Inspector clientId={ clientId } location={ location } />
			<BlockControls group="block">
				<HeadingLevelDropdown
					value={ resolvedLevel }
					options={ levelOptions ?? DEFAULT_LEVEL_OPTIONS }
					onChange={ ( newLevel ) =>
						setAttributes( { level: newLevel } )
					}
				/>
			</BlockControls>
			<BlockControls group="other">
				{ showSearchLocationToolbar ? (
					<ToolbarButton
						icon={ search }
						label={ __( 'Search a location', 'elio-blocks' ) }
						onClick={ () => setIsSearchModalOpen( true ) }
					/>
				) : null }
				{ canEditCustomName ? (
					<ToolbarButton
						icon={ pencil }
						label={ editCustomNameToolbarLabel }
						isPressed={
							isEditingCustomName || hasPersistedCustomName
						}
						onClick={ handleEditCustomNameToggle }
					/>
				) : null }
			</BlockControls>
		</>
	) : null;

	return (
		<>
			{ selectedChrome }
			<SearchLocationModal
				isOpen={ isSearchModalOpen }
				onRequestClose={ () => setIsSearchModalOpen( false ) }
				onSelect={ handleSearchLocationSelect }
			/>
			{ showRichTextEditor ? (
				<RichText
					ref={ richTextMergedRef }
					{ ...blockPropsForRichText }
					tagName={ tagName }
					value={ customName }
					onChange={ persistCustomName }
					placeholder={ editModePlaceholder }
					allowedFormats={ [] }
					withoutInteractiveFormatting
					aria-label={ richTextAriaLabel }
				/>
			) : (
				<TagName
					{ ...blockProps }
					className={ clsx(
						blockProps.className,
						'block-editor-rich-text__editable',
						'rich-text',
						staticShowsPlaceholder &&
							'elio-location__editor-placeholder'
					) }
					aria-label={ richTextAriaLabel }
				>
					{ staticShowsPlaceholder
						? searchLocationPlaceholder
						: richTextReadOnlyValue }
				</TagName>
			) }
		</>
	);
}
