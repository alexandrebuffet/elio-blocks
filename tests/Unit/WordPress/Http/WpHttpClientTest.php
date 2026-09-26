<?php

namespace ElioBlocks\Tests\Unit\WordPress\Http;

use Brain\Monkey;
use Brain\Monkey\Functions;
use ElioBlocks\WordPress\Http\WpHttpClient;
use PHPUnit\Framework\TestCase;

/**
 * Some providers ask for no key but refuse an application that does not
 * identify itself (MET Norway, the US National Weather Service).
 */
class WpHttpClientTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        Monkey\setUp();
        Functions\when('home_url')->justReturn('https://example.com/');
        Functions\when('get_bloginfo')->justReturn('6.9');
        Functions\when('is_wp_error')->justReturn(false);
        Functions\when('wp_remote_retrieve_response_code')->justReturn(200);
        Functions\when('wp_remote_retrieve_body')->justReturn('{}');
    }

    protected function tearDown(): void
    {
        Monkey\tearDown();
        parent::tearDown();
    }

    public function test_every_request_names_the_plugin_and_the_site(): void
    {
        $sent = null;
        Functions\when('wp_remote_get')->alias(function (string $url, array $args) use (&$sent): array {
            $sent = $args;
            return array();
        });

        $response = (new WpHttpClient('1.2.3'))->get('https://api.example.org/', array( 'timeout' => 5 ));

        $this->assertSame(200, $response->getStatusCode());
        $this->assertSame(
            array(
                'timeout'    => 5,
                'user-agent' => 'ElioBlocks/1.2.3 (+https://example.com/) WordPress/6.9',
            ),
            $sent
        );
    }
}
