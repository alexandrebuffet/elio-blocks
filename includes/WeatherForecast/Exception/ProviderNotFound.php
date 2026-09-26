<?php

namespace ElioBlocks\WeatherForecast\Exception;

// Exit if called directly.
if (! defined('ABSPATH')) {
    die;
}

/**
 * No weather forecast provider is registered under the requested slug: a block
 * saved with a provider whose plugin has since been deactivated, or a typo in a
 * request.
 *
 * The caller asked for something that does not exist (HTTP 404), as opposed to
 * an upstream failure (HTTP 502).
 */
final class ProviderNotFound extends WeatherForecastException
{
    public static function forSlug(string $slug): self
    {
        return new self(sprintf('No weather forecast provider registered with slug "%s".', $slug));
    }
}
