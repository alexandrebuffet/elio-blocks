/**
 * SVGR config for weather-report block variation icons.
 * Same as svgr.config.js but preserves width, height, and viewBox from the source SVG.
 * runtimeConfig is disabled so transform.sync does not re-merge project svgr.config.js
 * (which would override svgProps and force 24×24).
 * icon is disabled so SVGR does not replace root dimensions with 1em (keeps numeric width/height from the SVG).
 * replaceAttrValues is cleared so Path nodes do not get redundant fill="currentColor"; SVGO strips descendant fills so color inherits from the root SVG only.
 */
const base = require( './svgr.config.js' );

module.exports = {
	...base,
	runtimeConfig: false,
	icon: false,
	replaceAttrValues: {},
	svgProps: {
		fill: 'currentColor',
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
			{
				name: 'removeAttrs',
				params: {
					attrs: '(path|rect|circle|ellipse|polygon|polyline|line):fill',
				},
			},
		],
	},
	plugins: [ '@svgr/plugin-svgo', '@svgr/plugin-jsx' ],
};
