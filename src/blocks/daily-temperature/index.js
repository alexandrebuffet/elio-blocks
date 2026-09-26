import { registerBlockType } from '@wordpress/blocks';
import metadata from './block.json';
import edit from './edit';
import save from './save';
import variations from './variations';
import temperatureMinus from '../../icons/components/temperature-minus';

registerBlockType( metadata.name, {
	icon: temperatureMinus,
	edit,
	save,
	variations,
} );
