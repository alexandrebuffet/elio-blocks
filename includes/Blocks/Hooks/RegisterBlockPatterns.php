<?php

namespace ElioBlocks\Blocks\Hooks;

use ElioBlocks\Contracts\HookInterface;

// Exit if called directly.
if (! defined('ABSPATH')) {
    die;
}

/**
 * Registers the patterns of the Weather Report, offered by its "Choose" and
 * "Change design" buttons and in the Patterns tab of the inserter.
 *
 * A pattern is named after the weather words of a bulletin, its family, then
 * its layout: "Observation · Compact", "Daily forecast · List". A new one
 * takes a family and a layout, a new family when none fits (tides, warnings).
 * Its slug never changes once released: WordPress saves it in the content it
 * inserts (`metadata.patternName`). A redesign is a new slug, the old one
 * kept with `'inserter' => false`.
 */
class RegisterBlockPatterns implements HookInterface
{
    public const CATEGORY = 'elio-weather';

    /**
     * @param string $pluginPath Plugin directory, with a trailing slash.
     */
    public function __construct(private string $pluginPath)
    {
    }

    public function initHooks(): void
    {
        add_action('init', array( $this, 'registerBlockPatterns' ));
    }

    public function registerBlockPatterns(): void
    {
        register_block_pattern_category(
            self::CATEGORY,
            array(
                'label'       => __('Weather', 'elio-blocks'),
                'description' => __('Layouts of the Weather block.', 'elio-blocks'),
            )
        );

        foreach ($this->getPatterns() as $slug => $pattern) {
            register_block_pattern(
                'elio/' . $slug,
                array_merge(
                    $pattern,
                    array(
                        'categories' => array( self::CATEGORY ),
                        'blockTypes' => array( 'elio/weather-report' ),
                        'filePath'   => $this->pluginPath . 'patterns/' . $slug . '.php',
                    )
                )
            );
        }
    }

    /**
     * Title and description of each pattern, by slug (the file in patterns/).
     *
     * @return array<string, array{title: string, description: string}>
     */
    public function getPatterns(): array
    {
        return array(
            'observation-compact'   => array(
                'title'       => __('Observation · Compact', 'elio-blocks'),
                'description' => __('The current conditions in a column: location and date, temperature, feels-like temperature, wind, humidity and precipitation.', 'elio-blocks'),
            ),
            'observation-hero'      => array(
                'title'       => __('Observation · Hero', 'elio-blocks'),
                'description' => __('The current temperature very large, the details stacked beside it. Full width, for the top of a page.', 'elio-blocks'),
            ),
            'bulletin-compact'      => array(
                'title'       => __('Bulletin · Compact', 'elio-blocks'),
                'description' => __('The current conditions on one line, then the next five days in columns.', 'elio-blocks'),
            ),
            'daily-forecast-list'   => array(
                'title'       => __('Daily forecast · List', 'elio-blocks'),
                'description' => __('The next seven days in rows: day, condition, chance of rain, lowest and highest temperatures.', 'elio-blocks'),
            ),
            'hourly-forecast-strip' => array(
                'title'       => __('Hourly forecast · Strip', 'elio-blocks'),
                'description' => __('The current conditions on one line, then the next twelve hours side by side.', 'elio-blocks'),
            ),
            'almanac-sun'           => array(
                'title'       => __('Almanac · Sun', 'elio-blocks'),
                'description' => __('The day and the sun, centered: date, sunrise, sunset and UV index.', 'elio-blocks'),
            ),
        );
    }
}
