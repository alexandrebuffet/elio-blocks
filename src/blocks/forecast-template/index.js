/**
 * WordPress dependencies
 */
import { registerBlockType } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import './style.scss';
import edit from './edit';
import save from './save';
import variations from './variations';
import metadata from './block.json';
import cloudSunLayout from '../../icons/components/cloud-sun-layout';
import { DAILY_WEATHER_FORECAST_INNER_BLOCKS } from '../forecast/variations';
import { getBlockExampleFromTemplate } from '../../block-editor/utils';

// The template of the Daily Forecast, its days in a grid.
const { attributes, innerBlocks } = getBlockExampleFromTemplate(
	DAILY_WEATHER_FORECAST_INNER_BLOCKS
);

/**
 * Registers the block type.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-registration/
 */
registerBlockType( metadata.name, {
	icon: cloudSunLayout,
	/**
	 * @see ./edit.js
	 */
	edit,
	/**
	 * @see ./save.js
	 */
	save,
	/**
	 * @see ./variations.js
	 */
	variations,
	example: { attributes, innerBlocks },
} );
