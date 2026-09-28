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
import weatherRefresh from '../../icons/components/weather-refresh';

/**
 * Registers the block type.
 */
registerBlockType( metadata.name, {
	icon: weatherRefresh,
	/**
	 * @see ./edit.js
	 */
	edit,
	/**
	 * @see ./save.js
	 */
	save,
} );
