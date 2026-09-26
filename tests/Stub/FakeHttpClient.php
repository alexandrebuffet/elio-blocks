<?php

namespace ElioBlocks\Tests\Stub;

use ElioBlocks\Contracts\Http\HttpClientInterface;
use ElioBlocks\Contracts\Http\HttpResponse;

/**
 * HTTP client that answers from memory and records what was requested.
 */
final class FakeHttpClient implements HttpClientInterface
{
	/** @var list<string> */
	public array $requestedUrls = [];

	public function __construct(private HttpResponse|\Throwable $answer)
	{
	}

	public static function respondingWith(int $status, string $body): self
	{
		return new self(new HttpResponse($status, $body));
	}

	public static function failingWith(\Throwable $error): self
	{
		return new self($error);
	}

	public function get(string $url, array $options = array()): HttpResponse
	{
		$this->requestedUrls[] = $url;

		if ($this->answer instanceof \Throwable) {
			throw $this->answer;
		}

		return $this->answer;
	}

	/**
	 * Returns the query parameters of the last requested URL.
	 *
	 * @return array<string, string>
	 */
	public function lastQuery(): array
	{
		parse_str((string) parse_url((string) end($this->requestedUrls), PHP_URL_QUERY), $query);

		return $query;
	}
}
