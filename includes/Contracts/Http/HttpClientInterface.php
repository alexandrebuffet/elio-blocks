<?php

declare(strict_types=1);

namespace ElioBlocks\Contracts\Http;

use ElioBlocks\Contracts\Http\HttpResponse;

// Exit if called directly.
if (! defined('ABSPATH')) {
    die;
}

/**
 * HTTP client contract for the Weather layer (WordPress-agnostic).
 */
interface HttpClientInterface
{
    /**
     * Performs a GET request.
     *
     * @param string               $url     Request URL.
     * @param array<string, mixed> $options Optional request options. Supported: 'timeout' (int, seconds).
     * @return HttpResponse Response instance.
     *
     * @throws \RuntimeException On transport failure (e.g. network error).
     */
    public function get(string $url, array $options = array()): HttpResponse;
}
