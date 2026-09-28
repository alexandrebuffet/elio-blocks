<?php
/**
 * Provider Attribution block server-side render: the credit the provider of
 * the report asks for wherever its data is shown.
 *
 * @var array    $attributes Block attributes.
 * @var string   $content    Inner block content.
 * @var WP_Block $block      Block instance.
 */

// Exit if called directly.
if (! defined('ABSPATH')) {
    die;
}

$provider    = isset($block->context['elio/reportProvider']) ? (string) $block->context['elio/reportProvider'] : '';
$attribution = elio_blocks_get_weather_forecast_attribution($provider);

// A provider that asks for no credit gets no empty paragraph.
if (null === $attribution) {
    return;
}

$wrapper_attributes = get_block_wrapper_attributes();
?>
<p <?php echo wp_kses_data($wrapper_attributes); ?>>
<?php if ('' !== $attribution['url']) : ?>
    <a class="wp-block-elio-provider-attribution__provider-link" href="<?php echo esc_url($attribution['url']); ?>"><?php echo esc_html($attribution['text']); ?></a>
<?php else : ?>
    <?php echo esc_html($attribution['text']); ?>
<?php endif; ?>
<?php if ('' !== $attribution['license']) : ?>
    <span class="wp-block-elio-provider-attribution__license">(<?php if ('' !== $attribution['license_url']) : ?><a class="wp-block-elio-provider-attribution__license-link" href="<?php echo esc_url($attribution['license_url']); ?>" rel="license"><?php echo esc_html($attribution['license']); ?></a><?php else : ?><?php echo esc_html($attribution['license']); ?><?php endif; ?>)</span>
<?php endif; ?>
</p>
