<?php
/**
 * Sun Event block server-side render.
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

$allowed_types = array( 'sunrise', 'sunset' );
$display_type  = isset($attributes['displayType']) && in_array($attributes['displayType'], $allowed_types, true)
    ? $attributes['displayType']
    : 'sunrise';

$format = isset($attributes['format']) ? $attributes['format'] : '';

$show_prefix = isset($attributes['showPrefix']) ? (bool) $attributes['showPrefix'] : false;
$prefix      = isset($attributes['prefix']) ? sanitize_text_field($attributes['prefix']) : '';

$context = array(
    'displayType' => $display_type,
    'format'      => $format,
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
    <span class="wp-block-elio-sun-event__prefix"><?php echo esc_html($prefix); ?></span>
    <?php endif; ?>
    <time class="wp-block-elio-sun-event__value" data-wp-bind--datetime="state.sunEventDatetime" data-wp-text="state.formattedSunEvent"></time>
</p>
