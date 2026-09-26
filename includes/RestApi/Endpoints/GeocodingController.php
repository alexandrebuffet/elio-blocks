<?php

namespace ElioBlocks\RestApi\Endpoints;

use WP_Error;
use WP_REST_Controller;
use WP_REST_Request;
use WP_REST_Response;
use ElioBlocks\Weather\Geocoding\GeocodingService;

// Exit if called directly.
if (! defined('ABSPATH')) {
    die;
}

/**
 * Handles GET /elio/v1/geocoding requests.
 */
class GeocodingController extends WP_REST_Controller
{
    /**
     * REST namespace.
     *
     * @var string
     */
    protected $namespace = 'elio/v1';

    /**
     * REST resource name.
     *
     * @var string
     */
    protected $rest_base = 'geocoding';

    /**
     * Constructor.
     *
     * @param GeocodingService $geocodingService Geocoding service instance.
     */
    public function __construct(private GeocodingService $geocodingService)
    {
    }

    /**
     * Registers the route.
     */
    public function register_routes(): void
    {
        register_rest_route(
            $this->namespace,
            '/' . $this->rest_base,
            array(
                array(
                    'methods'             => 'GET',
                    'callback'            => array( $this, 'get_items' ),
                    'permission_callback' => array( $this, 'get_items_permissions_check' ),
                    'args'                => $this->get_collection_params(),
                ),
            )
        );
    }

    /**
     * Checks whether the request may search locations.
     *
     * Location search only serves the block editor: anonymous access would turn
     * the site into a free relay to the upstream geocoding API.
     *
     * @param WP_REST_Request $request Full details about the request.
     * @return bool
     */
    public function get_items_permissions_check($request)
    {
        return current_user_can('edit_posts');
    }

    /**
     * Handles the GET request.
     *
     * Supports forward search only (search + limit). The search parameter is required.
     *
     * @param WP_REST_Request $request Full details about the request.
     * @return WP_REST_Response|WP_Error
     */
    public function get_items($request)
    {
        $search = $request->get_param('search');

        if (! is_string($search) || trim($search) === '') {
            return new WP_Error(
                'elio_blocks_geocoding_missing_params',
                __('Provide search.', 'elio-blocks'),
                array( 'status' => 400 )
            );
        }

        $limit = (int) $request->get_param('limit');
        if ($limit <= 0) {
            $limit = 10;
        }

        try {
            $result = $this->geocodingService->geocode(trim($search), $limit);
        } catch (\RuntimeException $e) {
            // The upstream message may expose network details: keep it out of the response.
            return new WP_Error(
                'elio_blocks_geocoding_error',
                __('Unable to search locations.', 'elio-blocks'),
                array( 'status' => 502 )
            );
        }

        return rest_ensure_response(
            array(
                'success' => true,
                'data'    => $result,
            )
        );
    }

    /**
     * Defines the query parameters for the collection.
     *
     * @return array<string, array<string, mixed>>
     */
    public function get_collection_params(): array
    {
        return array(
            'search' => array(
                'required'          => false,
                'type'              => 'string',
                'maxLength'         => 100,
                'sanitize_callback' => 'sanitize_text_field',
                'validate_callback' => 'rest_validate_request_arg',
                'description'       => __('Location search query (city name, postal code, etc.).', 'elio-blocks'),
            ),
            'limit'  => array(
                'required'          => false,
                'type'              => 'integer',
                'default'           => 10,
                'minimum'           => 1,
                'maximum'           => 20,
                'sanitize_callback' => 'absint',
                'validate_callback' => 'rest_validate_request_arg',
                'description'       => __('Maximum number of results.', 'elio-blocks'),
            ),
        );
    }
}
