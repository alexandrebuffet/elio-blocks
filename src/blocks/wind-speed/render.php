<?php
/**
 * Wind Speed block server-side render.
 *
 * @var array    $attributes Block attributes.
 * @var string   $content    Inner block content.
 * @var WP_Block $block      Block instance.
 */

// Exit if called directly.
if (! defined('ABSPATH')) {
    die;
}

$display_type = isset($attributes['displayType']) && $attributes['displayType'] === 'gusts' ? 'gusts' : '';

$show_prefix = isset($attributes['showPrefix']) ? (bool) $attributes['showPrefix'] : false;
$prefix      = isset($attributes['prefix']) ? sanitize_text_field($attributes['prefix']) : '';

$context = array(
    'displayType' => $display_type,
);

$extra_wrapper_attributes = array(
    'class'           => 'elio-tabular-nums',
    'data-wp-context' => wp_json_encode($context),
);
?>
<p <?php echo wp_kses_data(get_block_wrapper_attributes($extra_wrapper_attributes)); ?>>
    <?php if ($show_prefix && $prefix !== '') : ?>
    <span class="wp-block-elio-wind-speed__prefix"><?php echo esc_html($prefix); ?></span>
    <?php endif; ?>
    <span class="wp-block-elio-wind-speed__value" data-wp-text="state.windSpeed"></span><span class="wp-block-elio-wind-speed__unit" data-wp-text="state.windSpeedUnit"></span>
</p>
