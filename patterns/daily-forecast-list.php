<?php

/**
 * Pattern "Daily Forecast List": the next seven days in rows: day, condition, chance of rain, lowest and highest temperatures.
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
<!-- wp:elio/location {"level":3} /-->

<!-- wp:elio/forecast -->
<!-- wp:elio/forecast-template {"layout":{"type":"grid","columnCount":1}} -->
<!-- wp:group {"layout":{"type":"grid","columnCount":5}} -->
<div class="wp-block-group"><!-- wp:elio/datetime {"displayType":"date","format":"l","currentAsLabel":true} /-->

<!-- wp:elio/condition-icon {"style":{"dimensions":{"width":"26px"}}} /-->

<!-- wp:elio/precipitation-probability /-->

<!-- wp:elio/daily-temperature /-->

<!-- wp:elio/daily-temperature {"displayType":"max","style":{"typography":{"fontWeight":"600"}}} /--></div>
<!-- /wp:group -->
<!-- /wp:elio/forecast-template -->
<!-- /wp:elio/forecast -->

<!-- wp:elio/provider-attribution /-->
<!-- /wp:elio/weather-report -->
