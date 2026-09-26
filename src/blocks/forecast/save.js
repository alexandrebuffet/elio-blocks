/**
 * WordPress dependencies
 */
import { InnerBlocks } from '@wordpress/block-editor';

/**
 * Saves the inner blocks of the Forecast block. Output is produced by render.php.
 *
 * @return {Element} Inner blocks content placeholder.
 */
export default function ForecastSave() {
	return <InnerBlocks.Content />;
}
