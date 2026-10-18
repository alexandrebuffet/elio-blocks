<?php

declare(strict_types=1);

namespace ElioBlocks\Provider;

// Exit if called directly.
if (! defined('ABSPATH')) {
    die;
}

/**
 * An organization Elio gets data from (Open-Meteo, OpenWeatherMap): its name,
 * the credentials it identifies the site with, the credit its data is shown
 * with, and what it serves, one adapter per domain.
 *
 * Registered with elio_blocks_register_provider(), as is or through a class of
 * its own that passes all of it to this constructor (OpenMeteo).
 *
 * @since 0.4.0
 */
class Provider
{
    /**
     * What the settings page asks for it, by name, in the order declared.
     *
     * @var array<string, ProviderCredential>
     */
    public readonly array $credentials;

    /**
     * Constructor.
     *
     * @param string                   $slug        Unique identifier (e.g. 'open-meteo'): lowercase letters, digits, hyphens.
     * @param string                   $label       Name shown to people (e.g. 'Open-Meteo').
     * @param list<ProviderCredential> $credentials What identifies the site to it, in the order the settings page asks for them.
     * @param ProviderAttribution|null $attribution Credit its license asks for wherever its data is shown. Null for none.
     * @param list<object>             $adapters    What it serves, one adapter per domain: a WeatherForecastAdapterInterface
     *                                              for the weather forecast. Of two for one domain, the first is asked.
     */
    public function __construct(
        public readonly string $slug,
        public readonly string $label,
        array $credentials = array(),
        public readonly ?ProviderAttribution $attribution = null,
        public readonly array $adapters = array(),
    ) {
        $byName = array();
        foreach ($credentials as $key => $credential) {
            // Anything else is kept as given, for the registry to refuse.
            $byName[ $credential instanceof ProviderCredential ? $credential->name : (string) $key ] = $credential;
        }
        $this->credentials = $byName;
    }

    /**
     * Returns its adapter for a domain, or null when it does not serve it.
     *
     * @template T of object
     * @param class-string<T> $interface Interface of the adapters of the domain (WeatherForecastAdapterInterface).
     * @return T|null
     */
    final public function getAdapter(string $interface): ?object
    {
        foreach ($this->adapters as $adapter) {
            if ($adapter instanceof $interface) {
                return $adapter;
            }
        }

        return null;
    }
}
