/**
 * Adds the ABSPATH guard WordPress.org asks of every PHP file to the files
 * `wp-scripts build` writes without one: build/blocks-manifest.php and the
 * *.asset.php files. The render.php files and the icon manifests have theirs.
 */

import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const BUILD_DIR = fileURLToPath( new URL( '../build', import.meta.url ) );
const GUARD = "<?php\nif ( ! defined( 'ABSPATH' ) ) {\n\texit;\n}\n";

for ( const file of readdirSync( BUILD_DIR, { recursive: true } ) ) {
	const path = join( BUILD_DIR, file );

	if ( ! file.endsWith( '.php' ) ) {
		continue;
	}

	const php = readFileSync( path, 'utf8' );

	if ( ! php.includes( 'ABSPATH' ) ) {
		writeFileSync( path, php.replace( /^<\?php\s*/, GUARD ) );
	}
}
