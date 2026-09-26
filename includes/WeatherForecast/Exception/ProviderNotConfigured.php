<?php

namespace ElioBlocks\WeatherForecast\Exception;

// Exit if called directly.
if (! defined('ABSPATH')) {
    die;
}

/**
 * A credential the provider cannot answer without is not set: the provider is
 * not asked. The site has to set it (settings page or wp-config.php), retrying
 * changes nothing (HTTP 503).
 */
final class ProviderNotConfigured extends WeatherForecastException
{
    /**
     * Creates the exception for the required credentials of a provider that are not set.
     *
     * @param string       $slug  Provider slug.
     * @param list<string> $names Names of the required credentials that are not set.
     */
    public static function forCredentials(string $slug, array $names): self
    {
        return new self(
            sprintf('Provider "%s" needs its credentials: %s.', $slug, implode(', ', $names))
        );
    }
}
