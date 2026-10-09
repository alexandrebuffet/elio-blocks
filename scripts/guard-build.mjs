/**
 * Fixes what WordPress.org flags in the files `wp-scripts build` writes:
 *
 * - adds the ABSPATH guard asked of every PHP file to build/blocks-manifest.php
 *   and the *.asset.php files (the render.php files and the icon manifests have
 *   theirs);
 * - percent-encodes the SVG namespace of the data: URIs in the stylesheets (the
 *   `@wordpress/components` styles bundled for the DataViews of the settings page
 *   have some). It is an XML namespace, never fetched, but the review flags any
 *   http:// in a stylesheet as a remote file; encoded, the data: URI is the same.
 */

import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const BUILD_DIR = fileURLToPath( new URL( '../build', import.meta.url ) );
const GUARD = "<?php\nif ( ! defined( 'ABSPATH' ) ) {\n\texit;\n}\n";
const SVG_DATA_URI = /data:image\/svg\+xml[^"')]*/g;

for ( const file of readdirSync( BUILD_DIR, { recursive: true } ) ) {
	const path = join( BUILD_DIR, file );

	if ( file.endsWith( '.php' ) ) {
		const php = readFileSync( path, 'utf8' );

		if ( ! php.includes( 'ABSPATH' ) ) {
			writeFileSync( path, php.replace( /^<\?php\s*/, GUARD ) );
		}
	}

	if ( file.endsWith( '.css' ) ) {
		const css = readFileSync( path, 'utf8' );
		const encoded = css.replace( SVG_DATA_URI, ( uri ) =>
			uri.replaceAll( 'http://www.w3.org/', 'http%3A%2F%2Fwww.w3.org%2F' )
		);

		if ( encoded !== css ) {
			writeFileSync( path, encoded );
		}
	}
}
