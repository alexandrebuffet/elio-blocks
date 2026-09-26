import { registerBlockType } from '@wordpress/blocks';

import edit from './edit';
import save from './save';
import variations from './variations';
import metadata from './block.json';
import sunrise from '../../icons/components/sunrise';

registerBlockType( metadata.name, {
	icon: sunrise,
	edit,
	save,
	variations,
} );
