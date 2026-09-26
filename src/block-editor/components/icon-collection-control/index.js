/**
 * WordPress dependencies
 */
import { store as blockEditorStore } from '@wordpress/block-editor';
import { Composite, Popover } from '@wordpress/components';
import { debounce, useInstanceId, useViewportMatch } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import { useEffect, useMemo, useState } from '@wordpress/element';

import { Button } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import { getIconCollectionPreviewDocument } from '../../utils';

/**
 * Renders the icons of the preview of a collection in the colors of the site:
 * an iframe holding the theme styles of the editor, as the block styles preview
 * shows a block.
 *
 * @param {Object} props
 * @param {Object} props.collection Collection (from the REST API).
 */
function CollectionPreview( { collection } ) {
	const css = useSelect(
		( select ) =>
			( select( blockEditorStore ).getSettings().styles ?? [] )
				.map( ( style ) => style.css ?? '' )
				.join( '\n' ),
		[]
	);

	return (
		<iframe
			className="elio-icon-collection-control__iframe"
			title={ collection.label }
			srcDoc={ getIconCollectionPreviewDocument( collection.preview, {
				layout: 'row',
				css,
			} ) }
			sandbox=""
			tabIndex={ -1 }
			aria-hidden="true"
		/>
	);
}

/**
 * Picks a condition icon collection by its name, as the block styles panel
 * picks a style: two buttons a row, the preview of the one hovered or
 * focused beside the sidebar.
 *
 * @param {Object}                 props
 * @param {string}                 props.label       Accessible name of the group (its panel title shows it).
 * @param {Array}                  props.collections Registered collections (from the REST API).
 * @param {string}                 props.value       Slug of the collection shown as chosen.
 * @param {(slug: string) => void} props.onChange    Called with the slug clicked.
 */
export default function IconCollectionControl( {
	label,
	collections,
	value,
	onChange,
} ) {
	const instanceId = useInstanceId(
		IconCollectionControl,
		'elio-icon-collection-control'
	);
	const [ hovered, setHovered ] = useState( null );
	const [ anchor, setAnchor ] = useState( null );
	const isMobile = useViewportMatch( 'medium', '<' );
	const debouncedSetHovered = useMemo(
		() => debounce( setHovered, 250 ),
		[]
	);
	useEffect(
		() => () => debouncedSetHovered.cancel(),
		[ debouncedSetHovered ]
	);

	const rows = useMemo( () => {
		const result = [];
		for ( let i = 0; i < collections.length; i += 2 ) {
			result.push( collections.slice( i, i + 2 ) );
		}
		return result;
	}, [ collections ] );

	const itemId = ( slug ) => `${ instanceId }-${ slug }`;

	const select = ( slug ) => {
		debouncedSetHovered.cancel();
		setHovered( null );
		onChange( slug );
	};

	const hover = ( collection ) => {
		if ( hovered === collection ) {
			debouncedSetHovered.cancel();
			return;
		}
		debouncedSetHovered( collection );
	};

	return (
		<div ref={ setAnchor } className="elio-icon-collection-control">
			<Composite
				role="radiogroup"
				aria-label={ label }
				className="elio-icon-collection-control__variants"
				activeId={ itemId( value ) }
				// Arrow keys move the choice, as in the block styles panel.
				setActiveId={ ( nextId ) => {
					const next = collections.find(
						( { slug } ) => itemId( slug ) === nextId
					);
					if ( next && next.slug !== value ) {
						select( next.slug );
					}
				} }
				focusLoop
				focusWrap
				focusShift
			>
				{ rows.map( ( row, rowIndex ) => (
					<Composite.Row
						key={ rowIndex }
						className="elio-icon-collection-control__row"
					>
						{ row.map( ( collection ) => (
							<Composite.Item
								key={ collection.slug }
								id={ itemId( collection.slug ) }
								render={
									<Button
										className="elio-icon-collection-control__item"
										tone="neutral"
										variant={
											value === collection.slug
												? 'solid'
												: 'outline'
										}
									/>
								}
								role="radio"
								aria-checked={ value === collection.slug }
								onMouseEnter={ () => hover( collection ) }
								onFocus={ () => hover( collection ) }
								onMouseLeave={ () => hover( null ) }
								onBlur={ () => hover( null ) }
								onClick={ () => select( collection.slug ) }
							>
								<span className="elio-icon-collection-control__item-text">
									{ collection.label }
								</span>
							</Composite.Item>
						) ) }
					</Composite.Row>
				) ) }
			</Composite>
			{ hovered && ! isMobile && (
				<div className="elio-icon-collection-control__popover-container">
					<Popover
						className="elio-icon-collection-control__popover"
						placement="left-start"
						offset={ 34 }
						anchor={ anchor }
						focusOnMount={ false }
					>
						<div className="elio-icon-collection-control__preview">
							<CollectionPreview collection={ hovered } />
						</div>
					</Popover>
				</div>
			) }
		</div>
	);
}
