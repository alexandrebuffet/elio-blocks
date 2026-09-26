/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as elioDataStore } from '../../stores/elio-data';
import { DEFAULT_CONDITION_ICON_COLLECTION } from '../utils/condition-icon-collection';

const NO_COLLECTIONS = [];

/**
 * Returns the registered condition icon collections, from the elio/data store.
 *
 * @return {{ collections: Array, defaultCollection: string, isResolving: boolean }}
 *   Collections (empty until they arrive), the slug of the site one, and whether the request is pending.
 */
export function useConditionIconCollections() {
	return useSelect( ( select ) => {
		const { getConditionIconCollections, hasFinishedResolution } =
			select( elioDataStore );
		const collections = getConditionIconCollections() ?? NO_COLLECTIONS;

		return {
			collections,
			defaultCollection:
				collections.find( ( collection ) => collection.is_default )
					?.slug ?? DEFAULT_CONDITION_ICON_COLLECTION,
			isResolving: ! hasFinishedResolution(
				'getConditionIconCollections',
				[]
			),
		};
	}, [] );
}
