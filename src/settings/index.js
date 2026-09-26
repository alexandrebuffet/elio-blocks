/**
 * WordPress dependencies
 */
import { createRoot } from '@wordpress/element';

import './style.scss';

/**
 * Internal dependencies
 */
import SettingsPage from './page';

const root = document.getElementById( 'elio-blocks-settings' );

if ( root ) {
	createRoot( root ).render( <SettingsPage /> );
}
