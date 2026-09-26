import { registerBlockType } from '@wordpress/blocks';

import edit from './edit';
import save from './save';
import metadata from './block.json';
import cloudDroplet from '../../icons/components/cloud-droplet';

registerBlockType( metadata.name, {
	icon: cloudDroplet,
	edit,
	save,
} );
