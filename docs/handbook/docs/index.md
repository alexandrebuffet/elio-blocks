---
slug: /
title: Elio Blocks
sidebar_label: Introduction
---

Elio Blocks brings the weather to the WordPress Block Editor with blocks that work like the ones of WordPress itself. The Weather block is a container, like a Group: temperature, humidity, wind, UV index, sunrise and sunset, condition icon and the time of the last update are each a block of their own, and the hourly and daily forecasts repeat a template you design once, like the Post Template of the Query Loop.

Blocks are rendered on the server, so the weather is in the page from the first byte. The Interactivity API then keeps it up to date in the browser, without reloading the page. Weather data and location search come from [Open-Meteo](https://open-meteo.com/), which needs no account and no API key for non-commercial use.

## Requirements

- WordPress 6.7 or later, with the Block Editor. No shortcode, no widget, no Classic Editor.
- PHP 8.2 or later.

## In this handbook

- [Getting started](getting-started.md): add a Weather block, choose its location and its layout.
- [Settings](settings.md): units, data refresh, icons, providers and cache, for the whole site.
- [Extending](extending/providers.md): register a weather data provider or a condition icon collection, and read the REST API.
- [Reference](reference/blocks.md): every block, function, hook and class, generated from the code of the version it documents.

The handbook follows the latest version of the plugin. Its source is in the [GitHub repository](https://github.com/alexandrebuffet/elio-blocks), with the plugin.
