<?php

/**
 * Pattern "Compact Observation": the current conditions in a column: location and date, temperature, feels-like temperature, wind, humidity and precipitation.
 *
 * Registered by RegisterBlockPatterns, which gives its title and description.
 * Layout only: no color, border, background nor font family, the theme gives
 * them. The prefixes are translated here, in the attributes of their blocks.
 *
 * @package ElioBlocks
 */

// Exit if called directly.
if (! defined('ABSPATH')) {
    die;
}
?>
<!-- wp:elio/weather-report {"metadata":{"ignoredHookedBlocks":["elio/provider-attribution"]}} -->
<!-- wp:group {"layout":{"type":"flex","flexWrap":"wrap","justifyContent":"space-between","verticalAlignment":"center"}} -->
<div class="wp-block-group"><!-- wp:elio/location {"level":3} /-->

<!-- wp:elio/datetime {"displayType":"date","format":"D j M","style":{"typography":{"textTransform":"uppercase","letterSpacing":"0.12em","fontWeight":"600"}},"fontSize":"small"} /--></div>
<!-- /wp:group -->

<!-- wp:group {"layout":{"type":"flex","flexWrap":"nowrap","verticalAlignment":"center"}} -->
<div class="wp-block-group"><!-- wp:elio/condition-icon {"isDecorative":true,"style":{"dimensions":{"width":"56px"}}} /-->

<!-- wp:elio/temperature {"style":{"typography":{"fontWeight":"300","letterSpacing":"-0.03em","lineHeight":"1"}},"fontSize":"xx-large"} /--></div>
<!-- /wp:group -->

<!-- wp:elio/condition-description /-->

<!-- wp:elio/temperature {"displayType":"feels-like","showPrefix":true,"prefix":"<?php echo esc_html__('Feels like', 'elio-blocks'); ?>"} /-->

<!-- wp:group {"layout":{"type":"flex","flexWrap":"wrap"}} -->
<div class="wp-block-group"><!-- wp:elio/wind-speed {"showPrefix":true,"prefix":"<?php echo esc_html__('Wind', 'elio-blocks'); ?>"} /-->

<!-- wp:elio/humidity {"showPrefix":true,"prefix":"<?php echo esc_html__('Humidity', 'elio-blocks'); ?>"} /-->

<!-- wp:elio/precipitation {"showPrefix":true,"prefix":"<?php echo esc_html__('Precipitation', 'elio-blocks'); ?>"} /--></div>
<!-- /wp:group -->

<!-- wp:elio/provider-attribution /-->
<!-- /wp:elio/weather-report -->
