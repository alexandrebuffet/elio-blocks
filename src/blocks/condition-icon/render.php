<?php

/**
 * Condition Icon block server-side render.
 *
 * The block is an <svg><use href="#…"></use></svg> in a wrapper that names it.
 * The href and the accessible name are bound to the item in context
 * (DerivedState::conditionIcon*), in the collection of the block (its
 * attribute, else its report's, else the site's), so WordPress prints them
 * for the current conditions and in every row of a forecast list, whose
 * template can only bind attributes. WordPress rejects directives on or inside an <svg>: it
 * prints the href on the wrapper, LinkConditionIcons moves it into the <use>,
 * and callbacks.linkConditionIcon keeps it up to date in the browser. The
 * icons themselves are printed once, as symbols, by the report block
 * (IconSprite): the page shows them before any script runs, and the browser
 * only changes attributes after a refresh.
 *
 * Styles (color, border, spacing padding, dimensions width) are applied
 * directly to the SVG, mirroring core/icon. Margin is serialized
 * automatically (not skipped) and lands on the wrapper.
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

$is_decorative = (bool) ( $attributes['isDecorative'] ?? false );

// Collection of the icons of this block: its own, else the one of its report, else the one of the site.
$icon_collection = elio_blocks_get_condition_icon_collection(
    isset($attributes['iconCollection']) ? (string) $attributes['iconCollection'] : null,
    isset($block->context['elio/reportIconCollection']) ? (string) $block->context['elio/reportIconCollection'] : null
);

// Stroke width of the symbol: the one of the block, else the one the icons of the collection are drawn with.
$stroke_width = isset($attributes['strokeWidth']) ? (float) $attributes['strokeWidth'] : elio_blocks_get_condition_icon_stroke_width($icon_collection);

// Icons this block shows: the one of the current conditions, or the ones of the rows of its list.
$items = isset($block->context['elio/forecastType'])
    ? elio_blocks_get_forecast_items(
        (string) $block->context['elio/forecastType'],
        absint($block->context['elio/forecastCount'] ?? 7)
    )
    : array_filter(array( elio_blocks_get_current_conditions() ));

foreach ($items as $item) {
    $name = $item['condition_icons'][ $icon_collection ] ?? null;
    $icon = is_string($name) ? elio_blocks_get_condition_icon($name) : null;

    if (! empty($icon['content'])) {
        elio_blocks_add_icon_to_sprite($name, $icon['content']);
    }
}

// Color.
$color_styles                = array();
$preset_text_color           = isset($attributes['textColor']) ? "var:preset|color|{$attributes['textColor']}" : null;
$custom_text_color           = $attributes['style']['color']['text'] ?? null;
$color_styles['text']        = $preset_text_color ?? $custom_text_color;
$preset_background_color     = isset($attributes['backgroundColor']) ? "var:preset|color|{$attributes['backgroundColor']}" : null;
$custom_background_color     = $attributes['style']['color']['background'] ?? null;
$color_styles['background']  = $preset_background_color ?? $custom_background_color;

// Border.
$border_styles = array();
$sides         = array( 'top', 'right', 'bottom', 'left' );

if (isset($attributes['style']['border']['radius'])) {
    $border_styles['radius'] = $attributes['style']['border']['radius'];
}
if (isset($attributes['style']['border']['style'])) {
    $border_styles['style'] = $attributes['style']['border']['style'];
}
if (isset($attributes['style']['border']['width'])) {
    $border_styles['width'] = $attributes['style']['border']['width'];
}

$preset_border_color    = isset($attributes['borderColor']) ? "var:preset|color|{$attributes['borderColor']}" : null;
$custom_border_color    = $attributes['style']['border']['color'] ?? null;
$border_styles['color'] = $preset_border_color ?? $custom_border_color;

foreach ($sides as $side) {
    $border                   = $attributes['style']['border'][ $side ] ?? null;
    $border_styles[ $side ]   = array(
        'color' => $border['color'] ?? null,
        'style' => $border['style'] ?? null,
        'width' => $border['width'] ?? null,
    );
}

// Spacing (padding only — margin is not skipped, auto-applied to wrapper).
$spacing_styles = array();
if (isset($attributes['style']['spacing']['padding'])) {
    $spacing_styles['padding'] = $attributes['style']['spacing']['padding'];
}

// Dimensions (width only).
$dimensions_styles = array();
if (isset($attributes['style']['dimensions']['width'])) {
    $dimensions_styles['width'] = $attributes['style']['dimensions']['width'];
}

$styles = wp_style_engine_get_styles(
    array(
        'color'      => $color_styles,
        'border'     => $border_styles,
        'spacing'    => $spacing_styles,
        'dimensions' => $dimensions_styles,
    )
);

// No directive on or inside the <svg>: WordPress rejects them when it processes directives server-side.
$svg_attributes = array(
    'xmlns'        => 'http://www.w3.org/2000/svg',
    'viewBox'      => '0 0 24 24',
    'aria-hidden'  => 'true',
    'focusable'    => 'false',
    'stroke-width' => (string) $stroke_width,
    'class'        => trim('wp-block-elio-condition-icon__symbol ' . ( $styles['classnames'] ?? '' )),
    'style'        => $styles['css'] ?? '',
);

$svg_html = '';
foreach (array_filter($svg_attributes) as $name => $value) {
    $svg_html .= sprintf(' %s="%s"', $name, esc_attr($value));
}

// The wrapper names the icon and carries the href of its symbol: WordPress prints it
// in every forecast row, LinkConditionIcons then moves it into the <use>.
$wrapper_attributes = get_block_wrapper_attributes(
    array(
        'data-wp-context'                      => wp_json_encode(array( 'isDecorative' => $is_decorative, 'iconCollection' => $icon_collection )),
        'data-wp-class--has-svg-symbol'        => 'state.hasConditionIcon',
        'data-wp-class--has-stroke-svg-symbol' => 'state.isStrokeConditionIcon',
        'data-wp-bind--role'                   => 'state.conditionIconRole',
        'data-wp-bind--aria-label'             => 'state.conditionIconLabel',
        'data-wp-bind--data-elio-icon-href'    => 'state.conditionIconHref',
        'data-wp-watch'                        => 'callbacks.linkConditionIcon',
    )
);
?>
<div <?php echo wp_kses_data($wrapper_attributes); ?>>
    <svg<?php echo $svg_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Escaped above. ?>><use></use></svg>
</div>
