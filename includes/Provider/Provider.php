<?php

declare(strict_types=1);

namespace ElioBlocks\Provider;

// Exit if called directly.
if (! defined('ABSPATH')) {
    die;
}

/**
 * An organization Elio gets data from (Open-Meteo, OpenWeatherMap): what every
 * domain it serves shares, its name, the credentials it identifies the site
 * with and the credit its data is shown with.
 *
 * Registered with elio_blocks_register_provider(); what it serves is registered
 * apart, per domain (elio_blocks_register_weather_forecast_provider()).
 */
final class Provider
{
    /**
     * Constructor.
     *
     * @param string                            $slug        Unique identifier (e.g. 'open-meteo'): lowercase letters, digits, hyphens.
     * @param string                            $label       Name shown to people (e.g. 'Open-Meteo').
     * @param array<string, ProviderCredential> $credentials What the settings page asks for it, by name, in the order declared.
     * @param ProviderAttribution|null          $attribution Credit its license asks for wherever its data is shown. Null for none.
     */
    public function __construct(
        public readonly string $slug,
        public readonly string $label,
        public readonly array $credentials = array(),
        public readonly ?ProviderAttribution $attribution = null,
    ) {
    }
}
