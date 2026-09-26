<?php

namespace ElioBlocks\RestApi\Hooks;

use ElioBlocks\Contracts\HookInterface;
use ElioBlocks\Contracts\Cache\CacheInterface;

// Exit if called directly.
if (! defined('ABSPATH')) {
    die;
}

/**
 * Registers the cache purge REST endpoint.
 */
class RegisterCacheApi implements HookInterface
{
    /**
     * Constructor.
     *
     * @param CacheInterface $cache Cache used to purge weather data on request.
     */
    public function __construct(private CacheInterface $cache)
    {
    }

    /**
     * {@inheritDoc}
     */
    public function initHooks(): void
    {
        add_action('rest_api_init', array( $this, 'registerCachePurgeRoute' ));
    }

    /**
     * Registers the cache purge REST endpoint.
     * POST /elio/v1/cache/purge — requires manage_options capability.
     */
    public function registerCachePurgeRoute(): void
    {
        register_rest_route(
            'elio/v1',
            '/cache/purge',
            array(
                'methods'             => 'POST',
                'callback'            => array( $this, 'handleCachePurge' ),
                'permission_callback' => static function () {
                    return current_user_can('manage_options');
                },
            )
        );
    }

    /**
     * Handles the cache purge request.
     *
     * @return \WP_REST_Response
     */
    public function handleCachePurge(): \WP_REST_Response
    {
        $this->cache->purge();

        return new \WP_REST_Response(
            array(
                'success' => true,
                'message' => __('Cache purged.', 'elio-blocks'),
            ),
            200
        );
    }
}
