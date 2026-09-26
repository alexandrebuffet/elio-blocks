<?php

namespace ElioBlocks\WeatherForecast\Exception;

// Exit if called directly.
if (! defined('ABSPATH')) {
    die;
}

/**
 * The provider answered, but not with a weather forecast: the body cannot be
 * read. Retrying will not help until the provider (or its adapter) is fixed.
 */
final class InvalidProviderResponse extends WeatherForecastException
{
}
