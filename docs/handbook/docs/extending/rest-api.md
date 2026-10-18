---
title: REST API
---

The blocks get their data from the REST API of the plugin, under `/wp-json/elio/v1/`. The editor and the settings page use the same routes.

| Route | Method | Who can call it |
| --- | --- | --- |
| `/weather-forecast` | GET | Users who can edit posts, or anyone with the signature of a rendered block |
| `/geocoding` | GET | Users who can edit posts |
| `/condition-icon-collections` | GET | Users who can edit posts |
| `/weather-forecast/providers` | GET | Users who can edit posts |
| `/providers` | GET | Administrators (`manage_options`) |
| `/providers/{slug}/credentials` | POST | Administrators |
| `/cache/purge` | POST | Administrators |

## `GET /weather-forecast`

The weather forecast of a location: its current conditions and its hourly and daily forecasts.

| Parameter | Type | Description |
| --- | --- | --- |
| `latitude` | number | Required. |
| `longitude` | number | Required. |
| `provider` | string | Slug of the provider. Default: the provider of the site. |
| `units` | string | `metric` or `imperial`. Default: the unit system of the site. |
| `icon_collections` | array | Collections the items name their icon in. Default: the collection of the site. |
| `signature` | string | Signature issued with the rendered block. Required for anonymous requests. |

A Weather block on a page signs the requests of its location, provider and units, so that its visitors can refresh it without being logged in: the endpoint cannot be used to ask the provider about any other location. For a headless site, the [`elio_blocks/weather_forecast_public_access`](../reference/hooks.md#elio_blocksweather_forecast_public_access) filter opens it to unsigned requests; put your own rate limiting in front of it.

Errors: 400 for invalid coordinates, 404 `elio_blocks_provider_not_found`, 502 when the provider fails (its message is never passed on), 503 `elio_blocks_provider_not_configured` when a credential it requires is not set.

## `GET /geocoding`

Locations matching a name, for the location search of the Weather block.

| Parameter | Type | Description |
| --- | --- | --- |
| `search` | string | Location search query: a city name, a postal code… |
| `limit` | integer | Maximum number of results. Default 10. |

## `GET /condition-icon-collections`

The registered icon collections, each with its label, its description, its stroke width, the conditions it has an icon for, and six icons to preview it.

## `GET /weather-forecast/providers` and `GET /providers`

The providers that serve the weather forecast (slug, label, whether it is the default one, attribution), and every registered provider with its credentials. The value of a secret credential never leaves the server: only whether it is set.

## `POST /providers/{slug}/credentials`

Saves the credentials of a provider: a `credentials` object of values by credential name. An empty value forgets the saved one. Only the credentials the provider declares are saved.

## `POST /cache/purge`

Deletes the cached weather forecasts and location searches.
