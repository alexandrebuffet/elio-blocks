<?php
/**
 * Temperature block server-side render.
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

$allowed_display_types = array( 'current', 'feels-like' );

$display_type = isset($attributes['displayType']) && in_array($attributes['displayType'], $allowed_display_types, true)
    ? $attributes['displayType']
    : '';

$unit_format = isset($attributes['unitFormat']) && $attributes['unitFormat'] === 'degree-symbol' ? 'degree-symbol' : '';

$show_unit = isset($attributes['showUnit']) ? (bool) $attributes['showUnit'] : true;

$show_prefix = isset($attributes['showPrefix']) ? (bool) $attributes['showPrefix'] : false;
$prefix      = isset($attributes['prefix']) ? sanitize_text_field($attributes['prefix']) : '';

$context = array(
    'displayType' => $display_type,
    'unitFormat'  => $unit_format,
    'showUnit'    => $show_unit,
);

$extra_wrapper_attributes = array(
    'class'           => 'elio-tabular-nums',
    'data-wp-context' => wp_json_encode($context),
);
?>
<p <?php echo wp_kses_data(get_block_wrapper_attributes($extra_wrapper_attributes)); ?>>
    <?php if ($show_prefix && $prefix !== '') : ?>
    <span class="wp-block-elio-temperature__prefix"><?php echo esc_html($prefix); ?></span>
    <?php endif; ?>
    <span class="wp-block-elio-temperature__value" data-wp-text="state.temperature"></span><span class="wp-block-elio-temperature__unit" data-wp-text="state.unit"></span>
</p>
