/**
 * WordPress dependencies.
 */
import { registerBlockType } from '@wordpress/blocks';

/**
 * Internal dependencies.
 */
import edit from './edit';
import save from './save';
import metadata from './block.json';
import variations from './variations';
import mapPin from '../../icons/components/map-pin';

/**
 * Registers the location block.
 */
registerBlockType( metadata.name, {
	icon: mapPin,
	/**
	 * @see ./edit.js
	 */
	edit,
	/**
	 * @see ./save.js
	 */
	save,
	/**
	 * @see ./variations.js
	 */
	variations,
} );
