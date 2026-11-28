/**
 * WordPress dependencies
 */
import { createRoot } from '@wordpress/element';
import { SlotFillProvider } from '@wordpress/components';

import './style.scss';

/**
 * Internal dependencies
 */
import SettingsPage from './page';

const root = document.getElementById( 'elio-blocks-settings' );

if ( root ) {
	// The header of the admin-ui Page renders a Slot.
	createRoot( root ).render(
		<SlotFillProvider>
			<SettingsPage />
		</SlotFillProvider>
	);
}
