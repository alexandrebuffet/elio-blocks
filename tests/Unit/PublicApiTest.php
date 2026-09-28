<?php

namespace ElioBlocks\Tests\Unit;

use Brain\Monkey;
use Brain\Monkey\Actions;
use Brain\Monkey\Functions;
use ElioBlocks\Interactivity\Blocks\Report\ReportContext;
use ElioBlocks\Plugin;
use ElioBlocks\Provider\Hooks\RegisterProviders;
use ElioBlocks\Provider\Provider;
use ElioBlocks\Provider\ProviderCredential;
use ElioBlocks\Provider\ProviderRegistry;
use ElioBlocks\Tests\Stub\StubWeatherForecastProvider;
use ElioBlocks\Tests\Support\WordPressCore;
use ElioBlocks\Weather\Condition\Icons\ConditionIconsRegistry;
use ElioBlocks\Weather\Condition\Icons\Hooks\RegisterConditionIcons;
use ElioBlocks\WeatherForecast\Hooks\RegisterWeatherForecastProviders;
use ElioBlocks\WeatherForecast\WeatherForecastProviderRegistry;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;
use PHPUnit\Framework\TestCase;
use WP_Block;

/**
 * The functions of functions.php, against the services of a real container.
 * Each test runs in its own process: Plugin is a singleton.
 */
class PublicApiTest extends TestCase
{
    private const WEATHER_FORECAST = [
        'current' => ['temperature' => 20.0, 'condition_icons' => ['elio' => 'elio/sun']],
        'daily'   => [['timestamp' => '2026-07-01T00:00:00+02:00'], ['timestamp' => '2026-07-02T00:00:00+02:00']],
        'icons'   => ['elio/sun' => ['content' => '<svg></svg>', 'style' => 'fill']],
    ];

    protected function setUp(): void
    {
        parent::setUp();
        Monkey\setUp();

        if (! defined('ELIO_BLOCKS_PLUGIN_PATH')) {
            define('ELIO_BLOCKS_PLUGIN_PATH', dirname(__DIR__, 2) . '/');
        }
        if (! defined('ELIO_BLOCKS_VERSION')) {
            define('ELIO_BLOCKS_VERSION', '0.0.0-test');
        }
        if (! defined('ELIO_BLOCKS_PLUGIN_URL')) {
            define('ELIO_BLOCKS_PLUGIN_URL', 'https://example.test/wp-content/plugins/elio-blocks/');
        }
    }

    protected function tearDown(): void
    {
        Monkey\tearDown();
        parent::tearDown();
    }

    #[RunInSeparateProcess]
    #[PreserveGlobalState(false)]
    public function test_holds_the_registration_functions_and_the_template_functions_of_the_blocks(): void
    {
        require_once dirname(__DIR__, 2) . '/functions.php';

        $functions = array_values(
            array_filter(
                get_defined_functions()['user'],
                static fn(string $name): bool => str_starts_with($name, 'elio_blocks_')
            )
        );
        sort($functions);

        $this->assertSame(
            [
                'elio_blocks_add_icon_to_sprite',
                'elio_blocks_get_condition_icon',
                'elio_blocks_get_condition_icon_collection',
                'elio_blocks_get_current_conditions',
                'elio_blocks_get_forecast_items',
                'elio_blocks_get_weather_forecast_attribution',
                'elio_blocks_get_weather_report_interactivity_context',
                'elio_blocks_get_weather_report_interactivity_state',
                'elio_blocks_register_condition_icon',
                'elio_blocks_register_condition_icon_collection',
                'elio_blocks_register_provider',
                'elio_blocks_register_weather_forecast_provider',
                'elio_blocks_render_icon_sprite',
                'elio_blocks_unregister_condition_icon',
                'elio_blocks_unregister_condition_icon_collection',
            ],
            $functions
        );
    }

