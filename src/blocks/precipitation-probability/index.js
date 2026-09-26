import { registerBlockType } from '@wordpress/blocks';

import edit from './edit';
import save from './save';
import metadata from './block.json';
import umbrella from '../../icons/components/umbrella';

registerBlockType( metadata.name, {
	icon: umbrella,
	edit,
	save,
} );
