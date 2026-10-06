import { registerBlockType } from '@wordpress/blocks';

import edit from './edit';
import save from './save';
import metadata from './block.json';
import rulerDroplet from '../../icons/components/ruler-droplet';

registerBlockType( metadata.name, {
	icon: rulerDroplet,
	edit,
	save,
} );
