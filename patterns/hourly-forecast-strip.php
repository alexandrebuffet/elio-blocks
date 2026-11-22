<?php

/**
 * Pattern "Hourly Forecast Strip": the current conditions on one line, then the next twelve hours side by side.
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
<!-- wp:elio/weather-report {"metadata":{"ignoredHookedBlocks":["elio/provider-attribution"]},"align":"wide","style":{"spacing":{"blockGap":"var:preset|spacing|40"}}} -->
<!-- wp:group {"layout":{"type":"flex","flexWrap":"nowrap","verticalAlignment":"center"}} -->
<div class="wp-block-group"><!-- wp:elio/condition-icon {"isDecorative":true,"style":{"dimensions":{"width":"40px"}}} /-->

<!-- wp:elio/temperature {"style":{"typography":{"fontWeight":"300","lineHeight":"1"}},"fontSize":"x-large"} /-->

<!-- wp:group {"style":{"spacing":{"blockGap":"0"}},"layout":{"type":"flex","orientation":"vertical"}} -->
<div class="wp-block-group"><!-- wp:elio/location {"level":3} /-->

<!-- wp:elio/condition-description {"fontSize":"small"} /--></div>
<!-- /wp:group --></div>
<!-- /wp:group -->

<!-- wp:elio/forecast {"type":"hourly","count":12} -->
<!-- wp:elio/forecast-template {"layout":{"type":"grid","columnCount":12,"minimumColumnWidth":"3.4em"}} -->
<!-- wp:group {"style":{"spacing":{"blockGap":"0.25em"}},"layout":{"type":"flex","orientation":"vertical","justifyContent":"center"}} -->
<div class="wp-block-group"><!-- wp:elio/datetime {"displayType":"time","currentAsLabel":true} /-->

<!-- wp:elio/condition-icon {"style":{"dimensions":{"width":"24px"}}} /-->

<!-- wp:elio/hourly-temperature {"style":{"typography":{"fontWeight":"600"}}} /-->

<!-- wp:elio/precipitation-probability {"fontSize":"small"} /--></div>
<!-- /wp:group -->
<!-- /wp:elio/forecast-template -->
<!-- /wp:elio/forecast -->

<!-- wp:elio/provider-attribution /-->
<!-- /wp:elio/weather-report -->