    #[RunInSeparateProcess]
    #[PreserveGlobalState(false)]
    public function test_a_provider_and_its_weather_forecast_provider_registered_on_elio_blocks_init_go_to_the_registries_the_plugin_reads_and_locks(): void
    {
        require_once dirname(__DIR__, 2) . '/functions.php';
        // The slug in the error message is escaped.
        Functions\stubEscapeFunctions();

        $container               = Plugin::instance()->container();
        $providersHook           = $container->get(RegisterProviders::class);
        $weatherForecastHook     = $container->get(RegisterWeatherForecastProviders::class);
        $weatherForecastProvider = new StubWeatherForecastProvider();

        // What a third party does.
        Actions\expectDone('elio_blocks_init')->once()->whenHappen(
            static function () use ($weatherForecastProvider): void {
                elio_blocks_register_provider('third-party', ['label' => 'Third Party', 'credentials' => ['api_key' => ['label' => 'API Key', 'required' => true, 'secret' => true]]]);
                elio_blocks_register_weather_forecast_provider('third-party', $weatherForecastProvider);
            }
        );

        // What the plugin does on 'init', priorities 25 and 26.
        $weatherForecastHook->firePublicAction();
        $providersHook->lockRegistry();
        $weatherForecastHook->lockRegistry();

        $this->assertEquals(
            new Provider('third-party', 'Third Party', ['api_key' => new ProviderCredential('api_key', 'API Key', '', true, true)]),
            $container->get(ProviderRegistry::class)->getBySlug('third-party')
        );
        $this->assertSame(
            $weatherForecastProvider,
            $container->get(WeatherForecastProviderRegistry::class)->getBySlug('third-party')
        );

        Functions\expect('_doing_it_wrong')->twice();
        $this->assertFalse(elio_blocks_register_provider('too-late', ['label' => 'Too Late']));
        $this->assertFalse(elio_blocks_register_weather_forecast_provider('third-party', new StubWeatherForecastProvider()));
    }

    #[RunInSeparateProcess]
    #[PreserveGlobalState(false)]
    public function test_an_icon_collection_registered_on_elio_blocks_init_goes_to_the_registry_the_plugin_reads_and_locks(): void
    {
        require_once dirname(__DIR__, 2) . '/functions.php';
        Functions\stubEscapeFunctions();
        WordPressCore::stubKses();

        $container = Plugin::instance()->container();

        Actions\expectDone('elio_blocks_init')->once()->whenHappen(
            static function (): void {
                elio_blocks_register_condition_icon_collection('third-party', ['label' => 'Third party']);
                elio_blocks_register_condition_icon('third-party/sun', ['content' => '<svg></svg>', 'conditions' => [['clear-sky', 'all']]]);
            }
        );

        $container->get(RegisterWeatherForecastProviders::class)->firePublicAction();
        $container->get(RegisterConditionIcons::class)->lockRegistry();

        $registry = $container->get(ConditionIconsRegistry::class);
        $this->assertSame('Third party', $registry->getRegisteredCollection('third-party')['label'] ?? null);
        $this->assertTrue($registry->isIconRegistered('third-party/sun'));
        $this->assertTrue($registry->isBuilt());

        Functions\expect('_doing_it_wrong')->once();
        $this->assertFalse(elio_blocks_register_condition_icon_collection('too-late', ['label' => 'Too late']));
    }

    #[RunInSeparateProcess]
    #[PreserveGlobalState(false)]
    public function test_blocks_inside_a_report_read_the_weather_forecast_it_preloaded(): void
    {
        require_once dirname(__DIR__, 2) . '/functions.php';

        // What PreloadWeatherForecast does before the inner blocks of a report
        // render.
        Plugin::instance()->container()->get(ReportContext::class)->setWeatherForecast(self::WEATHER_FORECAST);

        $this->assertSame(self::WEATHER_FORECAST['current'], elio_blocks_get_current_conditions());
        $this->assertSame([self::WEATHER_FORECAST['daily'][0]], elio_blocks_get_forecast_items('daily', 1));
        $this->assertSame(self::WEATHER_FORECAST['icons']['elio/sun'], elio_blocks_get_condition_icon('elio/sun'));
        $this->assertNull(elio_blocks_get_condition_icon('elio/tornado'));
    }

    #[RunInSeparateProcess]
    #[PreserveGlobalState(false)]
    public function test_outside_a_report_there_is_no_weather_forecast_to_read(): void
    {
        require_once dirname(__DIR__, 2) . '/functions.php';

        $this->assertNull(elio_blocks_get_current_conditions());
        $this->assertSame([], elio_blocks_get_forecast_items('daily', 7));
        $this->assertNull(elio_blocks_get_condition_icon('sun'));
    }

