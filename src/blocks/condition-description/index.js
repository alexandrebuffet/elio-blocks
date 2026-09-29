import { registerBlockType } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import edit from './edit';
import save from './save';
import metadata from './block.json';
import sunCloud from '../../icons/components/sun-cloud';

/**
 * Registers the block type.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-registration/
 */
registerBlockType( metadata.name, {
	icon: sunCloud,
	/**
	 * @see ./edit.js
	 */
	edit,
	/**
	 * @see ./save.js
	 */
	save,
} );
