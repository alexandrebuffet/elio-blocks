/**
 * Vitest config of `wp-scripts test-unit-js`.
 */
import { defineConfig } from 'vitest/config';

export default defineConfig( {
	// The plugin sources write JSX in .js files, which @wordpress/scripts builds with Babel:
	// have Oxc parse them as JSX, and leave node_modules alone.
	oxc: {
		include: /\.jsx?$/,
		exclude: /node_modules/,
		lang: 'jsx',
	},
	test: {
		environment: 'jsdom',
		include: [ 'src/**/test/*.test.js' ],
		setupFiles: [ './src/test-utils/setup.js' ],
	},
} );
