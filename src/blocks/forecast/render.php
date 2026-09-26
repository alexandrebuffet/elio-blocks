<?php
/**
 * Forecast block server-side render.
 *
 * Outputs a wrapper; the loop is rendered by the inner Forecast Template block.
 *
 * @see https://github.com/WordPress/gutenberg/blob/trunk/docs/reference-guides/block-api/block-metadata.md#render
 *
 * @var array    $attributes Block attributes.
 * @var string   $content    Inner block content (forecast-template output).
 * @var WP_Block $block      Block instance.
 */

// Exit if called directly.
if (! defined('ABSPATH')) {
    die;
}
?>
<div <?php echo wp_kses_data(get_block_wrapper_attributes()); ?>>
    <?php echo $content; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
</div>
