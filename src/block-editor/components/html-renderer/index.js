/**
 * External dependencies
 */
import clsx from 'clsx';
import parse, { attributesToProps, domToReact } from 'html-react-parser';

/**
 * WordPress dependencies
 */
import { safeHTML } from '@wordpress/dom';

/**
 * Renders an HTML string as React elements.
 *
 * Merges `wrapperProps` (className, style) into the root element of the parsed
 * HTML rather than wrapping it in an extra element.
 *
 * Mirrors packages/block-library/src/utils/html-renderer.js from Gutenberg project.
 *
 * @param {Object} props
 * @param {string} props.html         HTML content to render.
 * @param {Object} props.wrapperProps Props to merge into the root element.
 * @return {React.JSX.Element} The rendered React elements.
 */
const HtmlRenderer = ( { html = '', wrapperProps = {} } ) => {
	const options = {
		replace: ( { name, type, attribs, parent, children } ) => {
			if ( type === 'tag' && name ) {
				const parsedProps = attributesToProps( attribs || {} );
				const TagName = name;
				if ( ! parent ) {
					const mergedProps = {
						...parsedProps,
						...wrapperProps,
						className: clsx(
							parsedProps.className,
							wrapperProps.className
						),
						style: {
							...( parsedProps.style || {} ),
							...( wrapperProps.style || {} ),
						},
					};
					return (
						<TagName { ...mergedProps }>
							{ domToReact( children, options ) }
						</TagName>
					);
				}
			}
		},
	};

	return parse( safeHTML( html ), options );
};

export default HtmlRenderer;
