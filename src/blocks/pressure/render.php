<?php
/**
 * Pressure block server-side render.
 *
 * @var array    $attributes Block attributes.
 * @var string   $content    Inner block content.
 * @var WP_Block $block      Block instance.
 */

// Exit if called directly.
if (! defined('ABSPATH')) {
    die;
}

$show_prefix = isset($attributes['showPrefix']) ? (bool) $attributes['showPrefix'] : false;
$prefix      = isset($attributes['prefix']) ? sanitize_text_field($attributes['prefix']) : '';
?>
<p <?php echo wp_kses_data(get_block_wrapper_attributes( array( 'class' => 'elio-tabular-nums' ) )); ?>>
    <?php if ($show_prefix && $prefix !== '') : ?>
    <span class="wp-block-elio-pressure__prefix"><?php echo esc_html($prefix); ?></span>
    <?php endif; ?>
    <span class="wp-block-elio-pressure__value" data-wp-text="state.pressure"></span><span class="wp-block-elio-pressure__unit" data-wp-text="state.pressureUnit"></span>
</p>
