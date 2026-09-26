<?php

namespace ElioBlocks\Tests\Stub;

use ElioBlocks\Contracts\Security\SecretInterface;

final class FixedSecret implements SecretInterface
{
	public function __construct(private string $value) {}

	public function get(): string
	{
		return $this->value;
	}
}
