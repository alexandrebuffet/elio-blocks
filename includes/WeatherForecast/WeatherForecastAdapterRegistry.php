<?php

namespace ElioBlocks\WeatherForecast;

use ElioBlocks\Provider\Provider;
use ElioBlocks\Provider\ProviderRegistry;

if (! defined('ABSPATH')) {
    die;
}

/**
 * Registry of the weather forecast adapters: how the registered providers
 * serve the weather forecast, one each at most, indexed by provider slug.
 *
 * The registry is locked after build() is called — no further registrations
 * are accepted, as for the ConditionIconsRegistry.
 */
final class WeatherForecastAdapterRegistry
{
    /**
     * Weather forecast adapters, indexed by provider slug.
     *
     * @var array<string, WeatherForecastAdapterInterface>
     */
    private array $adapters = array();

    /**
     * Whether the registry has been locked.
     *
     * @var bool
     */
    private bool $built = false;

    /**
     * Constructor.
     *
     * @param ProviderRegistry $providers The providers a weather forecast adapter belongs to.
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
     * @param string                          $provider Slug of a registered provider.
     * @param WeatherForecastAdapterInterface $adapter  Fetches its weather forecast.
     * @return bool True if the weather forecast adapter was registered, false otherwise.
     */
    public function register(string $provider, WeatherForecastAdapterInterface $adapter): bool
    {
        if ($this->built) {
            _doing_it_wrong(
                __METHOD__,
                esc_html(
                    sprintf(
                        'Cannot register the weather forecast adapter of "%s": the registry is already built.',
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

        if (isset($this->adapters[ $provider ])) {
            _doing_it_wrong(
                __METHOD__,
                esc_html(sprintf('Provider "%s" already has a weather forecast adapter.', $provider)),
                '0.1.0'
            );

            return false;
        }

        $this->adapters[ $provider ] = $adapter;

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
                fn(Provider $provider): bool => isset($this->adapters[ $provider->slug ])
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
        return isset($this->adapters[ $slug ]) ? $this->providers->getBySlug($slug) : null;
    }

    /**
     * Returns the weather forecast adapter of the given provider, or null if it has none.
     *
     * @param string $slug Provider slug.
     * @return WeatherForecastAdapterInterface|null
     */
    public function getBySlug(string $slug): ?WeatherForecastAdapterInterface
    {
        return $this->adapters[ $slug ] ?? null;
    }
}
