/**
 * WordPress dependencies
 */
import { registerBlockType } from '@wordpress/blocks';
import { layout } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import './style.scss';
import edit from './edit';
import save from './save';
import variations from './variations';
import metadata from './block.json';

/**
 * Registers the block type.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-registration/
 */
registerBlockType( metadata.name, {
	icon: layout,
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
