=== Elio Blocks ===
Contributors: alexandrebuffet
Tags: weather, forecast, block-editor, blocks, location
Requires at least: 6.7
Tested up to: 7.1
Requires PHP: 8.2
Stable tag: 0.4.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Weather blocks for the Block Editor, built the way WordPress builds its own. Add a Weather block, pick a place, and see if the sun shines.

== Description ==

Elio Blocks brings the weather to the Block Editor the way WordPress would have built it: with blocks that look, feel and behave like the ones you already use every day.

Insert the Weather block, type the name of a place and pick it from the suggestions: the live forecast shows up right in the editor. Publish, and see if the sun shines! ☀️

No coding required. No widgets, no shortcodes, no iframe either.

= Feels native, because it is =

* **21 blocks.** Every piece of the weather is a block of its own: temperature, humidity, wind, UV index, sunrise and sunset, condition icon, time of the last update and more. Add it, move it, style it, straight from the canvas or the List View.
* **The Weather block is the new Query Loop.** It fetches the weather forecast of a place and hands it to the blocks inside. Start from a ready-made layout (Default, Minimal, Hourly Forecast, Daily Forecast), or from scratch.
* **Template forecasts like you template posts.** Design one hourly or daily row with any blocks. The Forecast Template repeats it, like the Post Template does.
* **Every design tool you expect from the editor.** Colors, typography, spacing, borders: the same panels as core blocks, block by block or site-wide in the Global Styles or `theme.json`.
* **Icons drawn the WordPress way.** 92 weather icons, by day and by night, drawn like the WordPress icons. Pick another collection, or bring your own. On WordPress 7.1, they are in the Icon block too, anywhere on your site.
* **Your site's settings, respected.** Your language, your date formats, the timezone of the location. Metric or imperial, site-wide or per block.
* **What you see is what you get.** The real forecast, right in the editor, styled exactly as it will be on your site.
* **Made to be extended.** Weather providers and icon collections plug in with a few PHP functions, the way WordPress registers its own.

= In the page from the first byte, fresh all day =

* **Rendered on the server.** The weather is in the HTML your visitors and search engines get, server-side rendered like any WordPress block. No loading spinner, no layout shift.
* **Kept fresh in the browser.** The Interactivity API, the front-end framework of WordPress itself, refreshes the forecast in place without reloading the page. No jQuery, no heavy scripts.
* **Cached, and private.** Forecasts are cached on your server, and your visitors' browsers never contact the weather service, so their IP address stays with you.

Weather data and location search are provided by the Open-Meteo API. See the External services section below for what is sent to it and when.

= Source code =

