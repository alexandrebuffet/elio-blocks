/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';
import apiFetch from '@wordpress/api-fetch';

/** Pause in typing before a term is searched. */
const SEARCH_DELAY = 300;

const IDLE = { results: [], isSearching: false, error: null };

/**
 * Searches locations by name through the geocoding endpoint.
 *
 * Each term gets its own AbortController: when the term changes, or the search
 * is disabled or unmounted, the pending request is cancelled and whatever it
 * still answers is ignored. Results on screen always belong to the last term.
 *
 * @param {string}  query           Search term.
 * @param {Object}  options         Options.
 * @param {boolean} options.enabled Whether to search (e.g. the modal is open).
 * @return {{ results: Array, isSearching: boolean, error: string|null }} Search state.
 */
export function useLocationSearch( query, { enabled = true } = {} ) {
	const [ state, setState ] = useState( IDLE );
	const term = enabled ? query.trim() : '';

	useEffect( () => {
		if ( ! term ) {
			setState( IDLE );
			return;
		}

		const controller = new AbortController();
		const { signal } = controller;

		const timeoutId = setTimeout( async () => {
			setState( ( previous ) => ( {
				...previous,
				isSearching: true,
				error: null,
			} ) );

			try {
				const response = await apiFetch( {
					path: addQueryArgs( '/elio/v1/geocoding', {
						search: term,
						limit: 10,
					} ),
					signal,
				} );

				if ( signal.aborted ) {
					return;
				}

				if ( response?.success && Array.isArray( response.data ) ) {
					setState( { ...IDLE, results: response.data } );
				} else {
					setState( {
						...IDLE,
						error:
							response?.message ||
							__( 'Failed to search locations.', 'elio-blocks' ),
					} );
				}
			} catch ( error ) {
				// A cancelled request is not a failure.
				if ( signal.aborted || error?.name === 'AbortError' ) {
					return;
				}

				setState( {
					...IDLE,
					error:
						error?.message ||
						error?.data?.message ||
						__( 'Failed to search locations.', 'elio-blocks' ),
				} );
			}
		}, SEARCH_DELAY );

		return () => {
			clearTimeout( timeoutId );
			controller.abort();
		};
	}, [ term ] );

	return state;
}
