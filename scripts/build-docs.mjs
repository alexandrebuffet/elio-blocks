/**
 * Writes the reference pages of the handbook (docs/handbook/docs/reference/)
 * from the code, so that they follow each version of the plugin:
 *
 * - blocks.md: the block.json of each block (src/blocks/).
 * - functions.md: the public API of functions.php, from its docblocks.
 * - hooks.md: the actions and filters of the plugin, from their docblocks.
 * - classes.md: the classes a provider is registered with, from their docblocks.
 *
 * A public function or a hook without a docblock fails the build: what is not
 * documented would be missing from the handbook. The pages are generated, not
 * committed (docs/handbook/.gitignore). `npm run build:docs` runs this, then
 * builds the handbook into docs/handbook/build/ (`npm run build:docs --
 * --out-dir <dir>` for another directory, relative to docs/handbook/).
 */

import {
	existsSync,
	mkdirSync,
	readdirSync,
	readFileSync,
	writeFileSync,
} from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

const root = resolve( dirname( fileURLToPath( import.meta.url ) ), '..' );
const out = join( root, 'docs/handbook/docs/reference' );
const SOURCE = 'https://github.com/alexandrebuffet/elio-blocks/blob/main/';
const { version } = JSON.parse(
	readFileSync( join( root, 'package.json' ), 'utf8' )
);

// The classes a provider is registered with (elio_blocks_register_provider()).
const CLASSES = [
	'includes/Provider/Provider.php',
	'includes/Provider/ProviderCredential.php',
	'includes/Provider/ProviderAttribution.php',
	'includes/WeatherForecast/WeatherForecastAdapterInterface.php',
];

/**
 * Splits a PHPDoc type from the text after it: the type ends at the first
 * space outside <>, {} and ().
 *
 * @param {string} text Text starting with a type.
 * @return {[string, string]} The type and the rest.
 */
function splitType( text ) {
	let depth = 0;
	for ( let i = 0; i < text.length; i++ ) {
		if ( '<{('.includes( text[ i ] ) ) {
			depth++;
		} else if ( '>})'.includes( text[ i ] ) ) {
			depth--;
		} else if ( /\s/.test( text[ i ] ) && 0 === depth ) {
			return [ text.slice( 0, i ), text.slice( i ).trim() ];
		}
	}
	return [ text, '' ];
}

/**
 * Reads a docblock: its description lines and its tags.
 *
 * @param {string} raw Text between the opening and closing of the docblock.
 */
