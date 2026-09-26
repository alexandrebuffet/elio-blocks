<?php

namespace ElioBlocks\WeatherForecast;

use ElioBlocks\Contracts\Cache\CacheInterface;
use ElioBlocks\Settings\PluginSettings;
use ElioBlocks\Weather\Coordinates;
use ElioBlocks\WeatherForecast\Exception\WeatherForecastException;
use ElioBlocks\WeatherForecast\Exception\InvalidProviderResponse;
use ElioBlocks\WeatherForecast\Exception\ProviderNotConfigured;
use ElioBlocks\WeatherForecast\Exception\ProviderNotFound;

// Exit if called directly.
if (! defined('ABSPATH')) {
    die;
}

/**
 * Gets the weather forecast of a location from a provider, through the cache.
 *
 * What is cached is the weather forecast of the provider, shared by every
 * visitor. What depends on the site or the request (icons, unit overrides,
 * language) is added on the way out by WeatherForecastPresenter.
 */
class WeatherForecastService
{
    /**
     * First segment of the cache key. Bump the version whenever the normalized
     * format changes, so entries cached by a previous release are not served.
     * v2: timestamps carry the UTC offset of the location.
     * v3: condition descriptions are no longer cached (they are translated).
     * v4: meta.fetched_at tells when the provider was asked.
     */
    private const CACHE_NAMESPACE = 'weather_forecast_v4';

    /**
     * Weather forecasts already loaded during this request, by cache key.
     *
     * A report block asks for its weather forecast more than once per render;
     * this keeps it to one upstream call even when the persistent cache is
     * disabled.
     *
     * @var array<string, WeatherForecast>
     */
    private array $loaded = array();

    /**
     * @var \Closure(): int
     */
    private \Closure $clock;

    /**
     * Constructor.
     *
     * @param WeatherForecastProviderRegistry $registry  Weather forecast providers, by provider slug.
     * @param CacheInterface                  $cache     Cache instance.
     * @param WeatherForecastPresenter        $presenter Adds what depends on the site and the request.
     * @param PluginSettings                  $settings  Holds the credentials of the providers.
     * @param (callable(): int)|null          $clock     Returns the current Unix timestamp. Defaults to time().
     */
    public function __construct(
        private WeatherForecastProviderRegistry $registry,
        private CacheInterface $cache,
        private WeatherForecastPresenter $presenter,
        private PluginSettings $settings,
        ?callable $clock = null,
    ) {
        $this->clock = null !== $clock ? $clock(...) : time(...);
    }

    /**
     * Gets the weather forecast of a location, ready for the REST API and the
     * blocks.
     *
     * @param Coordinates           $coordinates     Validated, rounded location.
     * @param string                $provider        Provider slug.
     * @param string                $units           Unit preset ('metric' or 'imperial').
     * @param array<string, string> $unitSettings    Per-domain unit overrides: temperature, wind, precipitation, pressure, distance (optional).
     * @param list<string>          $iconCollections Collections whose icons the items name (optional).
     * @return array<string, mixed>
     *
     * @throws ProviderNotFound  If no provider serves the weather forecast under that slug.
     * @throws ProviderNotConfigured If a credential the provider needs is not set.
     * @throws WeatherForecastException If the provider fails to deliver a weather forecast.
     */
    public function getWeatherForecast(Coordinates $coordinates, string $provider, string $units, array $unitSettings = array(), array $iconCollections = array()): array
    {
        $weatherForecastProvider = $this->registry->getBySlug($provider);
        if (null === $weatherForecastProvider) {
            throw ProviderNotFound::forSlug(esc_html($provider));
        }

        // Unit overrides and icon collections are not part of the key: they do not change what the provider answers.
        $cacheKey = $this->cache->key(self::CACHE_NAMESPACE, $coordinates->latitude, $coordinates->longitude, $provider, $units);

        $this->loaded[ $cacheKey ] ??= $this->fromCache($cacheKey)
            ?? $this->fromProvider($provider, $weatherForecastProvider, $coordinates, $units, $cacheKey);

        return $this->presenter->present($this->loaded[ $cacheKey ], $units, $unitSettings, $iconCollections);
    }

    /**
     * Returns the cached weather forecast, or null when there is none or when
     * the entry is unusable.
     */
    private function fromCache(string $cacheKey): ?WeatherForecast
    {
        $cached = $this->cache->get($cacheKey);

        if (! is_array($cached)) {
            return null;
        }

        try {
            return WeatherForecast::fromArray($cached);
        } catch (InvalidProviderResponse $e) {
            // Entry written by something else, or corrupted: fetch again.
            return null;
        }
    }

    /**
     * Asks the provider, with its credentials, and caches its answer only once
     * it is known to be a weather forecast.
     *
     * @throws ProviderNotConfigured    If a credential it needs is not set: it is not asked.
     * @throws WeatherForecastException If the provider fails to deliver a weather forecast.
     */
    private function fromProvider(
        string $provider,
        WeatherForecastProviderInterface $weatherForecastProvider,
        Coordinates $coordinates,
        string $units,
        string $cacheKey
    ): WeatherForecast {
        $args = array( 'credentials' => $this->getCredentials($provider) );

        $weatherForecast = WeatherForecast::fromArray($weatherForecastProvider->fetch($coordinates->latitude, $coordinates->longitude, $units, $args))
            ->withFetchedAt(( $this->clock )());

        $this->cache->set($cacheKey, $weatherForecast->toArray(), CacheInterface::TTL_FROM_SETTINGS);

        return $weatherForecast;
    }

    /**
     * Returns the credentials of a provider that are set, by name.
     *
     * @return array<string, string>
     *
     * @throws ProviderNotConfigured If a credential it needs is not set.
     */
    private function getCredentials(string $slug): array
    {
        $provider = $this->registry->getProvider($slug);
        if (null === $provider) {
            return array();
        }

        $credentials = $this->settings->getProviderCredentials($provider);

        $missing = array();
        foreach ($provider->credentials as $name => $credential) {
            if ($credential->required && ! isset($credentials[ $name ])) {
                $missing[] = $name;
            }
        }

        if (array() !== $missing) {
            throw ProviderNotConfigured::forCredentials(esc_html($slug), array_map('esc_html', $missing));
        }

        return $credentials;
    }
}
