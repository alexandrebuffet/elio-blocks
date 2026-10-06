/**
 * Returns the block of an inner blocks template in the shape of a block
 * example, so a preview shows the blocks a variation or a template inserts.
 *
 * @param {Array} template Template of one block: [ name, attributes, inner blocks templates ].
 * @return {{ name: string, attributes: Object, innerBlocks: Array }} Block example.
 */
export function getBlockExampleFromTemplate( template ) {
	const [ name, attributes = {}, innerBlocks = [] ] = template;

	return {
		name,
		attributes,
		innerBlocks: innerBlocks.map( getBlockExampleFromTemplate ),
	};
}
