/**
 * SVGR configuration for Elio Blocks icons.
 * Transforms SVG files into React components using `@wordpress/primitives`.
 */
const path = require( 'path' );

module.exports = {
	icon: true,
	expandProps: false,

	svgProps: {
		fill: 'currentColor',
		width: '24',
		height: '24',
		viewBox: '0 0 24 24',
	},

	plugins: [ '@svgr/plugin-jsx' ],

	jsxRuntime: 'automatic',
	jsxRuntimeImport: {
		source: '@wordpress/primitives',
		specifiers: [ 'SVG', 'Path', 'Rect', 'Circle', 'G' ],
	},

	jsx: {
		babelConfig: {
			plugins: [
				[
					path.resolve(
						__dirname,
						'scripts/babel-plugin-transform-wordpress-svg.js'
					),
				],
			],
		},
	},

	replaceAttrValues: {
		'#000': 'currentColor',
		'#000000': 'currentColor',
		black: 'currentColor',
	},

	template: require( './svgr.wp-icon-component-template.js' ),
	filenameCase: 'kebab',
};
