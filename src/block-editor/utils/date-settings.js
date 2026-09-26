/**
 * WordPress dependencies
 */
import { getSettings } from '@wordpress/date';

/**
 * Returns the date settings of the site for the editor: the ones the front
 * gets, passed by the server (DateSettings), so dates read the same as with
 * wp_date(), month names declined. Those of `@wordpress/date` when they are missing.
 *
 * @return {Object} Date settings (see shared/date-format).
 */
export function getEditorDateSettings() {
	return window.elioBlocksDateSettings ?? getSettings();
}
