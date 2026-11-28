/**
 * Builds the Pixel collection of condition icons from src/icons/pixel/manifest.json,
 * where each icon is its bitmap: twelve rows of twelve pixels, '#' lit, '.' not.
 * The bitmap is the source, as the Figma export is the source of the Elio
 * collection: a pixel is changed in the manifest.
 *
 * Each icon becomes build/weather-condition-icons/pixel/{slug}.svg, one filled
 * path of the lit pixels (rows of pixels, merged with the identical rows below
 * them) on a 12 x 12 viewBox, with shape-rendering="crispEdges" so the pixels
 * stay sharp at a size that is not a multiple of 12. buildPixelCollection()
 * returns the collection for weather-condition-icons-manifest.php, which
 * scripts/build-icons.mjs writes.
 */

import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const ROOT = resolve( dirname( fileURLToPath( import.meta.url ) ), '..' );
const MANIFEST_JSON = resolve( ROOT, 'src/icons/pixel/manifest.json' );
const GRID = 12;

/**
 * The path of the lit pixels of a bitmap.
 *
 * @param {string[]} pixels Rows of '#' and '.'.
 * @return {string} Path data.
 */
export function pixelsToPath( pixels ) {
	const rects = [];
	const open = new Map();
	pixels.forEach( ( row, y ) => {
		const seen = new Set();
		for ( let x = 0; x < row.length; ) {
			if ( row[ x ] !== '#' ) {
				x++;
				continue;
			}
			let end = x;
			while ( row[ end + 1 ] === '#' ) {
				end++;
			}
			const key = `${ x },${ end }`;
			const above = open.get( key );
			if ( above && above.y + above.h === y ) {
				above.h++;
			} else {
				const rect = { x, y, w: end - x + 1, h: 1 };
				rects.push( rect );
				open.set( key, rect );
			}
			seen.add( key );
			x = end + 1;
		}
		for ( const key of [ ...open.keys() ] ) {
			if ( ! seen.has( key ) ) {
				open.delete( key );
			}
		}
	} );
	return rects
		.map( ( { x, y, w, h } ) => `M${ x } ${ y }h${ w }v${ h }h-${ w }z` )
		.join( '' );
}

/**
 * Checks the manifest, writes the icons and returns the collection.
 *
 * @param {string} buildDir build/weather-condition-icons.
 * @return {{slug: string, label: string, description: string, icons: Array<{slug: string, label: string}>, conditionMappings: Array<{condition: string, dayOrNight: string, iconSlug: string}>}} The collection.
 */
export function buildPixelCollection( buildDir ) {
	const manifest = JSON.parse( readFileSync( MANIFEST_JSON, 'utf8' ) );
	const { slug, icons, conditionMappings } = manifest;
	const fail = ( message ) => {
		throw new Error( `src/icons/pixel/manifest.json: ${ message }` );
	};

	const slugs = new Set();
	for ( const icon of icons ) {
		if ( ! icon.slug || ! icon.label || slugs.has( icon.slug ) ) {
			fail(
				`every icon needs a slug of its own and a label (${ icon.slug })`
			);
		}
		slugs.add( icon.slug );
		const { pixels } = icon;
		if (
			! Array.isArray( pixels ) ||
			pixels.length !== GRID ||
			pixels.some(
				( row ) => ! new RegExp( `^[#.]{${ GRID }}$` ).test( row )
			)
		) {
			fail(
				`icon "${ icon.slug }" needs ${ GRID } rows of ${ GRID } pixels, '#' or '.'`
			);
		}
		// One empty pixel all around, as the Elio icons keep their padding.
		if (
			/#/.test( pixels[ 0 ] + pixels[ GRID - 1 ] ) ||
			pixels.some(
				( row ) => row[ 0 ] === '#' || row[ GRID - 1 ] === '#'
			)
		) {
			fail( `icon "${ icon.slug }" lights a pixel of the border` );
		}
	}
	const mapped = new Set();
	for ( const { condition, dayOrNight, iconSlug } of conditionMappings ) {
		if (
			! condition ||
			! [ 'day', 'night', 'all' ].includes( dayOrNight ) ||
			! slugs.has( iconSlug )
		) {
			fail(
				`condition "${ condition }" maps to an unknown icon or day/night value`
			);
		}
		mapped.add( iconSlug );
	}
	for ( const icon of icons ) {
		if ( ! mapped.has( icon.slug ) ) {
			fail( `icon "${ icon.slug }" represents no condition` );
		}
	}

	const dir = resolve( buildDir, slug );
	rmSync( dir, { recursive: true, force: true } );
	mkdirSync( dir, { recursive: true } );
	for ( const icon of icons ) {
		writeFileSync(
			resolve( dir, `${ icon.slug }.svg` ),
			`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${ GRID } ${ GRID }" shape-rendering="crispEdges"><path fill="currentColor" d="${ pixelsToPath( icon.pixels ) }"/></svg>\n`,
			'utf8'
		);
	}

	return manifest;
}
