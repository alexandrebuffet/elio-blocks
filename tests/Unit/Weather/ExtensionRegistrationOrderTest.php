<?php

namespace ElioBlocks\Tests\Unit\Weather;

use Brain\Monkey;
use Brain\Monkey\Actions;
use Brain\Monkey\Functions;
use ElioBlocks\Contracts\HookInterface;
use ElioBlocks\Provider\Hooks\RegisterProviders;
use ElioBlocks\Provider\Provider;
use ElioBlocks\Provider\ProviderRegistry;
use ElioBlocks\Tests\Stub\StubWeatherForecastAdapter;
use ElioBlocks\Weather\Condition\Icons\ConditionIconsRegistry;
use ElioBlocks\Weather\Condition\Icons\Hooks\RegisterConditionIcons;
use ElioBlocks\WeatherForecast\WeatherForecastAdapterInterface;
use ElioBlocks\WeatherForecast\OpenMeteoWeatherForecastAdapter;
use ElioBlocks\Tests\Support\WordPressCore;
use PHPUnit\Framework\TestCase;
use ReflectionClass;
use ReflectionMethod;

/**
 * Third-party code registers providers, what they serve and icon collections on
 * 'elio_blocks_init'. The registries must still be open at that point, and
 * locked afterwards.
 */
class ExtensionRegistrationOrderTest extends TestCase
{
    private ConditionIconsRegistry $icons;

    private ProviderRegistry $providers;

    protected function setUp(): void
    {
        parent::setUp();
        Monkey\setUp();
        Functions\stubEscapeFunctions();
        WordPressCore::stubKses();

        Functions\when('__')->returnArg();

        $this->icons     = new ConditionIconsRegistry();
        $this->providers = new ProviderRegistry();
    }

    protected function tearDown(): void
    {
        Monkey\tearDown();
        parent::tearDown();
    }

    public function test_icon_collection_registered_on_elio_blocks_init_is_accepted(): void
    {
        $icons = $this->icons;

        Actions\expectDone('elio_blocks_init')->once()->whenHappen(
            static function () use ($icons): void {
                $icons->registerCollection('third-party', array( 'label' => 'Third party' ));
                $icons->registerIcon('third-party/sun', array( 'content' => '<svg></svg>', 'conditions' => array( array( 'clear-sky', 'all' ) ) ));
            }
        );

        $this->runInitCallbacksInPriorityOrder($this->makeHooks());

        $this->assertTrue($icons->isIconRegistered('third-party/sun'));
    }

    public function test_open_meteo_serves_the_weather_forecast_before_third_parties_register(): void
    {
        Actions\expectDone('elio_blocks_init')->once()->whenHappen(
            function (): void {
                $this->assertSame('Open-Meteo', $this->providers->getBySlug('open-meteo')?->label);
                $this->assertInstanceOf(
                    OpenMeteoWeatherForecastAdapter::class,
                    $this->providers->getBySlug('open-meteo')?->getAdapter(WeatherForecastAdapterInterface::class)
                );
            }
        );

        $this->runInitCallbacksInPriorityOrder($this->makeHooks());
    }

    public function test_a_provider_and_its_adapters_registered_on_elio_blocks_init_are_accepted(): void
    {
        $providers              = $this->providers;
        $weatherForecastAdapter = new StubWeatherForecastAdapter();

        Actions\expectDone('elio_blocks_init')->once()->whenHappen(
            static function () use ($providers, $weatherForecastAdapter): void {
                $providers->register(new Provider('third-party', 'Third party', array(), null, array( $weatherForecastAdapter )));
            }
        );

        $this->runInitCallbacksInPriorityOrder($this->makeHooks());

        $this->assertSame(
            $weatherForecastAdapter,
            $providers->getBySlug('third-party')?->getAdapter(WeatherForecastAdapterInterface::class)
        );
    }

    public function test_every_registry_is_locked_once_init_is_over(): void
    {
        $this->runInitCallbacksInPriorityOrder($this->makeHooks());

        $this->assertTrue($this->icons->isBuilt());
        $this->assertTrue($this->providers->isBuilt());
    }

    /**
     * Builds the hooks of the registries, the providers one last: priorities, not
     * the order WordPress receives them in, must put it first.
     *
     * @return list<HookInterface>
     */
    private function makeHooks(): array
    {
        $openMeteo = (new ReflectionClass(OpenMeteoWeatherForecastAdapter::class))->newInstanceWithoutConstructor();

        return array(
            new RegisterConditionIcons($this->icons, sys_get_temp_dir() . '/elio-blocks-no-icons/'),
            new RegisterProviders($this->providers, $openMeteo),
        );
    }

    /**
     * Replays what WordPress does on 'init': every public callback the hooks
     * attached to 'init' runs once, lowest priority first.
     *
     * @param list<HookInterface> $hooks Hook registrars.
     */
    private function runInitCallbacksInPriorityOrder(array $hooks): void
    {
        $queue = array();

        foreach ($hooks as $hook) {
            $hook->initHooks();

            foreach ((new ReflectionClass($hook))->getMethods(ReflectionMethod::IS_PUBLIC) as $method) {
                $priority = has_action('init', array( $hook, $method->getName() ));

                if (false !== $priority) {
                    $queue[] = array( (int) $priority, array( $hook, $method->getName() ) );
                }
            }
        }

        usort($queue, static fn(array $a, array $b): int => $a[0] <=> $b[0]);

        foreach ($queue as [, $callback]) {
            $callback();
        }
    }
}
