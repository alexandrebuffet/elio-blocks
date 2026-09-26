/**
 * WordPress dependencies
 */
import { addQueryArgs, getQueryArg, removeQueryArgs } from '@wordpress/url';
import { forwardRef, useSyncExternalStore } from '@wordpress/element';

/**
 * Query arg naming the section shown; the first section has none, so the page
 * URL WordPress links to (menu, plugin list) opens it.
 */
const SECTION_QUERY_ARG = 'section';

const listeners = new Set();

function subscribe( listener ) {
	listeners.add( listener );
	window.addEventListener( 'popstate', listener );
	return () => {
		listeners.delete( listener );
		window.removeEventListener( 'popstate', listener );
	};
}

function getUrl() {
	return window.location.href;
}

/**
 * Returns the URL of a section: the page URL, with its other query args.
 *
 * @param {string}             url      Current URL.
 * @param {{ name: string }[]} sections Sections of the page, the first one shown by default.
 * @param {string}             name     Section to link to.
 * @return {string} URL of the section.
 */
function getSectionUrl( url, sections, name ) {
	const pageUrl = removeQueryArgs( url, SECTION_QUERY_ARG );
	return name === sections[ 0 ].name
		? pageUrl
		: addQueryArgs( pageUrl, { [ SECTION_QUERY_ARG ]: name } );
}

/**
 * Returns the section the URL shows, from the navigation of the page header: sharing or
 * reloading the URL opens the same section.
 *
 * @param {{ name: string, label: string }[]} sections Sections of the page, the first one shown by default.
 * @return {{ section: string, navigation: Object }} Name of the section shown, and the `navigation` prop of `Page`.
 */
export function useSettingsSections( sections ) {
	const url = useSyncExternalStore( subscribe, getUrl );
	const name = getQueryArg( url, SECTION_QUERY_ARG );
	const section = (
		sections.find( ( item ) => item.name === name ) ?? sections[ 0 ]
	).name;

	return {
		section,
		navigation: {
			items: sections.map( ( item ) => ( {
				label: item.label,
				href: getSectionUrl( url, sections, item.name ),
			} ) ),
			currentHref: getSectionUrl( url, sections, section ),
		},
	};
}

/**
 * Renders the link of the `Page` navigation (`components.link`): a plain click shows the
 * section without reloading the page; with a modifier key or another button,
 * the browser follows the link (new tab, new window).
 */
export const SectionLink = forwardRef( function SectionAnchor(
	{ href, children, onClick, ...props },
	ref
) {
	return (
		<a
			{ ...props }
			ref={ ref }
			href={ href }
			onClick={ ( event ) => {
				onClick?.( event );
				if (
					event.defaultPrevented ||
					event.button !== 0 ||
					event.metaKey ||
					event.ctrlKey ||
					event.shiftKey ||
					event.altKey
				) {
					return;
				}
				event.preventDefault();
				if ( href !== window.location.href ) {
					window.history.pushState( null, '', href );
					listeners.forEach( ( listener ) => listener() );
				}
			} }
		>
			{ children }
		</a>
	);
} );
