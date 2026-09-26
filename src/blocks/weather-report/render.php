<?php
/**
 * Report block server-side render.
 *
 * @var array    $attributes Block attributes.
 * @var string   $content    Inner block content.
 * @var WP_Block $block      Block instance.
 */

// Exit if called directly.
if (! defined('ABSPATH')) {
    die;
}

// Retrieve attributes.
$tag_name = isset($attributes['tagName']) && ! empty($attributes['tagName']) ? $attributes['tagName'] : 'section';

$allowed_tag_names = array( 'div', 'section', 'article' );
$wrapper_tag       = in_array($tag_name, $allowed_tag_names, true) ? $tag_name : 'section';

wp_interactivity_state('elio/weather-report', elio_blocks_get_weather_report_interactivity_state());

$directives = array(
    'data-wp-interactive'                   => 'elio/weather-report',
    'data-wp-context'                       => wp_json_encode(elio_blocks_get_weather_report_interactivity_context($block)),
    'data-wp-init'                          => 'actions.init',
    // No suffix: the unique ID syntax changed in WordPress 7.0 (two hyphens, then three).
    'data-wp-watch'                         => 'callbacks.startAutoRefresh',
    'data-wp-on--weather-refresh'           => 'actions.fetch',
    'data-wp-on-document--visibilitychange' => 'actions.handleVisibilityChange',
);

$extra_wrapper_attributes = array();

$wrapper_attributes = get_block_wrapper_attributes($extra_wrapper_attributes + $directives);
?>
<<?php echo tag_escape($wrapper_tag); ?> <?php echo wp_kses_data($wrapper_attributes); ?>>
    <?php
    // Symbols of the icons the inner blocks show and the page does not have yet (IconSprite).
    // The inner blocks are rendered already: printed first, the symbols reach the browser
    // before the icons using them.
    echo elio_blocks_render_icon_sprite(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Sanitized icons.
    ?>
    <?php echo $content; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
</<?php echo tag_escape($wrapper_tag); ?>>
