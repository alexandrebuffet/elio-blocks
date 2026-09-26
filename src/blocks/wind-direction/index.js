import { registerBlockType } from '@wordpress/blocks';

import edit from './edit';
import save from './save';
import variations from './variations';
import metadata from './block.json';
import windsockDirection from '../../icons/components/windsock-direction';

registerBlockType( metadata.name, {
	icon: windsockDirection,
	edit,
	save,
	variations,
} );
