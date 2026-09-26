/**
 * WordPress dependencies
 */
import { registerBlockCollection } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import elioLogo from '../icons/brand/components/elio-logo';

registerBlockCollection( 'elio', {
	title: 'Elio',
	icon: elioLogo,
} );
