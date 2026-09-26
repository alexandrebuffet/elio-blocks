<?php
/**
 * Forecast Template block server-side render.
 *
 * Repeats inner blocks for each forecast item (daily or hourly). Type and count
 * come from parent elio/forecast via block context.
 *
 * The rows come from the forecast the report block preloaded: with a non-empty
 * list in context, WordPress renders the data-wp-each template server-side, so
 * the list is in the HTML before any script runs.
 *
 * @see https://github.com/WordPress/gutenberg/blob/trunk/docs/reference-guides/block-api/block-metadata.md#render
 *
 * @var array    $attributes Block attributes.
 * @var string   $content    Inner block content.
 * @var WP_Block $block      Block instance.
 */

// Exit if called directly.
if (! defined('ABSPATH')) {
    die;
}

$forecast_type  = isset($block->context['elio/forecastType']) ? $block->context['elio/forecastType'] : 'daily';
$forecast_count = isset($block->context['elio/forecastCount']) ? absint($block->context['elio/forecastCount']) : 7;

$wrapper_attributes = get_block_wrapper_attributes(
    array(
        'data-wp-context' => wp_json_encode(
            array(
                'forecastType'  => $forecast_type,
                'forecastCount' => $forecast_count,
                'forecastItems' => elio_blocks_get_forecast_items($forecast_type, $forecast_count),
            )
        ),
        'data-wp-watch'   => 'callbacks.syncForecastItems',
    )
);
?>

<ol <?php echo wp_kses_data($wrapper_attributes); ?>>
    <template data-wp-each--item="context.forecastItems">
        <li class="wp-block-elio-forecast-template__item">
            <?php echo $content; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
        </li>
    </template>
</ol>
