<?php
/**
 * Last Updated block server-side render.
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

$format = isset($attributes['format']) ? $attributes['format'] : '';

$show_prefix = isset($attributes['showPrefix']) ? (bool) $attributes['showPrefix'] : true;
// Without a prefix of its own, the block says what the time is. An emptied prefix stays empty.
$prefix = isset($attributes['prefix'])
    ? sanitize_text_field($attributes['prefix'])
    : _x('Updated', 'prefix of the time the weather data was last updated', 'elio-blocks');

$context = array(
    'format' => $format,
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
    <span class="wp-block-elio-last-updated__prefix"><?php echo esc_html($prefix); ?></span>
    <?php endif; ?>
    <time class="wp-block-elio-last-updated__value" data-wp-bind--datetime="state.lastUpdatedDatetime" data-wp-text="state.formattedLastUpdated"></time>
</p>
