/**
 * WordPress dependencies
 */
// Import the original config from the @wordpress/scripts package.
const [
	scriptConfig,
	moduleConfig,
] = require( '@wordpress/scripts/config/webpack.config' );
const { getWebpackEntryPoints } = require( '@wordpress/scripts/utils/config' );

/**
 * External dependencies
 */
const path = require( 'path' );

module.exports = [
	{
		...scriptConfig,
		entry: () => ( {
			...getWebpackEntryPoints( 'script' )(),
			'block-editor/index': path.resolve(
				__dirname,
				'src/block-editor/index.js'
			),
			'settings/index': path.resolve(
				__dirname,
				'src/settings/index.js'
			),
			'styles/common': path.resolve(
				__dirname,
				'src/styles/common.scss'
			),
		} ),
	},
	{
		...moduleConfig,
		entry: () => ( {
			...getWebpackEntryPoints( 'module' )(),
		} ),
	},
];
