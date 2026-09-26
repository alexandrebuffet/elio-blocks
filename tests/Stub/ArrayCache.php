<?php

namespace ElioBlocks\Tests\Stub;

use ElioBlocks\Contracts\Cache\CacheInterface;

/**
 * In-memory cache: lets tests assert on what ends up cached instead of on mock calls.
 */
final class ArrayCache implements CacheInterface
{
	/** @var array<string, mixed> */
	public array $entries = [];

	/** @var array<string, int> */
	public array $ttls = [];

	public function get(string $key): mixed
	{
		return $this->entries[$key] ?? false;
	}

	public function set(string $key, mixed $value, int $ttl = self::TTL_FROM_SETTINGS): bool
	{
		$this->entries[$key] = $value;
		$this->ttls[$key]    = $ttl;

		return true;
	}

	public function purge(): void
	{
		$this->entries = [];
		$this->ttls    = [];
	}

	public function key(mixed ...$parts): string
	{
		return md5(serialize($parts));
	}
}
