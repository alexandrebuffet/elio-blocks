/**
 * Internal dependencies
 */
import { prefixIconIds } from '../../shared/icon-sprite';

/**
 * Stylesheet of a preview document, after the theme styles when there are:
 * the icons drawn as a condition icon block draws them (fill, or stroke for a
 * stroke collection), in a 2×2 grid filling the frame or in a row.
 */
const PREVIEW_STYLE = `
html, body { margin: 0; }
body.is-grid { display: grid; place-items: center; height: 100vh; color: #1e1e1e; }
body.is-grid .icons { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16%; width: 56%; }
body.is-row { padding: 24px 16px; }
body.is-row .icons { display: flex; justify-content: center; gap: 16px; }
body.is-row .icon { flex: none; width: 48px; }
.icon, .icon svg { display: block; width: 100%; height: auto; aspect-ratio: 1; }
.icon svg { fill: currentColor; }
.icon.is-stroke svg { fill: none; stroke: currentColor; stroke-width: 1.5; }
.icon.is-empty { box-sizing: border-box; border: 1px dashed currentColor; border-radius: 2px; opacity: 0.4; }
`;

/**
 * Builds the document of a preview iframe: the icons of a collection for the
 * conditions of its preview, an empty square where it has none. The icons are the
 * collection's own markup: in their own document, loaded in a sandboxed
 * iframe, they run no script, and their styles and the page's never meet.
 *
 * @param {Array<{content: string, style: string}|null>} preview          Icons of the preview (from the REST API).
 * @param {Object}                                       [options]
 * @param {string}                                       [options.layout] 'grid' (2×2, filling the frame) or 'row'.
 * @param {string}                                       [options.css]    Theme styles, for a preview in the colors of the site.
 * @return {string} HTML document.
 */
export function getIconCollectionPreviewDocument(
	preview = [],
	{ layout = 'grid', css = '' } = {}
) {
	const icons = preview
		.map( ( icon, index ) =>
			icon?.content
				? `<div class="icon${
						icon.style === 'stroke' ? ' is-stroke' : ''
					}">${ prefixIconIds( icon.content, `icon-${ index }` ) }</div>`
				: '<div class="icon is-empty"></div>'
		)
		.join( '' );
	const bodyClass = layout === 'row' ? 'is-row' : 'is-grid';

	return `<!DOCTYPE html><html><head><style>${ css }</style><style>${ PREVIEW_STYLE }</style></head><body class="editor-styles-wrapper ${ bodyClass }"><div class="icons">${ icons }</div></body></html>`;
}
