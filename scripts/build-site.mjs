/**
 * Builds the presentation site of the plugin (GitHub Pages) into _site/, or
 * the directory given as first argument.
 *
 * docs/site/ holds the pages, their styles and scripts. What the plugin
 * already has is taken from its sources, not copied into docs/site/:
 *
 * - assets/wporg/: the screenshots and icons of the WordPress.org page
 *   (.wordpress-org/).
 * - favicon.svg: the plugin logo (src/icons/brand/).
 * - blueprint.json: the Playground blueprint of the WordPress.org Live
 *   Preview, which the "Try it live" links load with the plugin zip of the
 *   site in place of the WordPress.org slug.
 * - icons.svg: the Elio collection (src/icons/) as one sprite of symbols
 *   stroked in currentColor (the page sets their width).
 *
 * The deploy workflow adds elio-blocks.zip, the package of the plugin, next to
 * index.html. Preview locally with `npm run build:site`, then serve _site/.
 */

import {
	copyFileSync,
	cpSync,
	mkdirSync,
	readdirSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

const root = resolve( dirname( fileURLToPath( import.meta.url ) ), '..' );
const out = resolve( root, process.argv[ 2 ] ?? '_site' );

rmSync( out, { recursive: true, force: true } );
cpSync( join( root, 'docs/site' ), out, { recursive: true } );

const wporg = join( root, '.wordpress-org' );
mkdirSync( join( out, 'assets/wporg' ), { recursive: true } );
for ( const file of readdirSync( wporg ) ) {
	if ( /^screenshot-\d+\.png$/.test( file ) ) {
		copyFileSync( join( wporg, file ), join( out, 'assets/wporg', file ) );
	}
}
copyFileSync(
	join( root, 'src/icons/brand/svg/elio-logo.svg' ),
	join( out, 'favicon.svg' )
);
copyFileSync(
	join( wporg, 'blueprints/blueprint.json' ),
	join( out, 'blueprint.json' )
);

const manifest = JSON.parse(
	readFileSync( join( root, 'src/icons/manifest.json' ), 'utf8' )
);
const symbols = manifest.icons.map( ( { slug } ) => {
	const svg = readFileSync(
		join( root, 'src/icons/svg', `${ slug }.svg` ),
		'utf8'
	);
	// The Figma frame (clipPath) goes, the strokes take the color of the text
	// and the width the page gives them (the icon block has a stroke width).
	const body = svg
		.replace( /^[\s\S]*?<svg[^>]*>/, '' )
		.replace( /<\/svg>\s*$/, '' )
		.replace( /<defs>[\s\S]*?<\/defs>/g, '' )
		.replace( /<g clip-path="[^"]*">([\s\S]*?)<\/g>/g, '$1' )
		.replace( /(stroke|fill)="black"/g, '$1="currentColor"' )
		.replace( / stroke-width="[^"]*"/g, '' )
		.trim();
	return `<symbol id="${ slug }" viewBox="0 0 24 24" fill="none">${ body }</symbol>`;
} );
writeFileSync(
	join( out, 'icons.svg' ),
	`<svg xmlns="http://www.w3.org/2000/svg">${ symbols.join( '' ) }</svg>\n`
);

process.stdout.write( `Site built in ${ out }\n` );
