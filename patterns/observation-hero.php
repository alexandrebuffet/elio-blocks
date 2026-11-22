<?php

/**
 * Pattern "Hero Observation": the current temperature very large, the details stacked beside it. Full width, for the top of a page.
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
<!-- wp:elio/weather-report {"metadata":{"ignoredHookedBlocks":["elio/provider-attribution"]},"align":"full","layout":{"type":"constrained"}} -->
<!-- wp:columns {"verticalAlignment":"bottom","align":"wide"} -->
<div class="wp-block-columns alignwide are-vertically-aligned-bottom"><!-- wp:column {"width":"60%"} -->
<div class="wp-block-column" style="flex-basis:60%"><!-- wp:elio/location {"style":{"typography":{"textTransform":"uppercase","letterSpacing":"0.12em","fontWeight":"600"}},"fontSize":"small"} /-->

<!-- wp:elio/temperature {"style":{"typography":{"fontSize":"clamp(5rem, 14vw, 11rem)","fontWeight":"200","letterSpacing":"-0.05em","lineHeight":"0.85"}}} /-->

<!-- wp:elio/condition-description {"style":{"typography":{"fontWeight":"300"}},"fontSize":"large"} /--></div>
<!-- /wp:column -->

<!-- wp:column {"width":"40%"} -->
<div class="wp-block-column" style="flex-basis:40%"><!-- wp:group {"style":{"spacing":{"blockGap":"var:preset|spacing|20"}},"layout":{"type":"flex","orientation":"vertical"}} -->
<div class="wp-block-group"><!-- wp:elio/temperature {"displayType":"feels-like","showPrefix":true,"prefix":"<?php echo esc_html__('Feels like', 'elio-blocks'); ?>"} /-->

<!-- wp:group {"layout":{"type":"flex","flexWrap":"nowrap","verticalAlignment":"center"}} -->
<div class="wp-block-group"><!-- wp:elio/wind-speed {"showPrefix":true,"prefix":"<?php echo esc_html__('Wind', 'elio-blocks'); ?>"} /-->

<!-- wp:elio/wind-direction /--></div>
<!-- /wp:group -->

<!-- wp:elio/humidity {"showPrefix":true,"prefix":"<?php echo esc_html__('Humidity', 'elio-blocks'); ?>"} /-->

<!-- wp:elio/uv-index {"showPrefix":true,"prefix":"<?php echo esc_html__('UV index', 'elio-blocks'); ?>"} /-->

<!-- wp:elio/sun-event {"showPrefix":true,"prefix":"<?php echo esc_html__('Sunrise', 'elio-blocks'); ?>"} /-->

<!-- wp:elio/sun-event {"displayType":"sunset","showPrefix":true,"prefix":"<?php echo esc_html__('Sunset', 'elio-blocks'); ?>"} /--></div>
<!-- /wp:group -->

<!-- wp:group {"fontSize":"small","layout":{"type":"flex","flexWrap":"wrap","justifyContent":"space-between"}} -->
<div class="wp-block-group has-small-font-size"><!-- wp:elio/last-updated /-->

<!-- wp:elio/provider-attribution /--></div>
<!-- /wp:group --></div>
<!-- /wp:column --></div>
<!-- /wp:columns -->
<!-- /wp:elio/weather-report -->
