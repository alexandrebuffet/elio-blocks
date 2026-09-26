import { registerBlockType } from '@wordpress/blocks';

import edit from './edit';
import save from './save';
import metadata from './block.json';
import pressure from '../../icons/components/pressure';

registerBlockType( metadata.name, {
	icon: pressure,
	edit,
	save,
} );
