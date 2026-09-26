<?php

namespace ElioBlocks\WordPress\Http;

use RuntimeException;
use ElioBlocks\Contracts\Http\HttpClientInterface;
use ElioBlocks\Contracts\Http\HttpResponse;

// Exit if called directly.
if (! defined('ABSPATH')) {
    die;
}

/**
 * HTTP client implementation using WordPress HTTP API.
 *
 * Every request names the plugin and the site in its User-Agent: some
 * providers ask for no key but refuse an application that does not identify
 * itself (MET Norway, the US National Weather Service). WordPress already sends
 * the site address in its default User-Agent.
 */
class WpHttpClient implements HttpClientInterface
{
    /**
     * Constructor.
     *
     * @param string $version Plugin version, named in the User-Agent.
     */
    public function __construct(
        private string $version,
    ) {
    }

    /**
     * {@inheritDoc}
     */
    public function get(string $url, array $options = array()): HttpResponse
    {
        $timeout = isset($options['timeout']) && is_int($options['timeout'])
            ? $options['timeout']
            : 10;

        $response = wp_remote_get(
            $url,
            array(
                'timeout'    => $timeout,
                'user-agent' => $this->userAgent(),
            )
        );

        if (is_wp_error($response)) {
            throw new RuntimeException(esc_html($response->get_error_message()));
        }

        $code = (int) wp_remote_retrieve_response_code($response);
        $body = (string) wp_remote_retrieve_body($response);

        return new HttpResponse($code, $body);
    }

    /**
     * Returns the User-Agent of the requests: "ElioBlocks/0.1.0 (+https://example.com/) WordPress/6.9".
     */
    private function userAgent(): string
    {
        return sprintf('ElioBlocks/%s (+%s) WordPress/%s', $this->version, home_url('/'), get_bloginfo('version'));
    }
}
