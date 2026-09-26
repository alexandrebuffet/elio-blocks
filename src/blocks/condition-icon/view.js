/**
 * WordPress dependencies
 */
import { store, getContext, getElement } from '@wordpress/interactivity';

/**
 * Internal dependencies
 */
import { symbolId } from '../../shared/icon-sprite';

/**
 * Returns the icon the item in context points to in the collection of the
 * block: its qualified name and its entry in the icons dictionary of the
 * weather forecast (the style; the SVG itself is a symbol of the page).
 *
 * @return {{name: string|null, style: string}} Icon.
 */
function currentIcon() {
	const { item, query, iconCollection } = getContext();
	const name = item?.condition_icons?.[ iconCollection ] ?? null;

	return {
		name,
		style: ( name && query?.data?.icons?.[ name ]?.style ) || 'fill',
	};
}

/**
 * Returns the accessible name of the icon: the condition, unless the block is
 * decorative or shows no icon.
 *
 * @return {string|null} Label.
 */
function label() {
	const { isDecorative, item } = getContext();

	return (
		( ! isDecorative &&
			currentIcon().name !== null &&
			item?.condition_description ) ||
		null
	);
}

/*
 * The block is an <svg><use></use></svg> in a wrapper that names it: the
 * server prints the attributes in every forecast row, and the browser only
 * changes attributes after a refresh. Getters mirrored server-side by
 * DerivedState.
 */
const { state } = store( 'elio/weather-report', {
	state: {
		get hasConditionIcon() {
			return currentIcon().name !== null;
		},
		get isStrokeConditionIcon() {
			const { name, style } = currentIcon();

			return name !== null && style === 'stroke';
		},
		get conditionIconHref() {
			const { name } = currentIcon();

			return name !== null ? `#${ symbolId( name ) }` : null;
		},
		get conditionIconLabel() {
			return label();
		},
		get conditionIconRole() {
			return label() ? 'img' : null;
		},
	},
	callbacks: {
		/**
		 * Points the <use> of the block at the symbol of its item
		 * (data-wp-watch on the wrapper): WordPress rejects directives inside
		 * an <svg>, so the href cannot be bound. The server printed it
		 * (LinkConditionIcons); this keeps it right after a refresh.
		 */
		linkConditionIcon() {
			const href = state.conditionIconHref;
			const use = getElement().ref?.querySelector( 'use' );

			if ( ! use || use.getAttribute( 'href' ) === href ) {
				return;
			}

			if ( href ) {
				use.setAttribute( 'href', href );
			} else {
				use.removeAttribute( 'href' );
			}
		},
	},
} );
