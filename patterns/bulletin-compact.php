<?php

/**
 * Pattern "Bulletin · Compact": the current conditions on one line, then the next five days in columns.
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
<!-- wp:elio/weather-report {"metadata":{"ignoredHookedBlocks":["elio/provider-attribution"]},"style":{"spacing":{"blockGap":"var:preset|spacing|40"}}} -->
<!-- wp:group {"layout":{"type":"flex","flexWrap":"nowrap","verticalAlignment":"center","justifyContent":"space-between"}} -->
<div class="wp-block-group"><!-- wp:group {"style":{"spacing":{"blockGap":"0"}},"layout":{"type":"flex","orientation":"vertical"}} -->
<div class="wp-block-group"><!-- wp:elio/location {"level":3} /-->

<!-- wp:elio/condition-description {"fontSize":"small"} /--></div>
<!-- /wp:group -->

<!-- wp:group {"layout":{"type":"flex","flexWrap":"nowrap","verticalAlignment":"center"}} -->
<div class="wp-block-group"><!-- wp:elio/condition-icon {"isDecorative":true,"style":{"dimensions":{"width":"36px"}}} /-->

<!-- wp:elio/temperature {"style":{"typography":{"fontWeight":"300","lineHeight":"1"}},"fontSize":"x-large"} /--></div>
<!-- /wp:group --></div>
<!-- /wp:group -->

<!-- wp:elio/forecast {"count":5,"fontSize":"small"} -->
<!-- wp:elio/forecast-template {"layout":{"type":"grid","columnCount":5,"minimumColumnWidth":"3em"}} -->
<!-- wp:group {"style":{"spacing":{"blockGap":"0.25em"}},"layout":{"type":"flex","orientation":"vertical","justifyContent":"center"}} -->
<div class="wp-block-group"><!-- wp:elio/datetime {"displayType":"date","format":"D","currentAsLabel":true} /-->

<!-- wp:elio/condition-icon {"style":{"dimensions":{"width":"24px"}}} /-->

<!-- wp:elio/daily-temperature {"displayType":"max","style":{"typography":{"fontWeight":"600"}}} /-->

<!-- wp:elio/daily-temperature /--></div>
<!-- /wp:group -->
<!-- /wp:elio/forecast-template -->
<!-- /wp:elio/forecast -->

<!-- wp:elio/provider-attribution /-->
<!-- /wp:elio/weather-report -->
