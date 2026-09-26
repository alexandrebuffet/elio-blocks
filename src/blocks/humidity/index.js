import { registerBlockType } from '@wordpress/blocks';

import edit from './edit';
import save from './save';
import metadata from './block.json';
import droplet from '../../icons/components/droplet';

registerBlockType( metadata.name, {
	icon: droplet,
	edit,
	save,
} );
