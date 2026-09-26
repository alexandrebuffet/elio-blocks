/**
 * SVGR template for WordPress/Gutenberg icon components.
 * Outputs camelCase default export using `@wordpress/primitives`.
 *
 * @param {Object}                                                       variables               Template variables given by SVGR.
 * @param {Object}                                                       variables.imports       Import statements (unused: the template writes its own).
 * @param {string}                                                       variables.componentName Component name derived from the file name.
 * @param {Object}                                                       variables.jsx           JSX of the SVG.
 * @param {Object}                                                       helpers                 SVGR helpers.
 * @param {(strings: Array<string>, ...values: Array<Object>) => Object} helpers.tpl             Tagged template building the AST.
 * @return {Object} AST of the component module.
 */
const wpIconComponentTemplate = (
	{ imports, componentName, jsx },
	{ tpl }
) => {
	// Convert e.g. SvgWeather → weather, SvgMapPin → mapPin.
	const newComponentName = componentName
		.replace( /^Svg/, '' )
		.replace( /^./, ( c ) => c.toLowerCase() );

	return tpl`
		/**
		 * WordPress dependencies
		 */
		${ imports }

		const ${ newComponentName } = (
		${ jsx }
		);

		export default ${ newComponentName };
	`;
};

module.exports = wpIconComponentTemplate;
