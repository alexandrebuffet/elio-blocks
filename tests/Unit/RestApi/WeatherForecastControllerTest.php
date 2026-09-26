<?php

namespace ElioBlocks\Tests\Unit\RestApi;

use Brain\Monkey;
use Brain\Monkey\Filters;
use Brain\Monkey\Functions;
use ElioBlocks\RestApi\Endpoints\WeatherForecastController;
use ElioBlocks\Provider\ProviderRegistry;
use ElioBlocks\Settings\PluginSettings;
use ElioBlocks\Tests\Stub\ArrayCache;
use ElioBlocks\Tests\Stub\FixedSecret;
use ElioBlocks\Tests\Stub\StubWeatherForecastProvider;
use ElioBlocks\Tests\Support\WordPressCore;
use ElioBlocks\Weather\Condition\Icons\ConditionIconCollectionResolver;
use ElioBlocks\Weather\Condition\Icons\ConditionIconsRegistry;
use ElioBlocks\Weather\Coordinates;
use ElioBlocks\WeatherForecast\WeatherForecastProviderInterface;
use ElioBlocks\WeatherForecast\WeatherForecastPresenter;
use ElioBlocks\WeatherForecast\WeatherForecastProviderRegistry;
use ElioBlocks\WeatherForecast\WeatherForecastRequestSigner;
use ElioBlocks\WeatherForecast\WeatherForecastService;
use ElioBlocks\Weather\Units\UnitsConversionService;
use PHPUnit\Framework\TestCase;
use WP_Error;
use WP_REST_Request;

class WeatherForecastControllerTest extends TestCase
{
    private WeatherForecastProviderRegistry $providers;
    private WeatherForecastRequestSigner $signer;
    private ConditionIconsRegistry $icons;

    protected function setUp(): void
    {
        parent::setUp();
        Monkey\setUp();

        Functions\when('__')->returnArg();
        Functions\stubEscapeFunctions();
        Functions\when('rest_ensure_response')->alias(static fn($data) => new \WP_REST_Response($data));
        Functions\when('current_user_can')->justReturn(false);

        $providers = new ProviderRegistry();
        $providers->register('stub', array( 'label' => 'Stub' ));
        $providers->register('keyed', array( 'label' => 'Keyed', 'credentials' => array( 'api_key' => array( 'label' => 'API Key', 'required' => true ) ) ));

        $this->providers = new WeatherForecastProviderRegistry($providers);
        $this->signer    = new WeatherForecastRequestSigner(new FixedSecret('s3cret'));
        $this->icons     = new ConditionIconsRegistry();
    }

    protected function tearDown(): void
    {
        Monkey\tearDown();
        parent::tearDown();
    }

    private function makeController(string $siteUnitSystem = 'metric'): WeatherForecastController
    {
        $settings = $this->createMock(PluginSettings::class);
        $settings->method('getDefaultWeatherForecastProvider')->willReturn('stub');
        $settings->method('getUnitSystem')->willReturn($siteUnitSystem);
        $settings->method('getUnitOverrides')->willReturn(array());
        $settings->method('getConditionIconCollection')->willReturn('elio');

        $service = new WeatherForecastService(
            $this->providers,
            new ArrayCache(),
            new WeatherForecastPresenter($this->icons, new UnitsConversionService()),
            $settings,
        );

        return new WeatherForecastController($service, $settings, $this->signer, new ConditionIconCollectionResolver($this->icons, $settings));
    }

    private function parisRequest(array $extra = array()): WP_REST_Request
    {
        return new WP_REST_Request(
            $extra + array(
                'latitude'  => 48.8566,
                'longitude' => 2.3522,
                'provider'  => '',
                'units'     => 'metric',
            )
        );
    }

    private function registerTwoCollections(): void
    {
        WordPressCore::stubKses();
        $this->icons->registerCollection('elio', array( 'label' => 'Elio' ));
        $this->icons->registerIcon('elio/sun', array( 'content' => '<svg></svg>', 'conditions' => array( array( 'clear-sky', 'all' ) ) ));
        $this->icons->registerCollection('theme', array( 'label' => 'Theme' ));
        $this->icons->registerIcon('theme/sunny', array( 'content' => '<svg></svg>', 'conditions' => array( array( 'clear-sky', 'all' ) ) ));
        $this->providers->register('stub', new StubWeatherForecastProvider(array( 'current' => array( 'condition_code' => 0 ) )));
    }

    public function test_items_name_their_icon_in_the_collections_the_request_asks_for(): void
    {
        $this->registerTwoCollections();

        $response = $this->makeController()->get_items($this->parisRequest(array( 'icon_collections' => array( 'theme', 'uninstalled' ) )));

        $this->assertSame(array( 'theme' => 'theme/sunny' ), $response->get_data()['current']['condition_icons']);
        $this->assertSame(array( 'theme/sunny' ), array_keys($response->get_data()['icons']));
    }

    public function test_a_request_naming_no_collection_gets_the_one_of_the_site(): void
    {
        $this->registerTwoCollections();

        $response = $this->makeController()->get_items($this->parisRequest());

        $this->assertSame(array( 'elio' => 'elio/sun' ), $response->get_data()['current']['condition_icons']);
    }

    public function test_the_collections_are_not_part_of_the_signature(): void
    {
        $signature = $this->signer->sign(Coordinates::fromFloats(48.8566, 2.3522), '', 'metric');
        $request   = $this->parisRequest(array( 'signature' => $signature, 'icon_collections' => array( 'theme' ) ));

        // They change no provider call and no cache entry: a page cache may hold an older list.
        $this->assertTrue($this->makeController()->get_items_permissions_check($request));
    }

