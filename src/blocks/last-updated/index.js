/**
 * WordPress dependencies
 */
import { registerBlockType } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import edit from './edit';
import save from './save';
import metadata from './block.json';
import cloudSunRefresh from '../../icons/components/cloud-sun-refresh';

/**
 * Registers the block type.
 */
registerBlockType( metadata.name, {
	icon: cloudSunRefresh,
	/**
	 * @see ./edit.js
	 */
	edit,
	/**
	 * @see ./save.js
	 */
	save,
} );
