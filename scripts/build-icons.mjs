/**
 * Builds the icons of the plugin from the Elio collection in src/icons/:
 * manifest.json (the inventory: the label of each icon, the conditions some
 * represent, the stroke width they are drawn with), svg/ (the Figma export,
 * one stroked SVG per icon) and block-editor/ (the block icons of the editor
 * drawn in the style of the WordPress icons: a variant of an icon of the
 * collection, under the same name, or an icon the editor alone needs).
 *
 * One source, three outputs:
 *
 * - build/weather-condition-icons/elio/ and build/weather-condition-icons-manifest.php:
 *   the icons the condition mappings name, kept as strokes in currentColor,
 *   without stroke-width (the condition icon block sets it), which
 *   RegisterConditionIcons registers in ConditionIconsRegistry.
 * - build/icons/elio/ and build/icons-manifest.php: every icon as a filled
 *   outline, the strokes outlined by Skia (canvaskit-wasm, the engine Figma
 *   draws with), for the Icons API of WordPress 7.1, which keeps nothing but
 *   <path> and <polygon> fills; RegisterIconCollection registers them.
 * - build/icons/block-editor/: the same outlines, the block-editor variant in
 *   place of its icon, plus the icons of the editor alone, which SVGR turns
 *   into src/icons/components/ (npm run build:icons). The components of icons
 *   that are gone are removed.
 *
 * The export is checked, not fixed: a viewBox other than 0 0 24 24, an element
 * other than <path> (the clipPath Figma adds for the frame is ignored), a color
 * other than black, a transform, a file the manifest does not list or an icon
 * without a file fail the build with the file named, so the source stays what
 * the designer exported.
 */

