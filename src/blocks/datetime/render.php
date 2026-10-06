<?php
/**
 * Datetime block server-side render.
 *
 * @var array    $attributes Block attributes.
 * @var string   $content    Inner block content.
 * @var WP_Block $block      Block instance.
 */

// phpcs:disable WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedVariableFound -- render.php runs inside a function (register_block_type_from_metadata): its variables are local.

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
// The "Now" and "Today" labels move to the next row as the hour or the day in progress ends.
if ('human-diff' === $format) {
    $extra_wrapper_attributes['data-wp-watch'] = 'callbacks.startRelativeDateClock';
} elseif ($current_as_label) {
    $extra_wrapper_attributes['data-wp-watch'] = 'callbacks.startQuarterHourClock';
}
?>
<p <?php echo wp_kses_data(get_block_wrapper_attributes($extra_wrapper_attributes)); ?>>
    <?php if ($show_prefix && $prefix !== '') : ?>
    <span class="wp-block-elio-datetime__prefix"><?php echo esc_html($prefix); ?></span>
    <?php endif; ?>
    <time class="wp-block-elio-datetime__value" data-wp-bind--datetime="state.datetime" data-wp-text="state.formattedDateTime"></time>
</p>
