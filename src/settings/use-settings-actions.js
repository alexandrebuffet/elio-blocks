/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';
import { useCallback, useState } from '@wordpress/element';
import { store as coreStore } from '@wordpress/core-data';
import apiFetch from '@wordpress/api-fetch';

/**
 * Posts credentials of a provider: they are not site settings, and the server
 * never sends a secret back.
 *
 * @param {string}                 slug   Provider slug.
 * @param {Object<string, string>} values Values by credential name; an empty one forgets the saved value.
 * @return {Promise<Object>} Request.
 */
function saveProviderCredentials( slug, values ) {
	return apiFetch( {
		path: `/elio/v1/providers/${ slug }/credentials`,
		method: 'POST',
		data: { credentials: values },
	} );
}

/**
 * Saves the edited site settings, then the credentials typed, and reports
 * the outcome once.
 *
 * `saveEditedEntityRecord` swallows request errors unless asked to throw:
 * without `throwOnError`, a rejected save was announced as "Settings saved.".
 *
 * @param {(status: string, message: string) => void} addNotice Shows a notice.
 * @return {{ save: (credentials?: Object<string, Object<string, string>>) => Promise<boolean>, isSaving: boolean }} Save action (credentials to save, by provider slug and name) and its state.
 */
export function useSaveSettings( addNotice ) {
	const [ isSaving, setIsSaving ] = useState( false );
	const { saveEditedEntityRecord } = useDispatch( coreStore );

	const save = useCallback(
		async ( credentials = {} ) => {
			setIsSaving( true );

			try {
				await saveEditedEntityRecord( 'root', 'site', undefined, {
					throwOnError: true,
				} );
			} catch {
				addNotice(
					'error',
					__( 'Failed to save settings.', 'elio-blocks' )
				);
				setIsSaving( false );
				return false;
			}

			try {
				// One after the other: each request rewrites the option that
				// holds every provider, parallel ones would drop each other's.
				for ( const [ slug, values ] of Object.entries(
					credentials
				) ) {
					await saveProviderCredentials( slug, values );
				}
			} catch ( error ) {
				addNotice(
					'error',
					error?.message ||
						__( 'Failed to save the credentials.', 'elio-blocks' )
				);
				return false;
			} finally {
				setIsSaving( false );
			}

			addNotice( 'success', __( 'Settings saved.', 'elio-blocks' ) );
			return true;
		},
		[ saveEditedEntityRecord, addNotice ]
	);

	return { save, isSaving };
}
