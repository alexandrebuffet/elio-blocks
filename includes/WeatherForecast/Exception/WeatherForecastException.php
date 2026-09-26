<?php

namespace ElioBlocks\WeatherForecast\Exception;

// Exit if called directly.
if (! defined('ABSPATH')) {
    die;
}

/**
 * Any failure to get a weather forecast. Catch this one to handle them all.
 *
 * Extends RuntimeException, which is what the plugin threw before these
 * exceptions existed: integrations catching it keep working.
 */
class WeatherForecastException extends \RuntimeException
{
}
