/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { BlockControls } from '@wordpress/block-editor';
import { ToolbarButton } from '@wordpress/components';

/**
 * Internal dependencies
 */
import PatternSelectionModal, { useReportPatterns } from './pattern-selection';

/**
 * Renders the "Change design" button of the report toolbar, as the Query
 * Loop has one: it lists the patterns of the report, which keep its location
 * and settings. Nothing while no pattern is registered.
 *
 * @param {Object} props            Component props.
 * @param {string} props.clientId   Report block clientId.
 * @param {Object} props.attributes Report block attributes.
 * @return {Element|null} Element to render.
 */
export default function ChangeDesignToolbar( { clientId, attributes } ) {
	const [ isModalOpen, setIsModalOpen ] = useState( false );
	const hasPatterns = useReportPatterns( clientId ).length > 0;

	if ( ! hasPatterns ) {
		return null;
	}

	return (
		<>
			<BlockControls group="other">
				<ToolbarButton onClick={ () => setIsModalOpen( true ) }>
					{ __( 'Change design', 'elio-blocks' ) }
				</ToolbarButton>
			</BlockControls>
			{ isModalOpen && (
				<PatternSelectionModal
					clientId={ clientId }
					attributes={ attributes }
					onRequestClose={ () => setIsModalOpen( false ) }
				/>
			) }
		</>
	);
}
