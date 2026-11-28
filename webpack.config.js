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

/**
 * Packages bundled rather than taken from WordPress. `@wordpress/ui`, bundled
 * already, needs `@wordpress/theme`, a `wp-theme` script WordPress only has
 * since 7.1, and both opt in to `@wordpress/private-apis` under names the
 * `wp-private-apis` of WordPress 6.9 and older rejects: there, a script
 * depending on `wp-theme` is never enqueued, and one opting in throws. Their
 * copies keep to themselves: `@wordpress/ui` unlocks only `@wordpress/theme`.
 */
const BUNDLED_PACKAGES = [ '@wordpress/private-apis', '@wordpress/theme' ];

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
		plugins: scriptConfig.plugins.map( ( plugin ) =>
			plugin.constructor.name === 'DependencyExtractionWebpackPlugin'
				? new plugin.constructor( {
						requestToExternal: ( request ) =>
							BUNDLED_PACKAGES.includes( request )
								? false
								: undefined,
					} )
				: plugin
		),
	},
	{
		...moduleConfig,
		entry: () => ( {
			...getWebpackEntryPoints( 'module' )(),
		} ),
	},
];
