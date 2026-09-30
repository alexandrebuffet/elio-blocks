# Elio Blocks

[![WordPress Plugin](https://img.shields.io/wordpress/plugin/v/elio-blocks.svg)](https://wordpress.org/plugins/elio-blocks/)
[![WordPress Plugin](https://img.shields.io/wordpress/plugin/dt/elio-blocks.svg)](https://wordpress.org/plugins/elio-blocks/)
[![WordPress Plugin](https://img.shields.io/wordpress/plugin/r/elio-blocks.svg)](https://wordpress.org/plugins/elio-blocks/)
[![License](https://img.shields.io/badge/license-GPLv2-blue.svg)](http://www.gnu.org/licenses/gpl-2.0.html)

Easily display the current weather and forecasts for any location on your site, with blocks that feel native.

## Description

Elio Blocks brings the weather to the Block Editor the way WordPress would have built it: with blocks that look, feel and behave like the ones you already use every day.

Insert the Weather block, search for your location, and the live forecast shows up right in the editor. Publish, and see if the sun shines! ☀️

No coding required. No widgets, no shortcodes, no iframe either.

### Feels native, because it is

- **Blocks all the way down.** The Weather block is a container, like a Group. Temperature, humidity, wind, UV index, sunrise and sunset, condition icon and more are each a block of their own: add them, remove them, reorder them, nest them in rows, columns or groups, straight from the canvas or the List View.
- **Icons for the rest of your page.** The icons of Elio, weather conditions included, are an icon collection of WordPress 7.1: pick one in the Icon block, anywhere on your site.
- **Forecasts that work like the Query Loop.** The hourly and daily forecast lists repeat a template you design once, just like the Post Template of the Query Loop block.
- **Start from a layout.** Pick one of the ready-made variations (Default, Minimal, Hourly Forecast, Daily Forecast), or start blank and build your own.
- **Every design tool you expect.** Colors, typography, spacing, borders and layout come from the standard block supports, so they appear in the same panels as those of core blocks, follow your theme's presets, and can be set for the whole site in `theme.json` or the Styles of the Site Editor.
- **Your site's settings, respected.** Dates and times use your site's language and date formats, in the timezone of the location. Units are metric or imperial, site-wide or per block.
- **What you see is what you get.** The editor shows the real forecast of your location, styled as it will be on your site.

### Fast and up to date on the front end

Blocks are rendered on the server, so the weather is in the page from the first byte. Then the Interactivity API, the front-end framework of WordPress itself, keeps the data fresh in your visitors' browsers without reloading the page. No jQuery, no heavy scripts: condition icons are shared across the page and forecast data is cached on your server.

Weather data and location search are provided by the Open-Meteo API. See [External services](#external-services) for what is sent to it and when.

## Installation

### Installation from within WordPress

1. Visit **Plugins > Add New**.
2. Search for **Elio Blocks**.
3. Install and activate the Elio Blocks plugin.

### Manual installation

1. Upload the entire `elio-blocks` folder to the `/wp-content/plugins/` directory.
2. Visit **Plugins**.
3. Activate the Elio Blocks plugin.

## Requirements

- WordPress 6.7 or higher
- PHP 8.2 or higher
- Tested up to WordPress 7.1

## Frequently Asked Questions

### Is it free?

Yes, this plugin is totally free to use. Let the sunshine in. ☀️

### Does it require a license or an API key?

No, this plugin uses the Open-Meteo API, an open-source weather API that needs no account and no API key. Its free access is for non-commercial use only: see [External services](#external-services). For commercial use, enter the API key of an Open-Meteo subscription in the Providers section of the plugin settings. 😎

### How does it work?

The plugin adds its own REST API endpoints: one serves the weather forecast, another finds locations by name. In the Block Editor, a data store fetches the forecast and passes it to the Weather block and all its inner blocks through block context. On the front end, the blocks are rendered on the server, then the Interactivity API keeps the data up to date in the browser. ⚡️

### Can I customize the blocks?

Yes. Like core blocks, the Weather blocks come with the standard design tools, such as colors, spacing and typography, straight from the Block Editor. Beyond that, you can style them with `theme.json`, block style variations or plain CSS. Clear skies ahead. 🌤️

### Does it work with widgets or shortcodes?

No, this plugin only provides blocks. It's your time to shine: move from widgets and shortcodes to the Block Editor! ⛈️

### Does it work with the Classic Editor?

No, this plugin is only compatible with the Block Editor. Don't let your website get clouded: make the switch to the Block Editor today! 🌧️

### Can I use it with page builders?

No, this plugin only works with the Block Editor. Don't wait for the weather to change: move on to the native Block Editor! 🌈

## External services

This plugin relies on [Open-Meteo](https://open-meteo.com/), an open-source weather API, to get weather data and to find locations by name. The blocks cannot display any weather without it. Open-Meteo requires no account and no API key for non-commercial use.

All requests are sent by your WordPress server, through the plugin's REST API. Visitors' browsers never contact Open-Meteo directly, so their IP address is not sent to it. Each request carries your server's IP address and a user agent naming the plugin, its version, your site's URL and the WordPress version, as the default WordPress user agent does.

### Open-Meteo Weather Forecast API

- **Endpoint:** `https://api.open-meteo.com/v1/forecast`, or `https://customer-api.open-meteo.com/v1/forecast` once the API key of an Open-Meteo subscription is set in the plugin settings.
- **Used for:** the current conditions and the hourly and daily weather forecasts of the location chosen in a Weather block.
- **Data sent:** the latitude and longitude of that location (rounded to 2 decimals), the unit system (metric or imperial), the list of requested weather variables, the number of forecast days and, with a subscription, its API key. No data about your visitors or your content is sent.
- **When:** when a page containing a Weather block is displayed, when the block refreshes its data in the visitor's browser, and when the block is edited in the Block Editor. Answers are cached in a transient, 30 minutes by default (see **Elio** in the admin menu), so Open-Meteo is only called again once the cached copy has expired, unless you turn the cache off.

### Open-Meteo Geocoding API

- **Endpoint:** `https://geocoding-api.open-meteo.com/v1/search`
- **Used for:** finding a location by name in the Block Editor.
- **Data sent:** the text typed in the location search field and the maximum number of results.
- **When:** only when a user who can edit posts searches for a location in the Block Editor. Answers are cached in a transient like weather forecasts. It is never called on the front end.

### Terms, privacy and licence

The free Open-Meteo API, which this plugin uses, is for non-commercial use only and has daily request limits. Commercial use requires a paid Open-Meteo subscription. Open-Meteo weather data is licensed under CC BY 4.0: credit Open-Meteo where its data is shown, for example with a "Weather data by Open-Meteo.com" link.

- Open-Meteo website: [https://open-meteo.com/](https://open-meteo.com/)
- Terms of use: [https://open-meteo.com/en/terms#terms](https://open-meteo.com/en/terms#terms)
- Privacy policy: [https://open-meteo.com/en/terms#privacy](https://open-meteo.com/en/terms#privacy)
- Data licence: [https://open-meteo.com/en/licence](https://open-meteo.com/en/licence)
- Pricing for commercial use: [https://open-meteo.com/en/pricing](https://open-meteo.com/en/pricing)

## Development

The plugin requires Node.js 22 (see `.nvmrc`) and Composer.

```bash
git clone https://github.com/alexandrebuffet/elio-blocks.git
cd elio-blocks
composer install
npm install
npm run build
```

| Command                              | Description                          |
| ------------------------------------ | ------------------------------------ |
| `npm start`                          | Development build with file watching |
| `npm run build`                      | Production build                     |
| `npm run lint:js` / `lint:css`       | Lint JavaScript and stylesheets      |
| `npm run test:js`                    | Run JavaScript unit tests            |
| `composer test`                      | Run PHPUnit unit tests               |
| `composer phpstan`                   | Run PHPStan static analysis          |
| `composer phpcs` / `composer phpcbf` | Check and fix PHP coding standards   |

The WordPress.org package is built by the `build-plugin.yml` GitHub Actions workflow: run it by hand to get a ZIP to test.

The presentation site, [alexandrebuffet.github.io/elio-blocks](https://alexandrebuffet.github.io/elio-blocks/), lives in `docs/site/`: `npm run build:site` assembles it into `_site/`, which any static server can show (the Playground demo needs `elio-blocks.zip` next to it, added by the `deploy-site.yml` workflow).

Bug reports and pull requests are welcome on [GitHub](https://github.com/alexandrebuffet/elio-blocks/issues).

## Credits

The icons of the plugin were drawn for it. The layout illustrations of the Weather block variations include a sun from [Tabler Icons](https://tabler.io/icons), Copyright (c) 2020-2026 Paweł Kuna, released under the [MIT License](https://github.com/tabler/tabler-icons/blob/main/LICENSE), which is compatible with the GPL.

## Changelog

See [readme.txt](readme.txt) for release history.