The scripts and styles in the `build` folder of the plugin are compiled. Their human-readable sources (the `src` folder) and the configuration of the build tools are public on GitHub, where the plugin is developed: [https://github.com/alexandrebuffet/elio-blocks](https://github.com/alexandrebuffet/elio-blocks)

To build the plugin from its sources, with Node.js 22 and Composer:

1. `git clone https://github.com/alexandrebuffet/elio-blocks.git`
2. `cd elio-blocks`
3. `composer install`
4. `npm install`
5. `npm run build`

The build uses `@wordpress/scripts` (webpack), the build tool of WordPress itself. See the README of the repository for every command.

== Installation ==

= Installation from within WordPress =

1. Visit **Plugins > Add New**.
2. Search for **Elio Blocks**.
3. Install and activate the Elio Blocks plugin.

= Manual installation =

1. Upload the entire `elio-blocks` folder to the `/wp-content/plugins/` directory.
2. Visit **Plugins**.
3. Activate the Elio Blocks plugin.

== Frequently Asked Questions ==

= Is Elio Blocks free? =
Yes, totally. Elio Blocks is free software under the GPL, like WordPress itself. No pro version, no license key, no nag screen in your dashboard. Let the sunshine in. ☀️

= Do I need a weather API key? =
Not by default. Elio Blocks uses Open-Meteo, an open-source weather API that needs no account and no key for non-commercial use: see the External services section below. For a commercial site, enter the API key of an Open-Meteo subscription in the Providers section of the plugin settings. 😎

= Can I use another weather provider? =
Open-Meteo is the provider built in. Elio Blocks is made to welcome others. A provider is registered with a few PHP functions, the same way Open-Meteo is, so new ones can come with the plugin or from your own code.

= Can I style the weather blocks? =
Yes, like any other block. Colors, spacing and typography come from the standard design tools of the Block Editor, block by block, or for the whole site in the Global Styles of the Site Editor. Beyond that, use `theme.json`, block style variations or custom CSS. Clear skies ahead. 🌤️

= Can I change the weather icons? =
Yes. Every weather condition has its icon, by day and by night, with a stroke and a color you set like any block. Choose the icon collection for the whole site, a report or a single icon, or register your own collection in a few lines of PHP.

= Does it work with the Classic Editor, widgets, shortcodes or page builders? =
No. Elio Blocks only provides blocks, for the Block Editor and the Site Editor. The weather widget and the [weather] shortcode had a good run. This is what comes after. 🌈

= What about my visitors' privacy? =
Every request to the weather service is sent by your server, never by your visitors' browsers, and carries no data about them. No tracking, no third-party script.

= Where is the source code? =
On [GitHub](https://github.com/alexandrebuffet/elio-blocks), where the plugin is developed in the open. Issues and pull requests welcome. See also the Source code section of the description.

== External services ==

This plugin relies on [Open-Meteo](https://open-meteo.com/), an open-source weather API, to get weather data and to find locations by name. The blocks cannot display any weather without it. Open-Meteo requires no account and no API key for non-commercial use.

All requests are sent by your WordPress server, through the plugin's REST API. Visitors' browsers never contact Open-Meteo directly, so their IP address is not sent to it. Each request carries your server's IP address and a user agent naming the plugin, its version, your site's URL and the WordPress version, as the default WordPress user agent does.

= Open-Meteo Weather Forecast API =

* **Endpoint:** `https://api.open-meteo.com/v1/forecast`, or `https://customer-api.open-meteo.com/v1/forecast` once the API key of an Open-Meteo subscription is set in the plugin settings.
* **Used for:** the current conditions and the hourly and daily weather forecasts of the location chosen in a Weather block.
* **Data sent:** the latitude and longitude of that location (rounded to 2 decimals), the unit system (metric or imperial), the list of requested weather variables, the number of forecast days and, with a subscription, its API key. No data about your visitors or your content is sent.
* **When:** when a page containing a Weather block is displayed, when the block refreshes its data, in the visitor's browser or in the Block Editor while it is open, and when the block is edited in the Block Editor. Answers are cached in a transient, 30 minutes by default (see **Elio** in the admin menu), so Open-Meteo is only called again once the cached copy has expired, unless you turn the cache off.

= Open-Meteo Geocoding API =

* **Endpoint:** `https://geocoding-api.open-meteo.com/v1/search`
* **Used for:** finding a location by name in the Block Editor.
* **Data sent:** the text typed in the location search field and the maximum number of results.
* **When:** only when a user who can edit posts searches for a location in the Block Editor. Answers are cached in a transient like weather forecasts. It is never called on the front end.

= Terms, privacy and licence =

The free Open-Meteo API, which this plugin uses, is for non-commercial use only and has daily request limits. Commercial use requires a paid Open-Meteo subscription. Open-Meteo weather data is licensed under CC BY 4.0: credit Open-Meteo where its data is shown. The Provider Attribution block does it at the bottom of every Weather block, ("Weather data by Open-Meteo, licensed under CC BY 4.0", both names linked): keep it, or credit Open-Meteo elsewhere on the page if you remove it.

* Open-Meteo website: [https://open-meteo.com/](https://open-meteo.com/)
* Terms of use: [https://open-meteo.com/en/terms#terms](https://open-meteo.com/en/terms#terms)
* Privacy policy: [https://open-meteo.com/en/terms#privacy](https://open-meteo.com/en/terms#privacy)
* Data licence: [https://open-meteo.com/en/licence](https://open-meteo.com/en/licence)
* Pricing for commercial use: [https://open-meteo.com/en/pricing](https://open-meteo.com/en/pricing)

== Credits ==

The Elio icon collection is a rework inspired by [Tabler Icons](https://tabler.io/icons) (MIT License).

== Screenshots ==

1. The Weather block in the Block Editor, with its location in the block settings.
2. A daily forecast on the front end, styled by the theme.
3. Make it yours: colors, fonts and sizes from the standard design tools.
4. Search a location, or start blank and choose a layout.
5. Places are suggested as you type.
6. Current conditions next to a daily forecast list.
7. The details of the current weather, each a block of its own.
8. The General section of the settings page: units and data refresh.

== Changelog ==

= 0.4.0 =

-   The location search suggests places as you type: move through them with the arrow keys, pick one with Enter.
-   The location of a Weather block shows as one button in its settings, like the color items, with the WordPress map marker.
-   Days and times keep the right labels when the browser and the server disagree on the timezone of the location (a Daily Forecast for Marrakech labelled each day with the day before).
-   For developers: a weather data provider is registered once, with `elio_blocks_register_provider()`, and holds its adapters, credentials and attribution.
-   The stylesheets of the plugin name no web address, not even the namespace of an inline image.

= 0.3.0 =

-   The weather of an open page stays current after the computer sleeps, and a hidden page asks for nothing until it is shown again.
-   The Block Editor refreshes the weather forecast when the front end does, and keeps it shown when a refresh fails.
-   A new logo for Elio: a sun of twelve rays.
-   The description links the source code of the plugin and explains how to build it.

= 0.2.0 =

-   New Last Updated block: when the weather data was last fetched.
-   New Provider Attribution block: the credit the license of the weather data asks for, added at the bottom of each Weather block, with an option to open its links in a new tab.
-   Relative dates ("5 minutes ago") in the date format picker.
-   New icons drawn for the plugin, also available to the Icon block of WordPress 7.1.
-   The settings page previews six icons of each condition icon collection.
-   A preview of each block in the inserter, and a description for each block and variation.
-   Daily forecasts start at the day in progress, and a forecast list moves on to the next hour or day on time.
-   The blocks fill in place while the weather forecast loads.
-   Fixes for right-to-left languages, dark backgrounds and the settings page on small screens.

= 0.1.0 =

-   Beta release.
