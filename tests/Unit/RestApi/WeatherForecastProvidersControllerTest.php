<?php

namespace ElioBlocks\Tests\Unit\RestApi;

use Brain\Monkey;
use Brain\Monkey\Functions;
use ElioBlocks\Provider\ProviderRegistry;
use ElioBlocks\RestApi\Endpoints\WeatherForecastProvidersController;
use ElioBlocks\Settings\PluginSettings;
use ElioBlocks\Tests\Stub\StubWeatherForecastProvider;
use ElioBlocks\WeatherForecast\WeatherForecastProviderRegistry;
use Mockery;
use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;
use PHPUnit\Framework\TestCase;
use WP_REST_Request;

/**
 * The block editor offers the providers /weather-forecast/providers lists
 * (Provider select of the report block), and so does the settings page for
 * the default one.
 */
class WeatherForecastProvidersControllerTest extends TestCase
{
    use MockeryPHPUnitIntegration;

    private WeatherForecastProviderRegistry $weatherForecastProviders;

    protected function setUp(): void
    {
        parent::setUp();
        Monkey\setUp();

        Functions\when('rest_ensure_response')->alias(static fn($data) => new \WP_REST_Response($data));

        // The built-in provider, one a third party registered on elio_blocks_init,
        // and one that serves something else than the weather forecast.
        $providers = new ProviderRegistry();
        $providers->register('open-meteo', ['label' => 'Open-Meteo']);
        $providers->register('air-only', ['label' => 'Air Only']);
        $providers->register('third-party', ['label' => 'Third Party', 'credentials' => ['api_key' => ['label' => 'API Key', 'required' => true]]]);

        $this->weatherForecastProviders = new WeatherForecastProviderRegistry($providers);
        $this->weatherForecastProviders->register('open-meteo', new StubWeatherForecastProvider());
        $this->weatherForecastProviders->register('third-party', new StubWeatherForecastProvider());
    }

    protected function tearDown(): void
    {
        Monkey\tearDown();
        parent::tearDown();
    }

    private function makeController(string $defaultProvider = 'open-meteo'): WeatherForecastProvidersController
    {
        $settings = $this->createMock(PluginSettings::class);
        $settings->method('getDefaultWeatherForecastProvider')->willReturn($defaultProvider);

        return new WeatherForecastProvidersController($this->weatherForecastProviders, $settings);
    }

    public function test_is_the_providers_route_of_the_weather_forecast(): void
    {
        Functions\expect('register_rest_route')
            ->once()
            ->with('elio/v1', '/weather-forecast/providers', Mockery::type('array'));

        $this->makeController()->register_routes();
    }

    public function test_lists_the_providers_that_serve_the_weather_forecast_and_the_site_default_one(): void
    {
        $response = $this->makeController('third-party')->get_items(new WP_REST_Request());

        $this->assertSame(
            [
                ['slug' => 'open-meteo', 'label' => 'Open-Meteo', 'isDefault' => false],
                ['slug' => 'third-party', 'label' => 'Third Party', 'isDefault' => true],
            ],
            $response->get_data()
        );
    }

    public function test_people_who_can_edit_content_can_list_them(): void
    {
        Functions\when('current_user_can')->alias(static fn(string $cap): bool => 'edit_posts' === $cap);

        $this->assertTrue($this->makeController()->get_items_permissions_check(new WP_REST_Request()));
    }

    public function test_anonymous_visitors_cannot_list_them(): void
    {
        Functions\when('current_user_can')->justReturn(false);

        $this->assertFalse($this->makeController()->get_items_permissions_check(new WP_REST_Request()));
    }
}
