/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as blocksStore } from '@wordpress/blocks';

const REPORT_BLOCK_NAME = 'elio/weather-report';

const NO_VARIATIONS = [];

/**
 * Returns the block variations with scope 'block' for the Report block (used in "Start blank" picker).
 * Report has no namespace/inserter-variation linking, so we just return block-scoped variations.
 *
 * @return {Object[]} Block variations for the variation picker.
 */
export function useReportBlockVariations() {
	return useSelect(
		( select ) =>
			select( blocksStore ).getBlockVariations(
				REPORT_BLOCK_NAME,
				'block'
			) ?? NO_VARIATIONS,
		[]
	);
}

export { REPORT_BLOCK_NAME };
