<?php

declare(strict_types=1);

namespace ElioBlocks\Contracts\Http;

// Exit if called directly.
if (! defined('ABSPATH')) {
    die;
}

/**
 * Immutable HTTP response value object.
 */
final class HttpResponse
{
    /**
     * HTTP status code.
     *
     * @var int
     */
    private int $statusCode;

    /**
     * Response body.
     *
     * @var string
     */
    private string $body;

    /**
     * Constructor.
     *
     * @param int    $statusCode HTTP status code.
     * @param string $body        Response body.
     */
    public function __construct(int $statusCode, string $body)
    {
        $this->statusCode = $statusCode;
        $this->body       = $body;
    }

    /**
     * Returns the HTTP status code.
     *
     * @return int
     */
    public function getStatusCode(): int
    {
        return $this->statusCode;
    }

    /**
     * Returns the response body.
     *
     * @return string
     */
    public function getBody(): string
    {
        return $this->body;
    }
}
