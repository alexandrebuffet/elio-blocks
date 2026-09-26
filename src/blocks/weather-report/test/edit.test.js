/**
 * External dependencies
 */
import { describe, expect, it, vi } from 'vitest';

/**
 * WordPress dependencies
 */
import { createRegistry, createReduxStore } from '@wordpress/data';

/**
 * Internal dependencies
 */
import ReportEdit from '../edit';
import { useWeatherForecastQuery } from '../../../block-editor/hooks';
import { renderWithRegistry } from '../../../test-utils/render-hook';

vi.mock( '@wordpress/block-editor', () => ( {
	useBlockProps: ( props ) => props ?? {},
	useInnerBlocksProps: ( props ) => ( {
		...props,
		children: <p data-testid="inner-blocks">inner blocks</p>,
	} ),
} ) );
vi.mock( '@wordpress/components', () => ( {
	Spinner: () => <span data-testid="spinner" />,
	Notice: ( { status, children } ) => (
		<div data-testid="notice" data-status={ status }>
			{ children }
		</div>
	),
} ) );
vi.mock( '../../../block-editor/hooks', () => ( {
	useWeatherForecastQuery: vi.fn(),
} ) );
vi.mock( '../inspector', () => ( { default: () => null } ) );
vi.mock( '../edit/report-placeholder', () => ( {
	default: () => <div data-testid="placeholder" />,
} ) );

const PARIS = { latitude: 48.8566, longitude: 2.3522, name: 'Paris' };

function makeRegistry( innerBlocks = [ { clientId: 'temperature' } ] ) {
	const registry = createRegistry();
	registry.register(
		createReduxStore( 'core/block-editor', {
			reducer: ( state = {} ) => state,
			selectors: { getBlocks: () => innerBlocks },
		} )
	);
	return registry;
}

function renderEdit( registry = makeRegistry() ) {
	return renderWithRegistry(
		registry,
		<ReportEdit
			clientId="report"
			attributes={ { location: PARIS } }
			setAttributes={ () => {} }
			isSelected={ false }
		/>
	).container;
}

const has = ( container, testId ) =>
	container.querySelector( `[data-testid="${ testId }"]` ) !== null;

describe( 'weather-report edit', () => {
	it( 'keeps its inner blocks in place while the weather forecast loads', () => {
		useWeatherForecastQuery.mockReturnValue( {
			data: null,
			isLoading: true,
			error: null,
		} );

		const container = renderEdit();

		// Unmounting them loses the selection and the undo history of what is being edited.
		expect( has( container, 'inner-blocks' ) ).toBe( true );
		expect( has( container, 'spinner' ) ).toBe( true );
		expect( container.firstElementChild.getAttribute( 'aria-busy' ) ).toBe(
			'true'
		);
	} );

	it( 'shows no spinner once the weather forecast is there', () => {
		useWeatherForecastQuery.mockReturnValue( {
			data: { current: {} },
			isLoading: false,
			error: null,
		} );

		const container = renderEdit();

		expect( has( container, 'inner-blocks' ) ).toBe( true );
		expect( has( container, 'spinner' ) ).toBe( false );
		expect( has( container, 'notice' ) ).toBe( false );
	} );

	it( 'tells the editor when the weather forecast could not be loaded', () => {
		useWeatherForecastQuery.mockReturnValue( {
			data: null,
			isLoading: false,
			error: 'Unable to fetch weather forecast data.',
		} );

		const container = renderEdit();

		const notice = container.querySelector( '[data-testid="notice"]' );
		expect( notice.getAttribute( 'data-status' ) ).toBe( 'error' );
		expect( notice.textContent ).toContain(
			'Unable to fetch weather forecast data.'
		);
		expect( has( container, 'inner-blocks' ) ).toBe( true );
	} );

	it( 'asks for the weather forecast of its location, provider and units', () => {
		useWeatherForecastQuery.mockReturnValue( {
			data: null,
			isLoading: false,
		} );

		renderEdit();

		expect( useWeatherForecastQuery ).toHaveBeenLastCalledWith( {
			latitude: 48.8566,
			longitude: 2.3522,
			provider: '',
			units: '',
		} );
	} );

	it( 'shows the setup placeholder while it has no inner blocks', () => {
		useWeatherForecastQuery.mockReturnValue( {
			data: null,
			isLoading: false,
		} );

		const container = renderEdit( makeRegistry( [] ) );

		expect( has( container, 'placeholder' ) ).toBe( true );
	} );
} );