function parseDocblock( raw ) {
	const lines = raw
		.split( '\n' )
		.map( ( line ) => line.replace( /^\s*\* ?/, '' ).trimEnd() );
	const description = [];
	const tags = [];
	for ( const line of lines ) {
		const tag = line.match( /^(\s*)@(\w+)\s*(.*)$/ );
		if ( tag ) {
			// An @type line is a key of the array the @param before it describes.
			const entry = { name: tag[ 2 ], text: tag[ 3 ], nested: tag[ 1 ] };
			if ( 'type' === entry.name && tags.length ) {
				tags.at( -1 ).keys.push( entry );
			} else {
				tags.push( { ...entry, keys: [] } );
			}
		} else if ( tags.length ) {
			const last = tags.at( -1 ).keys.at( -1 ) ?? tags.at( -1 );
			if ( '}' !== line.trim() ) {
				last.text = `${ last.text } ${ line.trim() }`.trim();
			}
		} else {
			description.push( line );
		}
	}

	const field = ( entry ) => {
		const [ type, rest ] = splitType( entry.text );
		const name = rest.match( /^(\$\w+)\s*(.*)$/ );
		return {
			type,
			name: name?.[ 1 ] ?? '',
			text: ( name?.[ 2 ] ?? rest ).replace( /\s*\{$/, '' ),
			keys: entry.keys?.map( field ) ?? [],
		};
	};
	const all = ( name ) => tags.filter( ( tag ) => name === tag.name );
	return {
		description,
		params: all( 'param' ).map( field ),
		returns: all( 'return' ).map( field )[ 0 ],
		throws: all( 'throws' ).map( field ),
		since: all( 'since' ).map( ( tag ) => {
			const [ since, ...change ] = tag.text.split( ' ' );
			return { version: since, change: change.join( ' ' ) };
		} ),
	};
}

/**
 * The docblocks of a PHP file, each with the code it documents, up to the
 * `{` or `;` that ends it (a signature over several lines included): `code`
 * on one line, `signature` as written, without its indentation.
 *
 * @param {string} file Path from the root of the plugin.
 */
function docblocks( file ) {
	const source = readFileSync( join( root, file ), 'utf8' );
	return [
		...source.matchAll( /\/\*\*([\s\S]*?)\*\/[ \t]*\n([^;{]*)/g ),
	].map( ( match ) => {
		const lines = match[ 2 ].trimEnd().split( '\n' );
		const indent = Math.min(
			...lines.map( ( line ) => line.match( /^\s*/ )[ 0 ].length )
		);
		return {
			...parseDocblock( match[ 1 ] ),
			code: match[ 2 ].trim().replace( /\s+/g, ' ' ),
			signature: lines
				.map( ( line ) => line.slice( indent ) )
				.join( '\n' ),
			file,
			line: source
				.slice( 0, match.index + match[ 0 ].length - match[ 2 ].length )
				.split( '\n' ).length,
		};
	} );
}

// What reads as code in a docblock: calls, variables, tags, constants, class,
// block and hook names, quoted values, snake_case identifiers.
const CODE = new RegExp(
	[
		/(?:\$\w+->)?[\\\w:]*\w\(\)/,
		/\$\w+(?:->\w+|\['[\w-]+'\])*/,
		/<\/?[a-z][\w-]*[^<>]*>/,
		/\b[A-Z][A-Z0-9_]*(?:\{[A-Z]+\}[A-Z0-9_]*)+/,
		/\\?(?:[A-Z]\w+\\)+[A-Z]\w+/,
		/\belio\/[\w-]+/,
		/'[\w./{}*|-]+'/,
		/\b[a-z][\w/-]*_[\w/-]*\w/,
		/\b(?!WordPress\b|OpenWeatherMap\b)[A-Z][a-z0-9]+(?:[A-Z][a-z0-9]+)+\b/,
	]
		.map( ( pattern ) => pattern.source )
		.join( '|' ),
	'g'
);

/**
 * A line of prose in Markdown: code in backticks, and what MDX would read as
 * JSX or an expression escaped.
 *
 * @param {string} text Prose.
 */
function inline( text ) {
	const escape = ( prose ) => prose.replace( /([{}<>])/g, '\\$1' );
	let markdown = '';
	let last = 0;
	for ( const match of text.matchAll( CODE ) ) {
		markdown +=
			escape( text.slice( last, match.index ) ) + `\`${ match[ 0 ] }\``;
		last = match.index + match[ 0 ].length;
	}
	return markdown + escape( text.slice( last ) );
}

/**
 * The description of a docblock in Markdown: its paragraphs, its lists, and
 * its examples (lines indented after a blank line) as PHP code.
 *
 * @param {string[]} lines Description lines of a docblock.
 */
function describe( lines ) {
	const blocks = [];
	let current = null;
	let previous = '';
	for ( const line of lines ) {
		const indented = /^\s{2,}\S/.test( line );
		if ( indented && ( 'code' === current?.kind || '' === previous ) ) {
			if ( 'code' !== current?.kind ) {
				current = { kind: 'code', lines: [] };
				blocks.push( current );
			}
			current.lines.push( line );
		} else if ( '' === line ) {
			if ( 'code' === current?.kind ) {
				current.lines.push( line );
			} else {
				current = null;
			}
		} else if ( line.startsWith( '- ' ) ) {
			current = { kind: 'item', lines: [ line.slice( 2 ) ] };
			blocks.push( current );
		} else {
			if ( ! current || 'code' === current.kind ) {
				current = { kind: 'text', lines: [] };
				blocks.push( current );
			}
			current.lines.push( line.trim() );
		}
		previous = line;
	}

	return blocks
		.map( ( block ) => {
			if ( 'code' === block.kind ) {
				const code = block.lines.join( '\n' ).trimEnd().split( '\n' );
				const indent = Math.min(
					...code
						.filter( Boolean )
						.map( ( line ) => line.match( /^\s*/ )[ 0 ].length )
				);
				return [
					'```php',
					...code.map( ( line ) => line.slice( indent ) ),
					'```',
				].join( '\n' );
			}
			const text = inline( block.lines.join( ' ' ) );
			return 'item' === block.kind ? `- ${ text }` : text;
		} )
		.join( '\n\n' )
		.replace( /^(- .*)\n\n(?=- )/gm, '$1\n' );
}

/**
 * Parameters, return value, exceptions and versions of a docblock.
 *
 * @param {Object} doc Parsed docblock.
 */
function details( doc ) {
	const field = ( { name, type, text, keys }, depth = 0 ) =>
		[
			`${ '  '.repeat( depth ) }- ${ [ name, type ]
				.filter( Boolean )
				.map(
					( code ) =>
						`\`${ code.replace( /^\$(?=\w+$)/, depth ? '' : '$' ) }\``
				)
				.join( ' ' ) }${ text ? `: ${ inline( text ) }` : '' }`,
			...keys.map( ( key ) => field( key, depth + 1 ) ),
		].join( '\n' );

	const parts = [];
	if ( doc.params.length ) {
		parts.push(
			'**Parameters**',
			doc.params.map( ( param ) => field( param ) ).join( '\n' )
		);
	}
	if ( doc.returns && 'void' !== doc.returns.type ) {
		parts.push(
			`**Returns** \`${ doc.returns.type }\`${
				doc.returns.text ? `: ${ inline( doc.returns.text ) }` : ''
			}`
		);
	}
	if ( doc.throws.length ) {
		parts.push(
			'**Throws**',
			doc.throws.map( ( thrown ) => field( thrown ) ).join( '\n' )
		);
	}
	if ( doc.since.length ) {
		parts.push(
			doc.since
				.map(
					( { version: since, change } ) =>
						`**Since** ${ since }${ change ? `: ${ inline( change ) }` : '' }`
				)
				.join( '  \n' )
		);
	}
	parts.push( `[Source](${ SOURCE }${ doc.file }#L${ doc.line })` );
	return parts.join( '\n\n' );
}

