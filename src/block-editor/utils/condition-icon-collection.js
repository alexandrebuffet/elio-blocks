/**
 * Collection the plugin ships and falls back to. Same as ConditionIconsRegistry::DEFAULT_COLLECTION.
 */
export const DEFAULT_CONDITION_ICON_COLLECTION = 'elio';

/**
 * Resolves the collection a condition-icon block shows: the first registered
 * one among the candidates (the block's, its report's), else the site one,
 * else the plugin one. Twin of ConditionIconCollectionResolver::resolve() in PHP.
 *
 * @param {Array<string|undefined>}    candidates        Most specific first.
 * @param {Array<{slug: string}>|null} collections       Registered collections; null while not listed yet.
 * @param {string}                     defaultCollection Site collection.
 * @return {string} Collection slug.
 */
export function resolveConditionIconCollection(
	candidates,
	collections,
	defaultCollection = DEFAULT_CONDITION_ICON_COLLECTION
) {
	const chosen = [ ...candidates, defaultCollection ].filter( Boolean );

	if ( collections === null ) {
		return chosen[ 0 ] ?? DEFAULT_CONDITION_ICON_COLLECTION;
	}

	const registered = new Set( collections.map( ( { slug } ) => slug ) );

	return (
		chosen.find( ( slug ) => registered.has( slug ) ) ??
		DEFAULT_CONDITION_ICON_COLLECTION
	);
}