    public function test_coordinates_are_bounded_by_the_route_schema(): void
    {
        $params = $this->makeController()->get_collection_params();

        $this->assertSame(array( -90, 90 ), array( $params['latitude']['minimum'], $params['latitude']['maximum'] ));
        $this->assertSame(array( -180, 180 ), array( $params['longitude']['minimum'], $params['longitude']['maximum'] ));
    }

    public function test_anonymous_request_without_a_signature_is_refused(): void
    {
        $this->assertFalse($this->makeController()->get_items_permissions_check($this->parisRequest()));
    }

    public function test_anonymous_request_signed_at_render_time_is_allowed(): void
    {
        $signature = $this->signer->sign(Coordinates::fromFloats(48.8566, 2.3522), '', 'metric');

        $this->assertTrue(
            $this->makeController()->get_items_permissions_check($this->parisRequest(array( 'signature' => $signature )))
        );
    }

    public function test_a_signature_cannot_be_replayed_for_another_location(): void
    {
        $signature = $this->signer->sign(Coordinates::fromFloats(48.8566, 2.3522), '', 'metric');
        $request   = $this->parisRequest(array( 'latitude' => 40.71, 'longitude' => -74.0, 'signature' => $signature ));

        $this->assertFalse($this->makeController()->get_items_permissions_check($request));
    }

    public function test_editors_do_not_need_a_signature(): void
    {
        Functions\when('current_user_can')->alias(static fn(string $cap): bool => 'edit_posts' === $cap);

        $this->assertTrue($this->makeController()->get_items_permissions_check($this->parisRequest()));
    }

    public function test_a_filter_can_open_the_endpoint_to_everyone(): void
    {
        Filters\expectApplied('elio_blocks/weather_forecast_public_access')->once()->andReturn(true);

        $this->assertTrue($this->makeController()->get_items_permissions_check($this->parisRequest()));
    }

    public function test_returns_the_weather_forecast_of_the_default_provider_for_rounded_coordinates(): void
    {
        $provider = new StubWeatherForecastProvider(array( 'current' => array( 'temperature' => 20.0 ) ));
        $this->providers->register('stub', $provider);

        $response = $this->makeController()->get_items($this->parisRequest());

        $this->assertSame(20.0, $response->get_data()['current']['temperature']);
        $this->assertSame(array( 'latitude' => 48.86, 'longitude' => 2.35, 'units' => 'metric' ), $provider->calls[0]);
    }

    public function test_the_route_accepts_empty_units_and_does_not_default_to_metric(): void
    {
        $units = $this->makeController()->get_collection_params()['units'];

        $this->assertContains('', $units['enum']);
        $this->assertSame('', $units['default'], 'A metric default would override the unit system of an imperial site.');
    }

    public function test_the_editor_leaves_units_empty_to_get_the_unit_system_of_the_site(): void
    {
        $provider = new StubWeatherForecastProvider(array( 'current' => array( 'temperature' => 68.0 ) ));
        $this->providers->register('stub', $provider);

        $response = $this->makeController('imperial')->get_items($this->parisRequest(array( 'units' => '' )));

        $this->assertSame('imperial', $provider->calls[0]['units']);
        $this->assertSame('imperial', $response->get_data()['meta']['units']);
    }

    public function test_an_unknown_provider_is_a_404_not_an_upstream_failure(): void
    {
        $error = $this->makeController()->get_items($this->parisRequest(array( 'provider' => 'retired-provider' )));

        $this->assertInstanceOf(WP_Error::class, $error);
        $this->assertSame('elio_blocks_provider_not_found', $error->get_error_code());
        $this->assertSame(404, $error->get_error_data()['status']);
    }

    public function test_a_third_party_provider_that_crashes_is_a_502_not_a_fatal_error(): void
    {
        $crashing = $this->createMock(WeatherForecastProviderInterface::class);
        $crashing->method('fetch')->willThrowException(new \TypeError('Unsupported operand types: string * float'));
        $this->providers->register('stub', $crashing);

        $error = $this->makeController()->get_items($this->parisRequest());

        $this->assertInstanceOf(WP_Error::class, $error);
        $this->assertSame(502, $error->get_error_data()['status']);
        $this->assertStringNotContainsString('operand', $error->get_error_message());
    }

    public function test_upstream_failure_is_a_502_that_does_not_leak_the_upstream_message(): void
    {
        $failing = $this->createMock(WeatherForecastProviderInterface::class);
        $failing->method('fetch')->willThrowException(new \RuntimeException('cURL error 28: resolving api.internal timed out'));
        $this->providers->register('stub', $failing);

        $error = $this->makeController()->get_items($this->parisRequest());

        $this->assertInstanceOf(WP_Error::class, $error);
        $this->assertSame(502, $error->get_error_data()['status']);
        $this->assertStringNotContainsString('cURL', $error->get_error_message());
    }

    public function test_a_provider_missing_a_required_credential_is_a_503_that_says_so(): void
    {
        $keyed = $this->createMock(WeatherForecastProviderInterface::class);
        $keyed->expects($this->never())->method('fetch');
        $this->providers->register('keyed', $keyed);

        $error = $this->makeController()->get_items($this->parisRequest(array( 'provider' => 'keyed' )));

        $this->assertInstanceOf(WP_Error::class, $error);
        $this->assertSame('elio_blocks_provider_not_configured', $error->get_error_code());
        $this->assertSame(503, $error->get_error_data()['status']);
    }
}
