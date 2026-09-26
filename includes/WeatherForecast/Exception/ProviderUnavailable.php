<?php

namespace ElioBlocks\WeatherForecast\Exception;

// Exit if called directly.
if (! defined('ABSPATH')) {
    die;
}

/**
 * The provider could not be reached or refused the request: network failure,
 * timeout, HTTP error, rate limit. Worth retrying later.
 */
final class ProviderUnavailable extends WeatherForecastException
{
}
