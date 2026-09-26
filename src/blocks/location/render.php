<?php
/**
 * Location block block server-side render.
 *
 * @var array    $attributes Block attributes.
 * @var string   $content    Inner block content.
 * @var WP_Block $block      Block instance.
 */

// Exit if called directly.
if (! defined('ABSPATH')) {
    die;
}

$location = isset($block->context['elio/reportLocation']) && is_array($block->context['elio/reportLocation'])
    ? $block->context['elio/reportLocation']
    : array();

$display_type = isset($attributes['displayType']) && !empty($attributes['displayType']) ? $attributes['displayType'] : 'name';
$custom_name  = isset($location['customName']) ? trim((string) $location['customName']) : '';
$name         = isset($location['name']) ? trim((string) $location['name']) : '';
$lat          = isset($location['latitude']) ? floatval($location['latitude']) : null;
$lng          = isset($location['longitude']) ? floatval($location['longitude']) : null;

// Set the location value: custom name overrides both name and coordinates display.
$location_value = '';

if ('' !== $custom_name) {
    $location_value = $custom_name;
} elseif ('name' === $display_type && '' !== $name) {
    $location_value = $name;
} elseif ('coordinates' === $display_type && null !== $lat && null !== $lng) {
    $location_value = wp_sprintf('%.4f, %.4f', $lat, $lng);
}

// Set the tag name based on the level attribute.
$level    = isset($attributes['level']) ? (int) $attributes['level'] : 2;
$level    = ( $level >= 0 && $level <= 6 ) ? $level : 2;
$tag_name = 0 === $level ? 'p' : 'h' . $level;

// Set the location label.
$location_label = wp_sprintf(
    // translators: %s is the location value.
    __('Weather location: %s', 'elio-blocks'),
    $location_value
);

// Set extra wrapper attributes.
$extra_wrapper_attributes = array(
    'aria-label' => $location_label,
);

// Set the wrapper attributes.
$wrapper_attributes = get_block_wrapper_attributes($extra_wrapper_attributes);
?>
<<?php echo tag_escape($tag_name); ?> <?php echo wp_kses_data($wrapper_attributes); ?>>
    <?php echo esc_html($location_value); ?>
</<?php echo tag_escape($tag_name); ?>>
