<?php

namespace ElioBlocks\Weather\Condition;

// Exit if called directly.
if (! defined('ABSPATH')) {
    die;
}

/**
 * Provides condition descriptions settings (key, label) for weather conditions.
 */
final class ConditionDescriptions
{
    /**
     * Returns condition descriptions (slug, label).
     *
     * @return array<string, string>
     */
    public static function getDescriptions(): array
    {
        $descriptions = array(
            'clear-sky'                     => __('Clear sky', 'elio-blocks'),
            'mainly-clear'                  => __('Mainly clear', 'elio-blocks'),
            'partly-cloudy'                 => __('Partly cloudy', 'elio-blocks'),
            'overcast'                      => __('Overcast', 'elio-blocks'),
            'fog'                           => __('Fog', 'elio-blocks'),
            'depositing-rime-fog'           => __('Depositing rime fog', 'elio-blocks'),
            'light-drizzle'                 => __('Light drizzle', 'elio-blocks'),
            'moderate-drizzle'              => __('Moderate drizzle', 'elio-blocks'),
            'dense-drizzle'                 => __('Dense drizzle', 'elio-blocks'),
            'light-freezing-drizzle'        => __('Light freezing drizzle', 'elio-blocks'),
            'dense-freezing-drizzle'        => __('Dense freezing drizzle', 'elio-blocks'),
            'slight-rain'                   => __('Slight rain', 'elio-blocks'),
            'moderate-rain'                 => __('Moderate rain', 'elio-blocks'),
            'heavy-rain'                    => __('Heavy rain', 'elio-blocks'),
            'light-freezing-rain'           => __('Light freezing rain', 'elio-blocks'),
            'heavy-freezing-rain'           => __('Heavy freezing rain', 'elio-blocks'),
            'slight-snowfall'               => __('Slight snowfall', 'elio-blocks'),
            'moderate-snowfall'             => __('Moderate snowfall', 'elio-blocks'),
            'heavy-snowfall'                => __('Heavy snowfall', 'elio-blocks'),
            'snow-grains'                   => __('Snow grains', 'elio-blocks'),
            'slight-rain-showers'           => __('Slight rain showers', 'elio-blocks'),
            'moderate-rain-showers'         => __('Moderate rain showers', 'elio-blocks'),
            'violent-rain-showers'          => __('Violent rain showers', 'elio-blocks'),
            'slight-snow-showers'           => __('Slight snow showers', 'elio-blocks'),
            'heavy-snow-showers'            => __('Heavy snow showers', 'elio-blocks'),
            'thunderstorm'                  => __('Thunderstorm', 'elio-blocks'),
            'thunderstorm-with-slight-hail' => __('Thunderstorm with slight hail', 'elio-blocks'),
            'thunderstorm-with-heavy-hail'  => __('Thunderstorm with heavy hail', 'elio-blocks'),
        );

        return (array) apply_filters('elio_blocks/condition_descriptions', $descriptions);
    }
}
