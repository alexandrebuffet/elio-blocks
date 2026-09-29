import { registerBlockType } from '@wordpress/blocks';

import edit from './edit';
import save from './save';
import metadata from './block.json';
import barometer from '../../icons/components/barometer';

registerBlockType( metadata.name, {
	icon: barometer,
	edit,
	save,
} );
