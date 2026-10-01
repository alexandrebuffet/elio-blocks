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
 * - icons.svg: the Elio collection (src/icons/) and the icons of the editor
 *   alone (src/icons/block-editor/, weather-condition-description…) as one
 *   sprite of symbols stroked in currentColor (the page sets their width),
 *   and the plain logo of the admin menu (RegisterOptionsPage::MENU_ICON) as
 *   `elio-menu`.
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
// The icons of the collection, then those the editor alone has
// (src/icons/block-editor/ files that are not a variant of a collection icon).
const slugs = new Set( manifest.icons.map( ( { slug } ) => slug ) );
const files = [
	...[ ...slugs ].map( ( slug ) => [ slug, `src/icons/svg/${ slug }.svg` ] ),
	...readdirSync( join( root, 'src/icons/block-editor' ) )
		.filter( ( file ) => file.endsWith( '.svg' ) )
		.map( ( file ) => file.slice( 0, -4 ) )
		.filter( ( slug ) => ! slugs.has( slug ) )
		.map( ( slug ) => [ slug, `src/icons/block-editor/${ slug }.svg` ] ),
];
const symbols = files.map( ( [ slug, path ] ) => {
	const svg = readFileSync( join( root, path ), 'utf8' );
	// The Figma frame (clipPath) goes, the strokes and fills take the color of
	// the text and the strokes the width the page gives them.
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
// The logo of the admin menu, one color, as WordPress paints it.
const menuIcon = Buffer.from(
	readFileSync(
		join( root, 'includes/Settings/Hooks/RegisterOptionsPage.php' ),
		'utf8'
	).match( /MENU_ICON = 'data:image\/svg\+xml;base64,([^']+)'/ )[ 1 ],
	'base64'
).toString( 'utf8' );
symbols.push(
	menuIcon
		.replace(
			/<svg[^>]*viewBox="([^"]+)"[^>]*>/,
			'<symbol id="elio-menu" viewBox="$1">'
		)
		.replace( '</svg>', '</symbol>' )
		.replace( /fill="black"/g, 'fill="currentColor"' )
);
writeFileSync(
	join( out, 'icons.svg' ),
	`<svg xmlns="http://www.w3.org/2000/svg">${ symbols.join( '' ) }</svg>\n`
);

// The logo of the plugin in the sprite of the page, its tile and its sun as two
// symbols, so the sun can turn on its own (an <img> cannot be animated inside);
// the fill="none" of its root goes on the sun, its circle is a stroke.
const logo = readFileSync(
	join( root, 'src/icons/brand/svg/elio-logo.svg' ),
	'utf8'
);
const logoGradient = logo.match(
	/<linearGradient id="([^"]+)"[\s\S]*?<\/linearGradient>/
);
const logoTile = logo.match( /<rect[^>]*\/>/g );
const logoSun = logo.match( /<path[^>]*\/>/ );
if ( ! logoGradient || ! logoTile || ! logoSun ) {
	throw new Error( 'The logo has no gradient, tile or sun' );
}
const logoSymbols =
	`<defs>${ logoGradient[ 0 ].replace(
		logoGradient[ 1 ],
		'elio-logo-gradient'
	) }</defs>` +
	`<symbol id="elio-logo-tile" viewBox="0 0 128 128">${ logoTile
		.join( '' )
		.replace(
			`url(#${ logoGradient[ 1 ] })`,
			'url(#elio-logo-gradient)'
		) }</symbol>` +
	`<symbol id="elio-logo-sun" viewBox="0 0 128 128" fill="none">${ logoSun[ 0 ] }</symbol>`;

// The FAQ as structured data (schema.org FAQPage), read from the page itself
// so the questions and answers are written once: each <details> of the FAQ,
// its <summary> the question, its text the answer.
const indexPath = join( out, 'index.html' );
const sprite = '<svg class="sprite" aria-hidden="true" focusable="false">';
const page = readFileSync( indexPath, 'utf8' );
if ( ! page.includes( sprite ) ) {
	throw new Error( 'No sprite in index.html' );
}
const index = page.replace( sprite, sprite + logoSymbols );
const text = ( html ) =>
	html
		.replace( /<span class="screen-reader-text">[\s\S]*?<\/span>/g, '' )
		.replace( /<[^>]+>/g, '' )
		.replace( /&nbsp;/g, ' ' )
		.replace( /&amp;/g, '&' )
		.replace( /\s+/g, ' ' )
		.trim();
const faq = [
	...index
		.match(
			/<div class="faq">[\s\S]*?<\/div>\s*<\/div>\s*<\/section>/
		)[ 0 ]
		.matchAll( /<summary>([\s\S]*?)<\/summary>([\s\S]*?)<\/details>/g ),
].map( ( [ , question, answer ] ) => ( {
	'@type': 'Question',
	name: text( question ),
	acceptedAnswer: { '@type': 'Answer', text: text( answer ) },
} ) );
if ( faq.length === 0 ) {
	throw new Error( 'No FAQ found in index.html' );
}
const faqJsonLd = JSON.stringify(
	{ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq },
	null,
	'\t'
).replace( /</g, '\\u003c' );
writeFileSync(
	indexPath,
	index.replace(
		'</head>',
		`\t<script type="application/ld+json">\n${ faqJsonLd }\n\t</script>\n</head>`
	)
);

process.stdout.write( `Site built in ${ out }\n` );
