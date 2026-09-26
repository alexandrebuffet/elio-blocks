import { registerBlockType } from '@wordpress/blocks';

import edit from './edit';
import save from './save';
import variations from './variations';
import metadata from './block.json';
import windsockSpeed from '../../icons/components/windsock-speed';

registerBlockType( metadata.name, {
	icon: windsockSpeed,
	edit,
	save,
	variations,
} );
