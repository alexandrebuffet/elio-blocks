<?php

namespace ElioBlocks\WeatherForecast;

use ElioBlocks\Provider\Provider;
use ElioBlocks\Provider\ProviderRegistry;

if (! defined('ABSPATH')) {
    die;
}

/**
 * Registry of the weather forecast providers: how the registered providers
 * serve the weather forecast, one each at most, indexed by provider slug.
 *
 * The registry is locked after build() is called — no further registrations
 * are accepted, as for the ConditionIconsRegistry.
 */
final class WeatherForecastProviderRegistry
{
    /**
     * Weather forecast providers, indexed by provider slug.
     *
     * @var array<string, WeatherForecastProviderInterface>
     */
    private array $weatherForecastProviders = array();

    /**
     * Whether the registry has been locked.
     *
     * @var bool
     */
    private bool $built = false;

    /**
     * Constructor.
     *
     * @param ProviderRegistry $providers The providers a weather forecast provider belongs to.
     */
    public function __construct(
        private ProviderRegistry $providers,
    ) {
    }

    /**
     * Registers how a provider serves the weather forecast.
     *
     * As the core registries do (WP_Block_Type_Registry), an invalid
     * registration is refused with a _doing_it_wrong() notice, never an
     * exception: a third-party plugin getting it wrong must not take the
     * site down during init.
     *
     * @param string                           $provider                Slug of a registered provider.
     * @param WeatherForecastProviderInterface $weatherForecastProvider Fetches its weather forecast.
     * @return bool True if the weather forecast provider was registered, false otherwise.
     */
    public function register(string $provider, WeatherForecastProviderInterface $weatherForecastProvider): bool
    {
        if ($this->built) {
            _doing_it_wrong(
                __METHOD__,
                esc_html(
                    sprintf(
                        'Cannot register the weather forecast provider of "%s": the registry is already built.',
                        $provider
                    )
                ),
                '0.1.0'
            );

            return false;
        }

        if (null === $this->providers->getBySlug($provider)) {
            _doing_it_wrong(
                __METHOD__,
                esc_html(
                    sprintf(
                        'No provider registered with slug "%s": register it with elio_blocks_register_provider() first.',
                        $provider
                    )
                ),
                '0.1.0'
            );

            return false;
        }

        if (isset($this->weatherForecastProviders[ $provider ])) {
            _doing_it_wrong(
                __METHOD__,
                esc_html(sprintf('Provider "%s" already has a weather forecast provider.', $provider)),
                '0.1.0'
            );

            return false;
        }

        $this->weatherForecastProviders[ $provider ] = $weatherForecastProvider;

        return true;
    }

    /**
     * Locks the registry. No further registrations are allowed after this.
     */
    public function build(): void
    {
        $this->built = true;
    }

    /**
     * Determines whether the registry has been locked.
     *
     * @return bool
     */
    public function isBuilt(): bool
    {
        return $this->built;
    }

    /**
     * Returns the providers that serve the weather forecast, in registration order.
     *
     * @return list<Provider>
     */
    public function getProviders(): array
    {
        return array_values(
            array_filter(
                $this->providers->getAll(),
                fn(Provider $provider): bool => isset($this->weatherForecastProviders[ $provider->slug ])
            )
        );
    }

    /**
     * Returns the provider with the given slug when it serves the weather
     * forecast, or null otherwise.
     *
     * @param string $slug Provider slug.
     * @return Provider|null
     */
    public function getProvider(string $slug): ?Provider
    {
        return isset($this->weatherForecastProviders[ $slug ]) ? $this->providers->getBySlug($slug) : null;
    }

    /**
     * Returns the weather forecast provider of the given provider, or null if it has none.
     *
     * @param string $slug Provider slug.
     * @return WeatherForecastProviderInterface|null
     */
    public function getBySlug(string $slug): ?WeatherForecastProviderInterface
    {
        return $this->weatherForecastProviders[ $slug ] ?? null;
    }
}
