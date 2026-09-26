<?php

namespace ElioBlocks\Tests\Stub;

use ElioBlocks\Contracts\Cache\CacheInterface;

/**
 * Cache that never stores anything: what TransientCache does when caching is disabled.
 */
final class NullCache implements CacheInterface
{
	public function get(string $key): mixed
	{
		return false;
	}

	public function set(string $key, mixed $value, int $ttl = self::TTL_FROM_SETTINGS): bool
	{
		return false;
	}

	public function purge(): void
	{
	}

	public function key(mixed ...$parts): string
	{
		return md5(serialize($parts));
	}
}
