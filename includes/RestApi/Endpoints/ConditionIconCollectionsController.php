<?php

namespace ElioBlocks\RestApi\Endpoints;

use WP_Error;
use WP_REST_Controller;
use WP_REST_Request;
use WP_REST_Response;
use ElioBlocks\Settings\PluginSettings;
use ElioBlocks\Weather\Condition\Icons\ConditionIconsRegistry;
use ElioBlocks\Weather\Condition\WmoConditionCodes;

// Exit if called directly.
if (! defined('ABSPATH')) {
    die;
}

/**
 * Handles GET /elio/v1/condition-icon-collections: the registered collections,
 * as /wp/v2/icon-collections lists the core ones, plus what a picker shows of
 * each one: a preview of six conditions and how many conditions it covers.
 */
class ConditionIconCollectionsController extends WP_REST_Controller
{
    /**
     * Conditions of the preview, the ones a weather report shows most, in two rows of three: a
     * clear day, clouds, a clear night, rain, snow, a thunderstorm.
     */
    private const PREVIEW = array(
        array( 'clear-sky', 'day' ),
        array( 'partly-cloudy', 'day' ),
        array( 'clear-sky', 'night' ),
        array( 'moderate-rain', 'day' ),
        array( 'moderate-snowfall', 'day' ),
        array( 'thunderstorm', 'day' ),
    );

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
    protected $rest_base = 'condition-icon-collections';

    public function __construct(
        private ConditionIconsRegistry $registry,
        private PluginSettings $settings,
    ) {
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
                    'permission_callback' => static fn(): bool => current_user_can('edit_posts'),
                    'args'                => array(),
                ),
                'schema' => array( $this, 'get_public_item_schema' ),
            )
        );
    }

    /**
     * Handles the GET request.
     *
     * @param WP_REST_Request $request Full details about the request.
     * @return WP_REST_Response|WP_Error
     */
    public function get_items($request)
    {
        if (! $this->registry->isBuilt()) {
            return new WP_Error(
                'elio_blocks_icons_not_ready',
                __('The icon registry is not ready yet.', 'elio-blocks'),
                array( 'status' => 503 )
            );
        }

        $site = $this->settings->getConditionIconCollection();

        if (! $this->registry->isCollectionRegistered($site)) {
            $site = ConditionIconsRegistry::DEFAULT_COLLECTION;
        }

        $items = array();

        foreach ($this->registry->getAllRegisteredCollections() as $collection) {
            $items[] = $collection + array(
                'is_default' => $collection['slug'] === $site,
                'coverage'   => $this->coverage($collection['slug']),
                'preview'    => $this->preview($collection['slug']),
            );
        }

        return rest_ensure_response($items);
    }

    /**
     * Counts how many WMO conditions the collection has an icon for, day and night.
     *
     * @return array{covered: int, total: int}
     */
    private function coverage(string $collection): array
    {
        $conditions = WmoConditionCodes::getSlugs();
        $covered    = 0;

        foreach ($conditions as $condition) {
            if (
                null !== $this->registry->getIconForCondition($collection, $condition, 'day')
                && null !== $this->registry->getIconForCondition($collection, $condition, 'night')
            ) {
                ++$covered;
            }
        }

        return array( 'covered' => $covered, 'total' => count($conditions) );
    }

    /**
     * Returns the icons of the preview conditions; null where the collection has none.
     *
     * @return list<array{name: string, content: string, style: string}|null>
     */
    private function preview(string $collection): array
    {
        $preview = array();

        foreach (self::PREVIEW as [$condition, $timeOfDay]) {
            $icon = $this->registry->getIconForCondition($collection, $condition, $timeOfDay);

            $preview[] = null !== $icon
                ? array( 'name' => $icon['name'], 'content' => $icon['content'], 'style' => $icon['style'] )
                : null;
        }

        return $preview;
    }

    /**
     * Retrieves the schema of an item.
     *
     * @return array<string, mixed>
     */
    public function get_item_schema(): array
    {
        return array(
            '$schema'    => 'http://json-schema.org/draft-04/schema#',
            'title'      => 'condition-icon-collection',
            'type'       => 'object',
            'properties' => array(
                'slug'        => array( 'type' => 'string', 'readonly' => true, 'description' => __('Collection slug.', 'elio-blocks') ),
                'label'       => array( 'type' => 'string', 'readonly' => true, 'description' => __('Human-readable label.', 'elio-blocks') ),
                'description' => array( 'type' => 'string', 'readonly' => true, 'description' => __('Human-readable description.', 'elio-blocks') ),
                'is_default'  => array( 'type' => 'boolean', 'readonly' => true, 'description' => __('Whether it is the collection of the site.', 'elio-blocks') ),
                'stroke_width' => array( 'type' => 'number', 'readonly' => true, 'description' => __('Stroke width the stroke icons are drawn with, what the condition icon block applies unless set on the block.', 'elio-blocks') ),
                'coverage'    => array(
                    'type'        => 'object',
                    'readonly'    => true,
                    'description' => __('Conditions the collection has an icon for, day and night, out of all the conditions.', 'elio-blocks'),
                    'properties'  => array(
                        'covered' => array( 'type' => 'integer' ),
                        'total'   => array( 'type' => 'integer' ),
                    ),
                ),
                'preview'     => array(
                    'type'        => 'array',
                    'readonly'    => true,
                    'description' => __('Icons of six conditions (clear day, clouds, clear night, rain, snow, thunderstorm); null where the collection has none.', 'elio-blocks'),
                    'items'       => array(
                        'type'       => array( 'object', 'null' ),
                        'properties' => array(
                            'name'    => array( 'type' => 'string' ),
                            'content' => array( 'type' => 'string' ),
                            'style'   => array( 'type' => 'string', 'enum' => array( 'fill', 'stroke' ) ),
                        ),
                    ),
                ),
            ),
        );
    }
}
