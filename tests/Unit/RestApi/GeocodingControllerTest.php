<?php

namespace ElioBlocks\Tests\Unit\RestApi;

use Brain\Monkey;
use Brain\Monkey\Functions;
use ElioBlocks\RestApi\Endpoints\GeocodingController;
use ElioBlocks\Tests\Stub\ArrayCache;
use ElioBlocks\Weather\Geocoding\GeocodingProviderInterface;
use ElioBlocks\Weather\Geocoding\GeocodingService;
use PHPUnit\Framework\TestCase;
use WP_Error;
use WP_REST_Request;

class GeocodingControllerTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        Monkey\setUp();

        Functions\when('__')->returnArg();
        Functions\when('rest_ensure_response')->alias(static fn($data) => new \WP_REST_Response($data));
    }

    protected function tearDown(): void
    {
        Monkey\tearDown();
        parent::tearDown();
    }

    private function makeController(?GeocodingProviderInterface $provider = null): GeocodingController
    {
        $provider ??= $this->createMock(GeocodingProviderInterface::class);

        return new GeocodingController(new GeocodingService($provider, new ArrayCache()));
    }

    public function test_location_search_is_reserved_to_people_who_can_edit_content(): void
    {
        Functions\when('current_user_can')->alias(static fn(string $cap): bool => 'edit_posts' === $cap);

        $this->assertTrue($this->makeController()->get_items_permissions_check(new WP_REST_Request()));
    }

    public function test_anonymous_visitors_cannot_use_the_site_as_a_geocoding_relay(): void
    {
        Functions\when('current_user_can')->justReturn(false);

        $this->assertFalse($this->makeController()->get_items_permissions_check(new WP_REST_Request()));
    }

    public function test_search_length_and_result_count_are_capped_by_the_route_schema(): void
    {
        $params = $this->makeController()->get_collection_params();

        $this->assertSame(100, $params['search']['maxLength']);
        $this->assertSame(array( 1, 20 ), array( $params['limit']['minimum'], $params['limit']['maximum'] ));
    }

    public function test_upstream_failure_is_a_502_that_does_not_leak_the_upstream_message(): void
    {
        $failing = $this->createMock(GeocodingProviderInterface::class);
        $failing->method('geocode')->willThrowException(new \RuntimeException('cURL error 6: could not resolve host'));

        $error = $this->makeController($failing)->get_items(new WP_REST_Request(array( 'search' => 'Paris', 'limit' => 5 )));

        $this->assertInstanceOf(WP_Error::class, $error);
        $this->assertSame(502, $error->get_error_data()['status']);
        $this->assertStringNotContainsString('cURL', $error->get_error_message());
    }
}
