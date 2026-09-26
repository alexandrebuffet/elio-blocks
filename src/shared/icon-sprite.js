/**
 * Condition icons as SVG symbols, drawn by <use href="#…"> in the blocks.
 *
 * A directive can set an attribute, not write markup: the server prints each
 * icon once as a <symbol> (IconSprite in PHP) and every condition-icon block,
 * current conditions and forecast rows alike, points at it with the href of
 * its <use> (printed by LinkConditionIcons, kept up to date by
 * callbacks.linkConditionIcon). The page shows the icons before any script runs.
 *
 * Icons that a refresh brings and the page did not print are defined here,
 * before the new weather forecast reaches the blocks.
 */

const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * Root attributes of an icon that belong to the block drawing it (size,
 * stroke width, accessibility), not to the symbol. Same list as IconSprite.
 */
export const BLOCK_OWNED_ATTRIBUTES = [
	'id',
	'class',
	'style',
	'width',
	'height',
	'x',
	'y',
	'stroke-width',
	'role',
	'aria-hidden',
	'aria-label',
	'focusable',
];

/**
 * Returns the id of the symbol of an icon, from its qualified name ("elio/sun"). Same as
 * IconSprite::symbolId() in PHP.
 *
 * @param {string} name Qualified icon name.
 * @return {string} Element id.
 */
export function symbolId( name ) {
	return `elio-condition-icon-${ String( name )
		.replace( /\//g, '--' )
		.replace( /[^A-Za-z0-9_-]/g, '_' ) }`;
}

/**
 * Attributes that point at another element by id: `href="#id"` (and its
 * xlink form). `fill`, `stroke`, `clip-path` and `mask` point at one through
 * `url(#id)` instead, matched separately.
 */
const ID_REFERENCE_ATTRIBUTES = [ 'href', 'xlink:href' ];

/**
 * Returns the id an attribute value points at (`url(#id)` or `#id`), or null.
 *
 * @param {string} attribute Attribute name.
 * @param {string} value     Attribute value.
 * @return {string|null} Referenced id, or null when the attribute holds none.
 */
function referencedId( attribute, value ) {
	if (
		ID_REFERENCE_ATTRIBUTES.includes( attribute.toLowerCase() ) &&
		value.startsWith( '#' )
	) {
		return value.slice( 1 );
	}

	const match = value.match( /^url\((['"]?)#([^)'"]+)\1\)$/ );

	return match ? match[ 2 ] : null;
}

/**
 * Prefixes every inner id of an icon (gradients, clipPaths, masks) with its
 * symbol id, and rewrites what points at them (url(#id), href="#id",
 * xlink:href="#id"), so two icons sharing the same source ids do not collide
 * once both are in the same sprite. Same as IconSprite::symbol() in PHP.
 *
 * @param {SVGSVGElement} svg    Icon root, already stripped of BLOCK_OWNED_ATTRIBUTES.
 * @param {string}        prefix Symbol id of the icon.
 */
export function prefixInnerIds( svg, prefix ) {
	const ids = new Map();

	for ( const element of svg.querySelectorAll( '[id]' ) ) {
		const id = element.getAttribute( 'id' );

		if ( ! ids.has( id ) ) {
			ids.set( id, `${ prefix }-${ id }` );
		}

		element.setAttribute( 'id', ids.get( id ) );
	}

	if ( ids.size === 0 ) {
		return;
	}

	for ( const element of [ svg, ...svg.querySelectorAll( '*' ) ] ) {
		for ( const attribute of element.getAttributeNames() ) {
			const value = element.getAttribute( attribute );
			const referenced = referencedId( attribute, value );

			if ( referenced && ids.has( referenced ) ) {
				element.setAttribute(
					attribute,
					value.replace(
						`#${ referenced }`,
						`#${ ids.get( referenced ) }`
					)
				);
			}
		}
	}
}

/**
 * Prefixes the inner ids of an icon given as markup rather than an element
 * (the collection previews of the settings page and the inspectors, several icons of a
 * collection in one document). Same prefixing as prefixInnerIds(), for markup
 * instead of a live SVG element.
 *
 * @param {string}   svgMarkup Icon SVG markup.
 * @param {string}   prefix    Prefix unique to the icon in its document (e.g. its position).
 * @param {Document} [doc]     Document.
 * @return {string} SVG markup, inner ids prefixed; unchanged when it holds no SVG or no inner id.
 */
export function prefixIconIds( svgMarkup, prefix, doc = document ) {
	const template = doc.createElement( 'template' );
	template.innerHTML = svgMarkup;
	const svg = template.content.querySelector( 'svg' );

	if ( ! svg?.querySelector( '[id]' ) ) {
		return svgMarkup;
	}

	prefixInnerIds( svg, prefix );

	return svg.outerHTML;
}

/**
 * Returns the sprite of a report block, the one the server printed (IconSprite) or one
 * created first in the block, as the server prints it. Hidden by the
 * stylesheet of the block.
 *
 * @param {Element} block Report block.
 * @return {SVGSVGElement} Sprite.
 */
function blockSprite( block ) {
	let sprite = block.querySelector(
		':scope > .wp-block-elio-weather-report__condition-icons-sprite'
	);

	if ( ! sprite ) {
		sprite = block.ownerDocument.createElementNS( SVG_NS, 'svg' );
		sprite.setAttribute(
			'class',
			'wp-block-elio-weather-report__condition-icons-sprite'
		);
		sprite.setAttribute( 'aria-hidden', 'true' );
		sprite.setAttribute( 'focusable', 'false' );
		block.prepend( sprite );
	}

	return sprite;
}

/**
 * Defines the symbols of the icons the page does not have yet, in the sprite
 * of the report block that brought them.
 *
 * @param {Object<string, {content: string}>|null} icons Icons dictionary of a weather forecast, keyed by qualified name.
 * @param {Element}                                block Report block.
 */
export function defineIcons( icons, block ) {
	const doc = block.ownerDocument;

	for ( const [ name, icon ] of Object.entries( icons ?? {} ) ) {
		const id = symbolId( name );

		if ( ! icon?.content || doc.getElementById( id ) ) {
			continue;
		}

		// Sanitized by the server (ConditionIconsRegistry).
		const template = doc.createElement( 'template' );
		template.innerHTML = icon.content;
		const svg = template.content.querySelector( 'svg' );

		if ( ! svg ) {
			continue;
		}

		for ( const attribute of BLOCK_OWNED_ATTRIBUTES ) {
			svg.removeAttribute( attribute );
		}

		prefixInnerIds( svg, id );

		const symbol = doc.createElementNS( SVG_NS, 'symbol' );
		symbol.id = id;
		symbol.appendChild( svg );
		blockSprite( block ).appendChild( symbol );
	}
}
