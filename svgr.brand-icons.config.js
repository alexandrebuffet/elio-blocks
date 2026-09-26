/**
 * SVGR config for the brand icons (the plugin logo).
 * Same as svgr.config.js but keeps the colors, the gradient and the viewBox of the source SVG:
 * only the rendered size is set, to 24×24.
 * runtimeConfig is disabled so transform.sync does not re-merge project svgr.config.js
 * (which would override svgProps and force a 24×24 viewBox).
 * icon is disabled so SVGR does not replace root dimensions with 1em.
 * replaceAttrValues is cleared so colors are not turned into currentColor.
 * prefixIds gives the gradient an id specific to the file, so it does not clash with other SVGs of the page.
 */
const base = require( './svgr.config.js' );

module.exports = {
	...base,
	runtimeConfig: false,
	icon: false,
	replaceAttrValues: {},
	svgProps: {
		width: '24',
		height: '24',
	},
	jsxRuntimeImport: {
		source: '@wordpress/primitives',
		specifiers: [ 'SVG', 'Path', 'Rect', 'Defs', 'LinearGradient', 'Stop' ],
	},
	svgo: true,
	svgoConfig: {
		plugins: [
			{
				name: 'preset-default',
				params: {
					overrides: {
						removeViewBox: false,
					},
				},
			},
			'prefixIds',
		],
	},
	plugins: [ '@svgr/plugin-svgo', '@svgr/plugin-jsx' ],
};
