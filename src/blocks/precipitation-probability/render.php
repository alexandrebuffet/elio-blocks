<?php
/**
 * Precipitation Probability block server-side render.
 *
 * @var array    $attributes Block attributes.
 * @var string   $content    Inner block content.
 * @var WP_Block $block      Block instance.
 */

// Exit if called directly.
if (! defined('ABSPATH')) {
    die;
}
?>
<p <?php echo wp_kses_data(get_block_wrapper_attributes( array( 'class' => 'elio-tabular-nums' ) )); ?>>
    <span class="wp-block-elio-precipitation-probability__value" data-wp-text="state.precipitationProbability"></span><span class="wp-block-elio-precipitation-probability__unit" data-wp-text="state.precipitationProbabilityUnit"></span>
</p>
