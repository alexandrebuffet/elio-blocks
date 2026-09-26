import { registerBlockType } from '@wordpress/blocks';
import metadata from './block.json';
import edit from './edit';
import save from './save';
import variations from './variations';
import temperature from '../../icons/components/temperature';

registerBlockType( metadata.name, {
	icon: temperature,
	edit,
	save,
	variations,
} );
