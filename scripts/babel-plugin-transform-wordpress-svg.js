/**
 * Babel plugin to transform SVG elements into WordPress primitives.
 * Inspired by `@svgr/babel-plugin-transform-react-native-svg`.
 */

const elementToComponent = {
	svg: 'SVG',
	circle: 'Circle',
	clipPath: 'ClipPath',
	defs: 'Defs',
	ellipse: 'Ellipse',
	g: 'G',
	image: 'Image',
	line: 'Line',
	linearGradient: 'LinearGradient',
	mask: 'Mask',
	path: 'Path',
	pattern: 'Pattern',
	polygon: 'Polygon',
	polyline: 'Polyline',
	radialGradient: 'RadialGradient',
	rect: 'Rect',
	stop: 'Stop',
	symbol: 'Symbol',
	text: 'Text',
	tspan: 'TSpan',
	use: 'Use',
};

function replaceElement( path, state ) {
	const namePath = path.get( 'openingElement.name' );
	if ( ! namePath.isJSXIdentifier() ) {
		return;
	}

	const { name } = namePath.node;
	const component = elementToComponent[ name ];
	if ( ! component ) {
		return;
	}

	namePath.replaceWith( state.jsxIdentifier( component ) );
	if ( path.has( 'closingElement' ) ) {
		path.get( 'closingElement.name' ).replaceWith(
			state.jsxIdentifier( component )
		);
	}
}

const visitor = {
	JSXElement( path, state ) {
		replaceElement( path, state );
	},
};

module.exports = function ( { types: t } ) {
	return {
		name: 'babel-plugin-transform-wordpress-svg',
		visitor: {
			Program: {
				exit( path, state ) {
					state.jsxIdentifier = t.jsxIdentifier;
					path.traverse( visitor, state );
				},
			},
		},
	};
};
