/**
 * WordPress dependencies
 */
import { registerBlockType } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import edit from './edit';
import save from './save';
import variations from './variations';
import metadata from './block.json';
import cloudSunGrid from '../../icons/components/cloud-sun-grid';

/**
 * Registers the block type.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-registration/
 */
registerBlockType( metadata.name, {
	icon: cloudSunGrid,
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