import {
	existsSync,
	mkdirSync,
	readdirSync,
	readFileSync,
	rmSync,
	unlinkSync,
	writeFileSync,
} from 'fs';
import { createRequire } from 'module';
import { basename, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { optimize } from 'svgo';

const require = createRequire( import.meta.url );
const __dirname = dirname( fileURLToPath( import.meta.url ) );
const ROOT = resolve( __dirname, '..' );

const SRC_DIR = resolve( ROOT, 'src/icons' );
const MANIFEST_JSON = resolve( SRC_DIR, 'manifest.json' );
const SVG_DIR = resolve( SRC_DIR, 'svg' );
const VARIANTS_DIR = resolve( SRC_DIR, 'block-editor' );
const COMPONENTS_DIR = resolve( SRC_DIR, 'components' );

const CONDITION_BUILD_DIR = resolve( ROOT, 'build/weather-condition-icons' );
const CONDITION_MANIFEST_PHP = resolve(
	ROOT,
	'build/weather-condition-icons-manifest.php'
);
const ICONS_BUILD_DIR = resolve( ROOT, 'build/icons' );
const ICONS_MANIFEST_PHP = resolve( ROOT, 'build/icons-manifest.php' );
const VARIANTS_BUILD_DIR = resolve( ICONS_BUILD_DIR, 'block-editor' );

const VIEW_BOX = '0 0 24 24';
const BLACK = [ 'black', '#000', '#000000', 'currentColor' ];
const PATH_ATTRIBUTES = [
	'd',
	'stroke',
	'stroke-width',
	'stroke-linecap',
	'stroke-linejoin',
	'stroke-miterlimit',
	'fill',
	'fill-rule',
	'clip-rule',
];
const DAY_OR_NIGHT = [ 'day', 'night', 'all' ];

const errors = [];

/**
 * Records a problem; the build fails once everything has been checked.
 *
 * @param {string} message Problem, naming the file.
 */
function problem( message ) {
	errors.push( message );
}

/**
 * Escapes a string for use inside a PHP single-quoted string.
 *
 * @param {string} str String to escape.
 * @return {string} Escaped string.
 */
function escapeSingleQuote( str ) {
	return str.replace( /\\/g, '\\\\' ).replace( /'/g, "\\'" );
}

// -----------------------------------------------------------------------------
// The manifest and the files
// -----------------------------------------------------------------------------

const manifest = JSON.parse( readFileSync( MANIFEST_JSON, 'utf8' ) );
const {
	slug,
	label,
	description = '',
	strokeWidth,
	icons,
	conditionMappings,
} = manifest;

if (
	typeof slug !== 'string' ||
	typeof label !== 'string' ||
	typeof description !== 'string' ||
	! ( Number.isFinite( strokeWidth ) && strokeWidth > 0 ) ||
	! Array.isArray( icons ) ||
	! Array.isArray( conditionMappings )
) {
	process.stderr.write(
		`Error: ${ MANIFEST_JSON } must have "slug", "label", "description", a positive "strokeWidth", "icons" and "conditionMappings".\n`
	);
	process.exit( 1 );
}

const slugs = new Set();
for ( const icon of icons ) {
	if ( typeof icon?.slug !== 'string' || typeof icon?.label !== 'string' ) {
		problem(
			`manifest.json: every icon needs a "slug" and a "label" (${ JSON.stringify( icon ) })`
		);
		continue;
	}
	if ( slugs.has( icon.slug ) ) {
		problem( `manifest.json: icon "${ icon.slug }" is listed twice` );
	}
	slugs.add( icon.slug );
	if ( ! existsSync( resolve( SVG_DIR, `${ icon.slug }.svg` ) ) ) {
		problem(
			`manifest.json: icon "${ icon.slug }" has no src/icons/svg/${ icon.slug }.svg`
		);
	}
}

const svgFiles = ( dir ) =>
	readdirSync( dir ).filter( ( file ) => file.endsWith( '.svg' ) );

for ( const file of svgFiles( SVG_DIR ) ) {
	if ( ! slugs.has( basename( file, '.svg' ) ) ) {
		problem( `src/icons/svg/${ file }: not listed in manifest.json` );
	}
}

// A block-editor file named as an icon of the collection replaces it in the
// editor; any other is an icon of the editor alone.
const blockEditorIcons = svgFiles( VARIANTS_DIR ).map( ( file ) =>
	basename( file, '.svg' )
);
const variants = new Set(
	blockEditorIcons.filter( ( name ) => slugs.has( name ) )
);
const editorOnly = blockEditorIcons.filter( ( name ) => ! slugs.has( name ) );

const conditionIconSlugs = new Set();
for ( const mapping of conditionMappings ) {
	const { condition, dayOrNight, iconSlug } = mapping ?? {};
	if (
		typeof condition !== 'string' ||
		! DAY_OR_NIGHT.includes( dayOrNight ) ||
		typeof iconSlug !== 'string'
	) {
		problem(
			`manifest.json: a condition mapping needs a "condition", a "dayOrNight" (day, night or all) and an "iconSlug" (${ JSON.stringify( mapping ) })`
		);
		continue;
	}
	if ( ! slugs.has( iconSlug ) ) {
		problem(
			`manifest.json: condition "${ condition }" maps to an unknown icon "${ iconSlug }"`
		);
	}
	conditionIconSlugs.add( iconSlug );
}

// -----------------------------------------------------------------------------
// Reading an export: its paths, and nothing the pipeline does not understand
// -----------------------------------------------------------------------------

/**
 * @typedef {Object} IconPath
 * @property {string}  d        Path data.
 * @property {boolean} stroke   Whether the path is stroked.
 * @property {number}  width    Stroke width.
 * @property {string}  cap      Line cap: butt, round or square.
 * @property {string}  join     Line join: miter, round or bevel.
 * @property {number}  miter    Miter limit.
 * @property {boolean} fill     Whether the path is filled.
 * @property {string}  fillRule Fill rule: nonzero or evenodd.
 */

/**
 * Reads the paths of an exported SVG and reports what it should not contain.
 *
 * Figma wraps a frame that clips its content in <g clip-path> with a
 * <clipPath><rect> of the frame: ignored, the viewBox clips the same.
 *
 * @param {string} svg  SVG markup.
 * @param {string} file Path of the file, for the report.
 * @return {IconPath[]} Paths, in document order.
 */
function readPaths( svg, file ) {
	const paths = [];

	optimize( svg, {
		plugins: [
			{
				name: 'readPaths',
				fn: () => ( {
					element: {
						enter( node, parentNode ) {
							const { name, attributes } = node;

							if ( name === 'svg' ) {
								if ( attributes.viewBox !== VIEW_BOX ) {
									problem(
										`${ file }: viewBox is "${ attributes.viewBox }", expected "${ VIEW_BOX }"`
									);
								}
								return;
							}
							if ( name === 'defs' || name === 'clipPath' ) {
								return;
							}
							if (
								name === 'rect' &&
								parentNode.name === 'clipPath'
							) {
								return;
							}
							if ( name === 'g' ) {
								const extra = Object.keys( attributes ).filter(
									( key ) => key !== 'clip-path'
								);
								if ( extra.length ) {
									problem(
										`${ file }: <g> with ${ extra.join( ', ' ) }`
									);
								}
								return;
							}
							if ( name === 'mask' ) {
								problem(
									`${ file }: <mask>: a stroke aligned inside or outside in Figma, which SVG can only express with a mask; center it, or outline it`
								);
								return;
							}
							if ( parentNode.name === 'mask' ) {
								return;
							}
							if ( name !== 'path' ) {
								problem(
									`${ file }: <${ name }> is not supported, only <path>`
								);
								return;
							}

							for ( const key of Object.keys( attributes ) ) {
								if ( ! PATH_ATTRIBUTES.includes( key ) ) {
									problem(
										`${ file }: <path ${ key }> is not supported`
									);
								}
							}

							const stroke =
								attributes.stroke &&
								attributes.stroke !== 'none'
									? attributes.stroke
									: null;
							const fill =
								attributes.fill && attributes.fill !== 'none'
									? attributes.fill
									: null;
							for ( const color of [ stroke, fill ] ) {
								if ( color && ! BLACK.includes( color ) ) {
									problem(
										`${ file }: color "${ color }" (a knockout?), expected black`
									);
								}
							}

							paths.push( {
								d: attributes.d ?? '',
								stroke: Boolean( stroke ),
								width: parseFloat(
									attributes[ 'stroke-width' ] ?? '1'
								),
								cap: attributes[ 'stroke-linecap' ] ?? 'butt',
								join:
									attributes[ 'stroke-linejoin' ] ?? 'miter',
								miter: parseFloat(
									attributes[ 'stroke-miterlimit' ] ?? '4'
								),
								fill: Boolean( fill ),
								fillRule:
									attributes[ 'fill-rule' ] ?? 'nonzero',
							} );
						},
					},
				} ),
			},
		],
	} );

	return paths;
}

// -----------------------------------------------------------------------------
// Skia: strokes to outlines
// -----------------------------------------------------------------------------

const canvasKitPath = require.resolve( 'canvaskit-wasm/bin/canvaskit.js' );
const CanvasKit = await require( canvasKitPath )( {
	locateFile: ( file ) => resolve( dirname( canvasKitPath ), file ),
} );

const CAPS = {
	butt: CanvasKit.StrokeCap.Butt,
	round: CanvasKit.StrokeCap.Round,
	square: CanvasKit.StrokeCap.Square,
};
const JOINS = {
	miter: CanvasKit.StrokeJoin.Miter,
	round: CanvasKit.StrokeJoin.Round,
	bevel: CanvasKit.StrokeJoin.Bevel,
};

/**
 * Unites two paths, freeing them.
 *
 * @param {Object|null} a A path, or nothing yet.
 * @param {Object}      b Another path.
 * @return {Object} Their union.
 */
function unite( a, b ) {
	if ( ! a ) {
		return b;
	}
	const union = CanvasKit.Path.MakeFromOp( a, b, CanvasKit.PathOp.Union );
	a.delete();
	b.delete();
	return union;
}

/**
 * Outlines the paths of an icon as one filled path: each stroke becomes the
 * area it paints (its width, caps and joins, as Figma's "Outline stroke"),
 * united with the filled paths, then simplified into non-overlapping contours.
 *
 * @param {IconPath[]} paths Paths of the icon.
 * @return {{ d: string, fillRule: string }} Path data and its fill rule.
 */
function outline( paths ) {
	let area = null;

	for ( const path of paths ) {
		if ( path.fill ) {
			const filled = CanvasKit.Path.MakeFromSVGString( path.d );
			filled.setFillType(
				path.fillRule === 'evenodd'
					? CanvasKit.FillType.EvenOdd
					: CanvasKit.FillType.Winding
			);
			area = unite( area, filled );
		}
		if ( path.stroke ) {
			const stroked = CanvasKit.Path.MakeFromSVGString(
				path.d
			).makeStroked( {
				width: path.width,
				cap: CAPS[ path.cap ] ?? CanvasKit.StrokeCap.Butt,
				join: JOINS[ path.join ] ?? CanvasKit.StrokeJoin.Miter,
				miter_limit: path.miter,
			} );
			area = unite( area, stroked );
		}
	}

	// canvaskit-wasm 0.42 binds makeSimplified() under its raw name only.
	const simplified = ( area.makeSimplified ?? area._makeSimplified ).call(
		area
	);
	const result = simplified ?? area;
	const outlined = {
		d: result.toSVGString(),
		fillRule:
			result.getFillType() === CanvasKit.FillType.EvenOdd
				? 'evenodd'
				: 'nonzero',
	};
	result.delete();

	return outlined;
}

// -----------------------------------------------------------------------------
// The three outputs
// -----------------------------------------------------------------------------

const SVGO_CONFIG = {
	multipass: true,
	plugins: [ 'preset-default', 'removeDimensions' ],
};

/**
 * The stroked icon as the condition icon block shows it: strokes and fills in
 * currentColor, no stroke-width (the block sets it on the <svg>).
 *
 * @param {IconPath[]} paths Paths of the icon.
 * @return {string} Optimised SVG.
 */
function strokedSvg( paths ) {
	const body = paths
		.map( ( path ) => {
			const attributes = [ `d="${ path.d }"` ];
			if ( path.stroke ) {
				attributes.push( 'stroke="currentColor"' );
				if ( path.cap !== 'butt' ) {
					attributes.push( `stroke-linecap="${ path.cap }"` );
				}
				if ( path.join !== 'miter' ) {
					attributes.push( `stroke-linejoin="${ path.join }"` );
				}
			}
			attributes.push(
				path.fill ? 'fill="currentColor"' : 'fill="none"'
			);
			if ( path.fill && path.fillRule === 'evenodd' ) {
				attributes.push( 'fill-rule="evenodd"' );
			}
			return `<path ${ attributes.join( ' ' ) }/>`;
		} )
		.join( '' );

	return optimize(
		`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${ VIEW_BOX }">${ body }</svg>`,
		SVGO_CONFIG
	).data;
}

/**
 * The icon as one filled path, what the Icons API of WordPress keeps.
 *
 * @param {IconPath[]} paths Paths of the icon.
 * @return {string} Optimised SVG.
 */
function outlinedSvg( paths ) {
	const { d, fillRule } = outline( paths );
	const rule = fillRule === 'evenodd' ? ' fill-rule="evenodd"' : '';

	return optimize(
		`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${ VIEW_BOX }"><path fill="currentColor"${ rule } d="${ d }"/></svg>`,
		SVGO_CONFIG
	).data;
}

const built = {
	icons: new Map(),
	variants: new Map(),
	editorOnly: new Map(),
	conditionIcons: new Map(),
};

/**
 * Reads and outlines a block-editor file.
 *
 * @param {string} name Icon name (file name without .svg).
 * @return {string|null} Optimised SVG, or nothing when the file has no path.
 */
function outlinedBlockEditorSvg( name ) {
	const file = `src/icons/block-editor/${ name }.svg`;
	const paths = readPaths(
		readFileSync( resolve( VARIANTS_DIR, `${ name }.svg` ), 'utf8' ),
		file
	);
	if ( ! paths.length ) {
		problem( `${ file }: no <path>` );
		return null;
	}
	return outlinedSvg( paths );
}

for ( const name of editorOnly ) {
	const svg = outlinedBlockEditorSvg( name );
	if ( svg ) {
		built.editorOnly.set( name, svg );
	}
}

for ( const icon of icons ) {
	const file = `src/icons/svg/${ icon.slug }.svg`;
	const sourcePath = resolve( SVG_DIR, `${ icon.slug }.svg` );
	if ( ! existsSync( sourcePath ) ) {
		continue;
	}
	const paths = readPaths( readFileSync( sourcePath, 'utf8' ), file );
	if ( ! paths.length ) {
		problem( `${ file }: no <path>` );
		continue;
	}

	built.icons.set( icon.slug, outlinedSvg( paths ) );

	if ( conditionIconSlugs.has( icon.slug ) ) {
		built.conditionIcons.set( icon.slug, {
			svg: strokedSvg( paths ),
			style: paths.some( ( path ) => path.stroke ) ? 'stroke' : 'fill',
		} );
	}

	if ( variants.has( icon.slug ) ) {
		const svg = outlinedBlockEditorSvg( icon.slug );
		if ( svg ) {
			built.variants.set( icon.slug, svg );
		}
	}
}

if ( errors.length ) {
	process.stderr.write(
		`Error: the icons cannot be built.\n${ errors.map( ( e ) => `  - ${ e }` ).join( '\n' ) }\n`
	);
	process.exit( 1 );
}

// Condition icons: strokes, for the sprite of the report block.
rmSync( CONDITION_BUILD_DIR, { recursive: true, force: true } );
mkdirSync( resolve( CONDITION_BUILD_DIR, slug ), { recursive: true } );
for ( const [ iconSlug, { svg } ] of built.conditionIcons ) {
	writeFileSync(
		resolve( CONDITION_BUILD_DIR, slug, `${ iconSlug }.svg` ),
		svg,
		'utf8'
	);
}

// Every icon as an outline, for the Icons API; the block-editor set for SVGR.
rmSync( ICONS_BUILD_DIR, { recursive: true, force: true } );
mkdirSync( resolve( ICONS_BUILD_DIR, slug ), { recursive: true } );
mkdirSync( VARIANTS_BUILD_DIR, { recursive: true } );
for ( const [ iconSlug, svg ] of built.icons ) {
	writeFileSync(
		resolve( ICONS_BUILD_DIR, slug, `${ iconSlug }.svg` ),
		svg,
		'utf8'
	);
	writeFileSync(
		resolve( VARIANTS_BUILD_DIR, `${ iconSlug }.svg` ),
		built.variants.get( iconSlug ) ?? svg,
		'utf8'
	);
}
for ( const [ name, svg ] of built.editorOnly ) {
	writeFileSync(
		resolve( VARIANTS_BUILD_DIR, `${ name }.svg` ),
		svg,
		'utf8'
	);
}

// Components of icons that are gone: SVGR only adds.
if ( existsSync( COMPONENTS_DIR ) ) {
	for ( const file of readdirSync( COMPONENTS_DIR ) ) {
		const name = basename( file, '.js' );
		if (
			file.endsWith( '.js' ) &&
			name !== 'index' &&
			! slugs.has( name ) &&
			! built.editorOnly.has( name )
		) {
			unlinkSync( resolve( COMPONENTS_DIR, file ) );
		}
	}
}

// -----------------------------------------------------------------------------
// The manifests RegisterConditionIcons and RegisterIconCollection read
// -----------------------------------------------------------------------------

const PHP_HEADER = [
	'<?php',
	'// This file is automatically generated. Do not edit directly.',
	"if ( ! defined( 'ABSPATH' ) ) {",
	"    die( 'Silence is golden.' );",
	'}',
	'',
];

const iconLabel = ( iconSlug ) =>
	icons.find( ( icon ) => icon.slug === iconSlug ).label;
const keyWidth = Math.max( ...icons.map( ( icon ) => icon.slug.length ) ) + 5;
const phpKey = ( iconSlug ) => `'${ iconSlug }'`.padEnd( keyWidth );

const conditionLines = [
	...PHP_HEADER,
	'return array(',
	"    'collections' => array(",
	`        '${ escapeSingleQuote( slug ) }' => array(`,
	`            'label'             => _x( '${ escapeSingleQuote( label ) }', 'icon collection label', 'elio-blocks' ),`,
	`            'description'       => __( '${ escapeSingleQuote( description ) }', 'elio-blocks' ),`,
	`            'strokeWidth'       => ${ strokeWidth },`,
	"            'icons'             => array(",
];
for ( const [ iconSlug, { style } ] of built.conditionIcons ) {
	conditionLines.push(
		`                ${ phpKey( iconSlug ) }=> array(`,
		`                    'label'    => _x( '${ escapeSingleQuote( iconLabel( iconSlug ) ) }', 'icon label', 'elio-blocks' ),`,
		`                    'filePath' => '${ iconSlug }.svg',`,
		`                    'style'    => '${ style }',`,
		'                ),'
	);
}
conditionLines.push(
	'            ),',
	"            'conditionMappings' => array("
);
for ( const { condition, dayOrNight, iconSlug } of conditionMappings ) {
	conditionLines.push(
		'                array(',
		`                    'condition'  => '${ escapeSingleQuote( condition ) }',`,
		`                    'dayOrNight' => '${ dayOrNight }',`,
		`                    'iconSlug'   => '${ iconSlug }',`,
		'                ),'
	);
}
conditionLines.push( '            ),', '        ),', '    ),', ');', '' );
writeFileSync( CONDITION_MANIFEST_PHP, conditionLines.join( '\n' ), 'utf8' );

const iconLines = [
	...PHP_HEADER,
	'return array(',
	`    'slug'        => '${ escapeSingleQuote( slug ) }',`,
	`    'label'       => _x( '${ escapeSingleQuote( label ) }', 'icon collection label', 'elio-blocks' ),`,
	`    'description' => __( '${ escapeSingleQuote( description ) }', 'elio-blocks' ),`,
	"    'icons'       => array(",
];
for ( const icon of icons ) {
	iconLines.push(
		`        ${ phpKey( icon.slug ) }=> array(`,
		`            'label'    => _x( '${ escapeSingleQuote( icon.label ) }', 'icon label', 'elio-blocks' ),`,
		`            'filePath' => '${ icon.slug }.svg',`,
		'        ),'
	);
}
iconLines.push( '    ),', ');', '' );
writeFileSync( ICONS_MANIFEST_PHP, iconLines.join( '\n' ), 'utf8' );

process.stdout.write(
	`Built the "${ slug }" collection: ${ built.icons.size } icons → ${ ICONS_BUILD_DIR }/${ slug }, ` +
		`${ built.variants.size } block-editor variants + ${ built.editorOnly.size } icons of the editor alone → ${ VARIANTS_BUILD_DIR }, ` +
		`${ built.conditionIcons.size } condition icons + ${ conditionMappings.length } mappings → ${ CONDITION_BUILD_DIR }/${ slug }\n` +
		`Generated manifests → ${ ICONS_MANIFEST_PHP }, ${ CONDITION_MANIFEST_PHP }\n`
);