/**
 * A reference page: its front matter (not editable on GitHub, since it is
 * generated) and its sections.
 *
 * @param {string}   slug     File name, without extension.
 * @param {string}   title    Title of the page.
 * @param {string}   intro    Paragraph under the title.
 * @param {string[]} sections Markdown of each section.
 */
function writePage( slug, title, intro, sections ) {
	writeFileSync(
		join( out, `${ slug }.md` ),
		[
			`---\ntitle: ${ title }\ncustom_edit_url: null\n---`,
			`${ intro } Generated from the code of Elio Blocks ${ version }.`,
			...sections,
		].join( '\n\n' ) + '\n'
	);
}

/**
 * A row of a Markdown table, its cells with their pipes escaped.
 *
 * @param {string[]} cells Cells of the row.
 */
function row( cells ) {
	return `| ${ cells
		.map( ( cell ) => cell.replace( /\|/g, '\\|' ) )
		.join( ' | ' ) } |`;
}

/**
 * What a block supports, from the supports of its block.json: the keys set,
 * without their __experimental prefix nor what only concerns the editor and
 * the markup (controls shown by default, serialization skipped).
 *
 * @param {Object} supports Supports of a block.json.
 */
function supportsOf( supports ) {
	return Object.entries( supports )
		.filter( ( [ , value ] ) => false !== value )
		.map( ( [ key, value ] ) => {
			const name = key.replace( /^__experimental(\w)/, ( _, first ) =>
				first.toLowerCase()
			);
			if ( 'object' !== typeof value || Array.isArray( value ) ) {
				return Array.isArray( value )
					? `${ name } (${ value.join( ', ' ) })`
					: name;
			}
			const keys = Object.keys( value )
				.filter(
					( sub ) =>
						false !== value[ sub ] &&
						! /^(__experimental)?(DefaultControls|[sS]kipSerialization)$/.test(
							sub
						)
				)
				.map( ( sub ) =>
					sub.replace( /^__experimental(\w)/, ( _, first ) =>
						first.toLowerCase()
					)
				);
			return keys.length ? `${ name } (${ keys.join( ', ' ) })` : name;
		} )
		.join( ', ' );
}

