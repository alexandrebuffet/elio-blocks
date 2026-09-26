<?php
/**
 * Daily Temperature block server-side render.
 *
 * @var array    $attributes Block attributes.
 * @var string   $content    Inner block content.
 * @var WP_Block $block      Block instance.
 */

if (! defined('ABSPATH')) {
    die;
}

$allowed_display_types = ['min', 'max', 'feels-like-min', 'feels-like-max'];

$display_type = isset($attributes['displayType']) && in_array($attributes['displayType'], $allowed_display_types, true)
    ? $attributes['displayType']
    : 'min';

$show_unit = isset($attributes['showUnit']) ? (bool) $attributes['showUnit'] : true;

$allowed_unit_formats = ['full', 'degree-symbol'];
$unit_format = isset($attributes['unitFormat']) && in_array($attributes['unitFormat'], $allowed_unit_formats, true)
    ? $attributes['unitFormat']
    : '';

$show_prefix = isset($attributes['showPrefix']) ? (bool) $attributes['showPrefix'] : false;
$prefix      = isset($attributes['prefix']) ? sanitize_text_field($attributes['prefix']) : '';

$context = [
    'displayType' => $display_type,
    'showUnit'    => $show_unit,
    'unitFormat'  => $unit_format,
];

$extra_wrapper_attributes = [
    'class'           => 'elio-tabular-nums',
    'data-wp-context' => wp_json_encode($context),
];
?>
<p <?php echo wp_kses_data(get_block_wrapper_attributes($extra_wrapper_attributes)); ?>>
    <?php if ($show_prefix && $prefix !== '') : ?>
    <span class="wp-block-elio-daily-temperature__prefix"><?php echo esc_html($prefix); ?></span>
    <?php endif; ?>
    <span class="wp-block-elio-daily-temperature__value" data-wp-text="state.dailyTemperature"></span><span class="wp-block-elio-daily-temperature__unit" data-wp-text="state.dailyTemperatureUnit"></span>
</p>
