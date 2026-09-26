import { registerBlockType } from '@wordpress/blocks';

import edit from './edit';
import save from './save';
import metadata from './block.json';
import uvIndex from '../../icons/components/uv-index';

registerBlockType( metadata.name, {
	icon: uvIndex,
	edit,
	save,
} );
