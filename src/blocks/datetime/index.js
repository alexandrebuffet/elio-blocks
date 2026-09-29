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
import cloudSunCalendar from '../../icons/components/cloud-sun-calendar';

/**
 * Registers the block type.
 */
registerBlockType( metadata.name, {
	icon: cloudSunCalendar,
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