function blocksPage() {
	const dir = join( root, 'src/blocks' );
	const blocks = readdirSync( dir )
		.filter( ( name ) => existsSync( join( dir, name, 'block.json' ) ) )
		.map( ( name ) =>
			JSON.parse(
				readFileSync( join( dir, name, 'block.json' ), 'utf8' )
			)
		)
		// The containers first, then the blocks inside them, by title.
		.sort(
			( a, b ) =>
				Number( !! ( a.parent || a.ancestor ) ) -
					Number( !! ( b.parent || b.ancestor ) ) ||
				a.title.localeCompare( b.title )
		);

	const code = ( values ) =>
		values.map( ( value ) => `\`${ value }\`` ).join( ', ' );
	return blocks.map( ( block ) => {
		const lines = [
			`## ${ block.title }`,
			`\`${ block.name }\``,
			inline( block.description ),
		];
		const facts = [
			[ 'Parent', block.parent && code( block.parent ) ],
			[ 'Ancestor', block.ancestor && code( block.ancestor ) ],
			[
				'Provides context',
				block.providesContext &&
					code( Object.keys( block.providesContext ) ),
			],
			[
				'Uses context',
				block.usesContext?.length && code( block.usesContext ),
			],
			[ 'Supports', block.supports && supportsOf( block.supports ) ],
		].filter( ( [ , value ] ) => value );
		lines.push(
			facts
				.map( ( [ label, value ] ) => `**${ label }:** ${ value }` )
				.join( '  \n' )
		);

		const attributes = Object.entries( block.attributes ?? {} );
		if ( attributes.length ) {
			lines.push(
				[
					row( [ 'Attribute', 'Type', 'Default', 'Values' ] ),
					row( [ '---', '---', '---', '---' ] ),
					...attributes.map( ( [ name, attribute ] ) =>
						row( [
							`\`${ name }\``,
							[ attribute.type ]
								.flat()
								.filter( Boolean )
								.join( ', ' ),
							undefined === attribute.default
								? ''
								: `\`${ JSON.stringify( attribute.default ) }\``,
							attribute.enum ? code( attribute.enum ) : '',
						] )
					),
				].join( '\n' )
			);
		}
		return lines.join( '\n\n' );
	} );
}

function functionsPage() {
	const source = readFileSync( join( root, 'functions.php' ), 'utf8' );
	const documented = docblocks( 'functions.php' ).filter( ( doc ) =>
		doc.code.startsWith( 'function ' )
	);
	const missing = [ ...source.matchAll( /^function (\w+)/gm ) ]
		.map( ( match ) => match[ 1 ] )
		.filter(
			( name ) =>
				! documented.some( ( doc ) =>
					doc.code.startsWith( `function ${ name }(` )
				)
		);
	if ( missing.length ) {
		throw new Error(
			`functions.php: no docblock for ${ missing.join( ', ' ) }`
		);
	}

	return documented.map( ( doc ) => {
		const name = doc.code.match( /^function (\w+)/ )[ 1 ];
		return [
			`## \`${ name }()\``,
			[ '```php', doc.signature, '```' ].join( '\n' ),
			describe( doc.description ),
			details( doc ),
		]
			.filter( Boolean )
			.join( '\n\n' );
	} );
}

