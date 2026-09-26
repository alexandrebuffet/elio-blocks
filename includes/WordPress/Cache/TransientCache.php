<?php

namespace ElioBlocks\WordPress\Cache;

use ElioBlocks\Contracts\Cache\CacheInterface;
use ElioBlocks\Settings\PluginSettings;

// Exit if called directly.
if (! defined('ABSPATH')) {
    die;
}

/**
 * Simple cache layer wrapping WordPress transients.
 *
 * When the plugin setting "cache enabled" is false, get() always returns false
 * and set() is a no-op, forcing a live fetch on every request.
 */
class TransientCache implements CacheInterface
{
    /**
     * Prefix of every transient the plugin stores.
     */
    public const PREFIX = 'elio_blocks_';

    /**
     * Key prefix.
     *
     * @var string
     */
    private string $prefix;

    /**
     * Plugin settings (provides dynamic TTL and enabled flag).
     *
     * @var PluginSettings
     */
    private PluginSettings $settings;

    /**
     * Constructor.
     *
     * @param string         $prefix   Transient key prefix.
     * @param PluginSettings $settings Plugin settings service.
     */
    public function __construct(string $prefix, PluginSettings $settings)
    {
        $this->prefix   = $prefix;
        $this->settings = $settings;
    }

    /**
     * Retrieves a cached value.
     *
     * Returns false immediately when cache is disabled.
     *
     * @param string $key Cache key (without prefix).
     * @return mixed|false Cached value or false if not found / cache disabled.
     */
    public function get(string $key): mixed
    {
        if (! $this->settings->isCacheEnabled()) {
            return false;
        }

        return get_transient($this->prefix . $key);
    }

    /**
     * Stores a value in the cache.
     *
     * No-op when cache is disabled.
     *
     * @param string $key   Cache key (without prefix).
     * @param mixed  $value Value to cache.
     * @param int    $ttl   Optional TTL override in seconds (0 = use settings).
     * @return bool
     */
    public function set(string $key, mixed $value, int $ttl = CacheInterface::TTL_FROM_SETTINGS): bool
    {
        if (! $this->settings->isCacheEnabled()) {
            return false;
        }

        $expiration = $ttl > 0 ? $ttl : $this->settings->getCacheTime();

        return set_transient($this->prefix . $key, $value, $expiration);
    }

    /**
     * Deletes all transients stored under this cache's prefix.
     *
     * Transients held by a persistent object cache cannot be listed: they are
     * left to expire on their own.
     */
    public function purge(): void
    {
        global $wpdb;
        $like = $wpdb->esc_like('_transient_' . $this->prefix) . '%';
        $wpdb->query( // phpcs:ignore WordPress.DB.DirectDatabaseQuery
            $wpdb->prepare(
                "DELETE FROM {$wpdb->options} WHERE option_name LIKE %s OR option_name LIKE %s",
                $like,
                str_replace('_transient_', '_transient_timeout_', $like)
            )
        );
    }

    /**
     * Builds a deterministic cache key from parameters.
     *
     * @param mixed ...$parts Key parts to hash.
     * @return string
     */
    public function key(mixed ...$parts): string
    {
        $json = wp_json_encode($parts);
        return md5(false !== $json ? $json : serialize($parts));
    }
}
