<?php

/**
 * Pattern "Almanac · Sun": the day and the sun, centered: date, sunrise, sunset and UV index.
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
<!-- wp:elio/weather-report {"metadata":{"ignoredHookedBlocks":["elio/provider-attribution"]},"layout":{"type":"flex","orientation":"vertical","justifyContent":"center"}} -->
<!-- wp:group {"style":{"spacing":{"blockGap":"0"}},"layout":{"type":"flex","orientation":"vertical","justifyContent":"center"}} -->
<div class="wp-block-group"><!-- wp:elio/location {"level":0,"style":{"typography":{"textTransform":"uppercase","letterSpacing":"0.12em","fontWeight":"600"}},"fontSize":"small"} /-->

<!-- wp:elio/datetime {"displayType":"date","format":"l j F","style":{"typography":{"fontWeight":"300"}},"fontSize":"x-large"} /--></div>
<!-- /wp:group -->

<!-- wp:group {"layout":{"type":"flex","flexWrap":"wrap","justifyContent":"center"}} -->
<div class="wp-block-group"><!-- wp:elio/sun-event {"showPrefix":true,"prefix":"<?php echo esc_html__('Sunrise', 'elio-blocks'); ?>"} /-->

<!-- wp:elio/sun-event {"displayType":"sunset","showPrefix":true,"prefix":"<?php echo esc_html__('Sunset', 'elio-blocks'); ?>"} /--></div>
<!-- /wp:group -->

<!-- wp:elio/uv-index {"showPrefix":true,"prefix":"<?php echo esc_html__('UV index', 'elio-blocks'); ?>"} /-->

<!-- wp:elio/provider-attribution /-->
<!-- /wp:elio/weather-report -->
