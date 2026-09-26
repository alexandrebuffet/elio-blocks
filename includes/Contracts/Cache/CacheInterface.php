<?php

declare(strict_types=1);

namespace ElioBlocks\Contracts\Cache;

// Exit if called directly.
if (! defined('ABSPATH')) {
    die;
}

/**
 * Cache contract.
 */
interface CacheInterface
{
    /**
     * Pass as $ttl to use the TTL from plugin settings (default behaviour).
     */
    public const TTL_FROM_SETTINGS = 0;

    /**
     * Retrieves a cached value.
     *
     * @param string $key Cache key (without prefix).
     * @return mixed Cached value or false if not found.
     */
    public function get(string $key): mixed;

    /**
     * Stores a value in the cache.
     *
     * @param string $key   Cache key (without prefix).
     * @param mixed  $value Value to cache.
     * @param int    $ttl   Optional TTL override in seconds.
     * @return bool
     */
    public function set(string $key, mixed $value, int $ttl = self::TTL_FROM_SETTINGS): bool;

    /**
     * Removes every entry stored by this cache.
     */
    public function purge(): void;

    /**
     * Builds a deterministic cache key from parameters.
     *
     * @param mixed ...$parts Key parts to hash.
     * @return string
     */
    public function key(mixed ...$parts): string;
}