    #[RunInSeparateProcess]
    #[PreserveGlobalState(false)]
    public function test_the_report_block_prints_once_the_icons_its_blocks_added_to_the_sprite(): void
    {
        // The sprite reads icons with the HTML API of WordPress core.
        if (! WordPressCore::isLoaded()) {
            $this->markTestSkipped('WP_HTML_Tag_Processor needs WordPress core next to the plugin.');
        }

        require_once dirname(__DIR__, 2) . '/functions.php';
        WordPressCore::stubDependencies();

        // What the condition-icon blocks of a report do, then the report itself.
        elio_blocks_add_icon_to_sprite('sun', '<svg viewBox="0 0 24 24"><path d="M1 1"></path></svg>');
        elio_blocks_add_icon_to_sprite('sun', '<svg viewBox="0 0 24 24"><path d="M1 1"></path></svg>');
        $sprite = elio_blocks_render_icon_sprite();

        $this->assertSame(1, substr_count($sprite, '<symbol id="elio-condition-icon-sun">'));
        $this->assertSame('', elio_blocks_render_icon_sprite(), 'A second report prints no icon the page has already.');
    }

    #[RunInSeparateProcess]
    #[PreserveGlobalState(false)]
    public function test_the_report_block_gets_the_state_of_its_store(): void
    {
        require_once dirname(__DIR__, 2) . '/functions.php';
        $this->stubSettings();

        $state = elio_blocks_get_weather_report_interactivity_state();

        $this->assertSame('https://example.test/wp-json/elio/v1/weather-forecast', $state['weatherForecastUrl']);
        $this->assertArrayHasKey('refreshInterval', $state);
    }

    #[RunInSeparateProcess]
    #[PreserveGlobalState(false)]
    public function test_the_report_block_gets_its_interactivity_context(): void
    {
        require_once dirname(__DIR__, 2) . '/functions.php';
        $this->stubSettings();

        $context = elio_blocks_get_weather_report_interactivity_context(new WP_Block(['location' => ['name' => 'Nowhere']]));

        $this->assertSame(['name' => 'Nowhere'], $context['location']);
        $this->assertSame('', $context['signature'], 'No coordinates, nothing to sign.');
        $this->assertNull($context['query']['data']);
    }

    #[RunInSeparateProcess]
    #[PreserveGlobalState(false)]
    public function test_a_block_shows_its_collection_else_its_report_one_else_the_site_one(): void
    {
        require_once dirname(__DIR__, 2) . '/functions.php';
        Functions\stubEscapeFunctions();
        Functions\when('get_option')->alias(static fn(string $name, mixed $default = false): mixed => $default);
        $registry = Plugin::instance()->container()->get(ConditionIconsRegistry::class);
        $registry->registerCollection('elio', ['label' => 'Elio']);
        $registry->registerCollection('theme', ['label' => 'Theme']);

        $this->assertSame('theme', elio_blocks_get_condition_icon_collection(null, 'theme'));
        $this->assertSame('elio', elio_blocks_get_condition_icon_collection('uninstalled', null));
    }

    #[RunInSeparateProcess]
    #[PreserveGlobalState(false)]
    public function test_a_report_credits_its_provider_else_the_site_default_one_as_its_license_asks(): void
    {
        require_once dirname(__DIR__, 2) . '/functions.php';
        Functions\stubTranslationFunctions();
        Functions\when('get_option')->alias(static fn(string $name, mixed $default = false): mixed => $default);

        $container = Plugin::instance()->container();
        // What the plugin does on 'init', priorities 15 and 20.
        $container->get(RegisterProviders::class)->registerBuiltInProviders();
        $container->get(RegisterWeatherForecastProviders::class)->registerBuiltInProviders();
        $container->get(ProviderRegistry::class)->register('silent', ['label' => 'Silent']);
        $container->get(WeatherForecastProviderRegistry::class)->register('silent', new StubWeatherForecastProvider());

        $openMeteo = [
            'text'        => 'Weather data by Open-Meteo.com',
            'url'         => 'https://open-meteo.com/',
            'license'     => 'CC BY 4.0',
            'license_url' => 'https://creativecommons.org/licenses/by/4.0/',
        ];
        $this->assertSame($openMeteo, elio_blocks_get_weather_forecast_attribution('open-meteo'));
        $this->assertSame($openMeteo, elio_blocks_get_weather_forecast_attribution(''), 'Open-Meteo is the default provider.');
        $this->assertNull(elio_blocks_get_weather_forecast_attribution('silent'), 'It asks for no credit.');
        $this->assertNull(elio_blocks_get_weather_forecast_attribution('uninstalled'));
    }

    /** Leaves the settings at their defaults. */
    private function stubSettings(): void
    {
        Functions\when('get_option')->alias(static fn(string $name, mixed $default = false): mixed => $default);
        Functions\when('rest_url')->alias(static fn(string $path = ''): string => 'https://example.test/wp-json/' . $path);
    }
}
