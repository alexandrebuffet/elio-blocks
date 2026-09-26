/**
 * WordPress dependencies
 */
import { DataViewsPicker } from '@wordpress/dataviews/wp';
import { useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useConditionIconCollections } from '../block-editor/hooks';
import {
	getIconCollectionPreviewDocument,
	resolveConditionIconCollection,
} from '../block-editor/utils';

/**
 * Renders the preview of a collection, in an iframe as the Site Editor previews patterns.
 * Scripts stay off (sandbox), and clicks go through to the card.
 *
 * @param {Object} props
 * @param {Object} props.item Collection (from the REST API).
 */
function Preview( { item } ) {
	return (
		<iframe
			className="elio-blocks-settings__icon-collection-preview"
			title={ sprintf(
				/* translators: %s: Name of an icon collection. */
				__( 'Preview of %s', 'elio-blocks' ),
				item.label
			) }
			srcDoc={ getIconCollectionPreviewDocument( item.preview ) }
			sandbox=""
			tabIndex={ -1 }
			aria-hidden="true"
		/>
	);
}

/**
 * Renders the description of a collection, and how much of the weather it covers when it
 * does not cover everything.
 *
 * @param {Object} props
 * @param {Object} props.item Collection (from the REST API).
 */
function Description( { item } ) {
	const { description, coverage } = item;
	const isPartial = coverage && coverage.covered < coverage.total;

	return (
		<>
			{ description && (
				<span className="elio-blocks-settings__icon-collection-description">
					{ description }
				</span>
			) }
			{ isPartial && (
				<span className="elio-blocks-settings__icon-collection-coverage">
					{ sprintf(
						/* translators: 1: number of weather conditions the collection has an icon for, 2: number of weather conditions. */
						_n(
							'Icons for %1$d of %2$d condition',
							'Icons for %1$d of %2$d conditions',
							coverage.total,
							'elio-blocks'
						),
						coverage.covered,
						coverage.total
					) }
				</span>
			) }
		</>
	);
}

const FIELDS = [
	{
		id: 'label',
		label: __( 'Name', 'elio-blocks' ),
		enableHiding: false,
		enableSorting: false,
	},
	{
		id: 'preview',
		label: __( 'Preview', 'elio-blocks' ),
		render: Preview,
		enableHiding: false,
		enableSorting: false,
	},
	{
		id: 'description',
		label: __( 'Description', 'elio-blocks' ),
		render: Description,
		enableSorting: false,
	},
];

const getItemId = ( collection ) => collection.slug;

/**
 * Picks the icon collection of the site among the registered ones, each
 * previewed in a grid as the Site Editor lists patterns.
 *
 * @param {Object}                 props
 * @param {string}                 props.value    Collection slug saved (or edited); an unregistered one shows the plugin one.
 * @param {(slug: string) => void} props.onChange Called with the slug chosen.
 */
export function ConditionIconCollectionPicker( { value, onChange } ) {
	const { collections, isResolving } = useConditionIconCollections();
	const [ view, setView ] = useState( {
		type: 'pickerGrid',
		titleField: 'label',
		mediaField: 'preview',
		descriptionField: 'description',
		fields: [],
		perPage: 100,
		layout: { previewSize: 160 },
	} );
	const selected = resolveConditionIconCollection(
		[ value ],
		isResolving ? null : collections
	);

	return (
		<div className="elio-blocks-settings__icon-collections">
			<DataViewsPicker
				data={ collections }
				fields={ FIELDS }
				view={ view }
				onChangeView={ setView }
				getItemId={ getItemId }
				isLoading={ isResolving }
				paginationInfo={ {
					totalItems: collections.length,
					totalPages: 1,
				} }
				defaultLayouts={ { pickerGrid: {} } }
				selection={ [ selected ] }
				// A site always has a collection: a click on the chosen one,
				// which would clear the selection, keeps it.
				onChangeSelection={ ( [ slug ] ) => slug && onChange( slug ) }
				itemListLabel={ __( 'Icon collections', 'elio-blocks' ) }
			>
				<DataViewsPicker.Layout />
			</DataViewsPicker>
		</div>
	);
}
