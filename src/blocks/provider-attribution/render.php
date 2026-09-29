<?php
/**
 * Provider Attribution block server-side render: the credit the provider of
 * the report asks for wherever its data is shown.
 *
 * One sentence, its name and the license linked: each link names where it
 * leads, the sentence around it what it is. The links open in the same tab,
 * as the other links of the page do.
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

$provider    = isset($block->context['elio/reportProvider']) ? (string) $block->context['elio/reportProvider'] : '';
$attribution = elio_blocks_get_weather_forecast_attribution($provider);

// A provider that asks for no credit gets no empty paragraph.
if (null === $attribution) {
    return;
}

$provider_link = sprintf(
    '<a class="wp-block-elio-provider-attribution__provider-link" href="%1$s">%2$s</a>',
    esc_url($attribution['url']),
    esc_html($attribution['name'])
);

if ('' === $attribution['license']) {
    $credit = sprintf(
        /* translators: %s: Name of the weather data provider, linked to its site (e.g. Open-Meteo). */
        esc_html__('Weather data by %s', 'elio-blocks'),
        $provider_link
    );
} else {
    $license = '' !== $attribution['license_url']
        ? sprintf(
            '<a class="wp-block-elio-provider-attribution__license-link" href="%1$s" rel="license">%2$s</a>',
            esc_url($attribution['license_url']),
            esc_html($attribution['license'])
        )
        : esc_html($attribution['license']);

    $credit = sprintf(
        /* translators: 1: Name of the weather data provider, linked to its site (e.g. Open-Meteo). 2: Name of the license of its data, linked to it (e.g. CC BY 4.0). */
        esc_html__('Weather data by %1$s, licensed under %2$s', 'elio-blocks'),
        $provider_link,
        $license
    );
}

$allowed_html = array(
    'a' => array(
        'class' => true,
        'href'  => true,
        'rel'   => true,
    ),
);
?>
<p <?php echo wp_kses_data(get_block_wrapper_attributes()); ?>><?php echo wp_kses($credit, $allowed_html); ?></p>
