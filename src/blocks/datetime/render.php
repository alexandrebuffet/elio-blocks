<?php
/**
 * Datetime block server-side render.
 *
 * @var array    $attributes Block attributes.
 * @var string   $content    Inner block content.
 * @var WP_Block $block      Block instance.
 */

// Exit if called directly.
if (! defined('ABSPATH')) {
    die;
}

use ElioBlocks\Interactivity\Blocks\Report\DateSettings;

// The view script formats dates in the browser with the names and settings wp_date() uses.
wp_interactivity_state('elio/weather-report', array( 'dateSettings' => DateSettings::fromSite() ));

$display_type     = isset($attributes['displayType']) && $attributes['displayType'] === 'time' ? 'time' : 'date';
$format           = isset($attributes['format']) ? $attributes['format'] : '';
$current_as_label = isset($attributes['currentAsLabel']) ? $attributes['currentAsLabel'] : false;

$show_prefix = isset($attributes['showPrefix']) ? (bool) $attributes['showPrefix'] : false;
$prefix      = isset($attributes['prefix']) ? sanitize_text_field($attributes['prefix']) : '';

$context = array(
    'displayType'    => $display_type,
    'format'         => $format,
    'currentAsLabel' => $current_as_label,
    'todayLabel'     => ! empty($attributes['todayLabel']) ? $attributes['todayLabel'] : __('Today', 'elio-blocks'),
    'nowLabel'       => ! empty($attributes['nowLabel']) ? $attributes['nowLabel'] : __('Now', 'elio-blocks'),
);

$extra_wrapper_attributes = array(
    'class'           => 'elio-tabular-nums',
    'data-wp-context' => wp_json_encode($context),
);

// A relative date ("5 minutes ago") is worded in the browser, kept current by the clock of the report.
if ('human-diff' === $format) {
    $extra_wrapper_attributes['data-wp-watch'] = 'callbacks.startRelativeDateClock';
}
?>
<p <?php echo wp_kses_data(get_block_wrapper_attributes($extra_wrapper_attributes)); ?>>
    <?php if ($show_prefix && $prefix !== '') : ?>
    <span class="wp-block-elio-datetime__prefix"><?php echo esc_html($prefix); ?></span>
    <?php endif; ?>
    <time class="wp-block-elio-datetime__value" data-wp-bind--datetime="state.datetime" data-wp-text="state.formattedDateTime"></time>
</p>
