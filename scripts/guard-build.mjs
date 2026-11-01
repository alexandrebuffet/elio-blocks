/**
 * Fixes, or fails on, what WordPress.org flags in the files `wp-scripts build`
 * writes, and what it shows of them:
 *
 * - adds the ABSPATH guard asked of every PHP file to build/blocks-manifest.php
 *   and the *.asset.php files (the render.php files and the icon manifests have
 *   theirs);
 * - writes the SVG data: URIs of the stylesheets in base64: the review flags any
 *   http address in a stylesheet as a remote file, even the XML namespace of an
 *   SVG percent-encoded, which is never fetched (the `@wordpress/components`
 *   styles have some, bundled for the copy of the components the DataViews of
 *   the settings page bring, which the styles WordPress loads do not match);
 * - fails on a stylesheet still naming an http(s) address;
 * - puts in the `icon` of each build/blocks/<block>/block.json the SVG of the
 *   icon its index.js gives registerBlockType() (src/icons/components/<name>,
 *   built from build/icons/block-editor/<name>.svg): the plugin page reads the
 *   block icons from block.json and runs no JavaScript, so it would show the
 *   dashicon the source declares. The editor keeps the one of index.js. Its
 *   viewBox is cropped to the square around the drawing: the plugin page fits
 *   a block icon SVG in 16px, where a dashicon draws at 20px.
 */

import { existsSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import { createRequire } from 'module';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const require = createRequire( import.meta.url );
const canvasKitPath = require.resolve( 'canvaskit-wasm/bin/canvaskit.js' );
const CanvasKit = await require( canvasKitPath )( {
	locateFile: ( file ) => join( dirname( canvasKitPath ), file ),
} );

const BUILD_DIR = fileURLToPath( new URL( '../build', import.meta.url ) );
const SRC_BLOCKS_DIR = fileURLToPath(
	new URL( '../src/blocks', import.meta.url )
);
const GUARD = "<?php\nif ( ! defined( 'ABSPATH' ) ) {\n\texit;\n}\n";
const SVG_DATA_URI = /url\((["']?)data:image\/svg\+xml[^,]*,([^"')]*)\1\)/g;
const ADDRESS = /https?(:|%3A)/i;

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
		const encoded = css.replace(
			SVG_DATA_URI,
			( uri, quote, svg ) =>
				`url(${ quote }data:image/svg+xml;base64,${ Buffer.from(
					decodeURIComponent( svg )
				).toString( 'base64' ) }${ quote })`
		);

		if ( ADDRESS.test( encoded ) ) {
			throw new Error( `build/${ file } names an http(s) address.` );
		}

		if ( encoded !== css ) {
			writeFileSync( path, encoded );
		}
	}
}

for ( const block of readdirSync( SRC_BLOCKS_DIR ) ) {
	const indexPath = join( SRC_BLOCKS_DIR, block, 'index.js' );
	if ( ! existsSync( indexPath ) ) {
		continue;
	}
	const index = readFileSync( indexPath, 'utf8' );
	const icon = index.match( /^\s*icon: (\w+),/m )?.[ 1 ];
	const name = index.match(
		new RegExp( `import ${ icon } from '[./]+/icons/components/([\\w-]+)'` )
	)?.[ 1 ];

	if ( ! name ) {
		continue;
	}

	const path = join( BUILD_DIR, 'blocks', block, 'block.json' );
	const metadata = JSON.parse( readFileSync( path, 'utf8' ) );
	const svg = readFileSync(
		join( BUILD_DIR, 'icons/block-editor', `${ name }.svg` ),
		'utf8'
	).trim();
	const [ left, top, right, bottom ] = [ ...svg.matchAll( / d="([^"]+)"/g ) ]
		.map( ( [ , d ] ) =>
			CanvasKit.Path.MakeFromSVGString( d ).computeTightBounds()
		)
		.reduce( ( a, b ) => [
			Math.min( a[ 0 ], b[ 0 ] ),
			Math.min( a[ 1 ], b[ 1 ] ),
			Math.max( a[ 2 ], b[ 2 ] ),
			Math.max( a[ 3 ], b[ 3 ] ),
		] );
	// A quarter unit of margin, or the antialiasing of the edges is cut.
	const size = Math.max( right - left, bottom - top ) + 0.5;
	const viewBox = [
		( left + right - size ) / 2,
		( top + bottom - size ) / 2,
		size,
		size,
	].map( ( value ) => +value.toFixed( 2 ) );
	metadata.icon = svg.replace(
		'viewBox="0 0 24 24"',
		`viewBox="${ viewBox.join( ' ' ) }"`
	);
	writeFileSync( path, JSON.stringify( metadata, null, '\t' ) + '\n' );
}
