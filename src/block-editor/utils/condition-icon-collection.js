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

/**
 * Stroke width of a collection that declares none. Same as ConditionIconsRegistry::DEFAULT_STROKE_WIDTH.
 */
export const DEFAULT_CONDITION_ICON_STROKE_WIDTH = 2;

/**
 * Returns the stroke width the stroke icons of a collection are drawn with,
 * what a condition-icon block applies unless its strokeWidth attribute says
 * otherwise. Twin of elio_blocks_get_condition_icon_stroke_width() in PHP.
 *
 * @param {Array<{slug: string, stroke_width?: number}>|null} collections Registered collections; null while not listed yet.
 * @param {string}                                            collection  Collection slug.
 * @return {number} Stroke width, in the units of the 24×24 viewBox.
 */
export function getConditionIconStrokeWidth( collections, collection ) {
	return (
		collections?.find( ( entry ) => entry.slug === collection )
			?.stroke_width ?? DEFAULT_CONDITION_ICON_STROKE_WIDTH
	);
}
