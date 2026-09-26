import { registerBlockType } from '@wordpress/blocks';

import edit from './edit';
import save from './save';
import metadata from './block.json';
import cloud from '../../icons/components/cloud';

registerBlockType( metadata.name, {
	icon: cloud,
	edit,
	save,
} );