function hooksPage() {
	const files = [
		'functions.php',
		...readdirSync( join( root, 'includes' ), { recursive: true } )
			.filter( ( file ) => file.endsWith( '.php' ) )
			.map( ( file ) => `includes/${ file }` ),
	].sort();
	const HOOK = /\b(do_action|apply_filters)\(\s*'(elio_blocks[\w/]*)'/;

	const hooks = files.flatMap( ( file ) =>
		docblocks( file )
			.filter( ( doc ) => HOOK.test( doc.code ) )
			.map( ( doc ) => {
				const [ , call, name ] = doc.code.match( HOOK );
				return {
					...doc,
					name,
					type: 'do_action' === call ? 'Action' : 'Filter',
				};
			} )
	);
	const missing = files.flatMap( ( file ) =>
		[
			...readFileSync( join( root, file ), 'utf8' ).matchAll(
				new RegExp( HOOK, 'g' )
			),
		]
			.map( ( match ) => match[ 2 ] )
			.filter(
				( name ) => ! hooks.some( ( hook ) => name === hook.name )
			)
	);
	if ( missing.length ) {
		throw new Error(
			`No docblock for the hooks ${ missing.join( ', ' ) }`
		);
	}

	return hooks
		.sort(
			( a, b ) =>
				a.type.localeCompare( b.type ) || a.name.localeCompare( b.name )
		)
		.map( ( hook ) =>
			[
				`## \`${ hook.name }\``,
				`${ hook.type }, with \`${ 'Action' === hook.type ? 'add_action' : 'add_filter' }()\`.`,
				describe( hook.description ),
				details( hook ),
			]
				.filter( Boolean )
				.join( '\n\n' )
		);
}

function classesPage() {
	return CLASSES.map( ( file ) => {
		const namespace = readFileSync( join( root, file ), 'utf8' ).match(
			/^namespace ([\w\\]+);/m
		)[ 1 ];
		const docs = docblocks( file );
		const type = docs.find( ( doc ) =>
			/^(?:final |abstract )?(?:class|interface) \w+/.test( doc.code )
		);
		const name = type.code.match( /(?:class|interface) (\w+)/ )[ 1 ];
		const methods = docs
			.filter( ( doc ) => /\bpublic function \w+/.test( doc.code ) )
			.map( ( doc ) => {
				const method = doc.code.match( /function (\w+)/ )[ 1 ];
				return [
					`### \`${ name }::${ method }()\``,
					[ '```php', doc.signature, '```' ].join( '\n' ),
					describe( doc.description ),
					details( doc ),
				]
					.filter( Boolean )
					.join( '\n\n' );
			} );
		return [
			`## \`${ name }\``,
			`\`${ namespace }\\${ name }\``,
			describe( type.description ),
			details( type ),
			...methods,
		]
			.filter( Boolean )
			.join( '\n\n' );
	} );
}

mkdirSync( out, { recursive: true } );
writePage(
	'blocks',
	'Blocks',
	'The blocks of Elio Blocks, their attributes and what they support, from their `block.json`.',
	blocksPage()
);
writePage(
	'functions',
	'Functions',
	'The public API of Elio Blocks: the functions that register providers and condition icons, and the ones the blocks read what they print with.',
	functionsPage()
);
writePage(
	'hooks',
	'Hooks',
	'The actions and filters of Elio Blocks.',
	hooksPage()
);
writePage(
	'classes',
	'Classes',
	'The classes a provider is registered with, and the interface its weather forecast adapter implements.',
	classesPage()
);
