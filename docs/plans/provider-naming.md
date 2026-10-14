# Naming the two levels of a provider

Status: decided on 2026-10-14, the recommendation below (adapter), renamed on branch fix/provider-naming. Written 2026-10-10 for the open question of the tides plan (`docs/plans/tides.md` on branch `feat/tides`).

## The problem

Elio registers two things with the same word:

```php
elio_blocks_register_provider( 'open-meteo', array( 'label' => …, 'credentials' => …, 'attribution' => … ) );
elio_blocks_register_weather_forecast_provider( 'open-meteo', new OpenMeteoWeatherForecastProvider() );
```

The first is the organization: its name, the credentials the site identifies itself with, the credit its licence asks for. The second is how that organization serves one domain (the weather forecast; tides next). Read in a row, the two calls look like two providers. `CLAUDE.md` already calls the second one an *adapter* in prose ("a provider serves it through one adapter") while the code says `…Provider`.

## What others do

Checked on 2026-10-10.

### WordPress core

Class names in the `wp-includes/` installed here: **0** `Adapter`, 0 `Gateway`, 0 `Integration`, 0 `Driver`; 9 `Provider`, 6 `Service`, 5 `Handler`, 3 `Transport`. Core never models "organization × domain": it names each implementation by its role and attaches it to a parent by slug.

| Core API | The parent | The implementation, named by role |
|---|---|---|
| `wp_oembed_add_provider()` | — | provider (the organization and its endpoint) |
| `wp_embed_register_handler()` | — | handler |
| `WP_Image_Editor_GD`, `WP_Image_Editor_Imagick` | — | image editor |
| `Requests\Transport\Curl`, `Fsockopen` | — | transport |
| `WP_Filesystem_Direct`, `_FTPext`, `_SSH2` | — | filesystem method |
| `register_block_bindings_source()` | — | source (the word `CLAUDE.md` forbids for this reason) |
| `wp_register_icon_collection()` then `wp_register_icon( 'collection/name' )` | collection | icon |
| `register_block_type()` then `register_block_style( 'core/quote', … )` | block | style |

Two-level registrations attach the child to the parent by slug, and the child is named by what it is (an icon, a style), never with a structural word.

### WordPress plugins

- **WP Mail SMTP** (`src/Providers/`): one folder per organization (`Gmail`, `Sendgrid`, `Postmark`…), each holding `Mailer.php`, `Options.php`, `Auth.php`, `Logger.php`, over `MailerAbstract`, `OptionsAbstract`, `AuthAbstract` and a `Loader`. The organization is the *provider*; what sends mail through it is the *mailer*; its settings are *options*; its credentials *auth*. The exact split Elio has, with a role noun for the second level.
- **WP Offload Media** (`classes/providers/`): `provider.php` (the organization: AWS, DigitalOcean, GCP), then `storage/storage-provider.php` with `aws-provider.php`, `digitalocean-provider.php`, `gcp-provider.php`, and `delivery/` likewise. The second level keeps the word *provider*, qualified by the domain: *storage provider*, *delivery provider*. Elio's current naming (`OpenMeteoWeatherForecastProvider`) follows this.
- **WooCommerce** (`includes/abstracts/`): `WC_Payment_Gateway`, `WC_Shipping_Method`, `WC_Log_Handler`, `WC_Address_Provider`, `WC_Integration` (a third-party service with a settings panel), `WC_Settings_API`. Role nouns per domain; "provider" when no better noun exists (addresses).

### Outside WordPress

- **Symfony Mailer**: mail goes through a *transport*; a third-party service is a *provider*, shipped as a *bridge* package (`symfony/mailgun-mailer`), configured by a DSN carrying the key (`mailgun+api://KEY:DOMAIN@default`).
- **Laravel Mail**: `config/mail.php` lists *mailers*, each with a *transport* (the docs say "drivers / transports"); the third-party credentials live apart in `config/services.php` ("After configuring your application's default mailer, add the following options to your `config/services.php`"). The organization's credentials and the per-domain implementation are two files, as Elio's provider and adapter are two registrations.
- **WordPress php-ai-client** (`WordPress/php-ai-client`): *providers* by id (`'openai'`, `'google'`, `GoogleProvider`), each exposing *models* that declare *capabilities* (`CapabilityEnum::embeddingGeneration()`…). Organization, then one object per capability, named by its content.
- **Home Assistant**: an *integration* per service, "made up of a component (the base logic) and platforms", one platform per domain (`weather`, `sensor`).
- Libraries use *adapter* for exactly this role: Flysystem (`AwsS3V3Adapter`), Symfony Cache (`RedisAdapter`), HTTPlug (`php-http/guzzle7-adapter`), Laravel (`FilesystemAdapter`).

## Reading

1. **"Provider" for the organization is right.** Plain English, WordPress core (oEmbed providers), WP Mail SMTP, WP Offload Media, WPForms (its marketing "providers"), php-ai-client, the industry ("weather data provider"). Renaming it (`service`, `integration`, `provider_setting`) would fight all of that, and touch the settings page, the REST routes (`/providers`), the store, the exceptions, the attribution block and the readme. `register_provider_setting` would also describe one consequence of the call (the settings card) and miss the label and the attribution.
2. **The second level is the one to rename**, and WordPress gives two ways:
   - **a role noun per domain** (mailer, gateway, image editor, transport): `TidePredictor` is natural (XTide calls itself a "tide predictor", NOAA and SHOM publish "tide predictions"), `Geocoder` too; `WeatherForecaster` is weaker (in English a forecaster is the meteorologist), and air quality, weather history or astronomy have no obvious noun. Uneven across domains.
   - **"provider" qualified by the domain** (storage provider, address provider, weather data provider): the status quo. Idiomatic, but it is what reads as two providers in a row.
3. **"Adapter"** is not WordPress vocabulary: 0 occurrences in core and in the plugins installed here. WordPress has no word here because core never separates the organization from what it serves. Any PHP developer knows the word from Flysystem, Symfony and Laravel, it says what the class does (adapts Open-Meteo to Elio's weather forecast), and one word covers every future domain.

## Recommendation

Keep `provider` for the organization, say `adapter` for how it serves a domain:

| Today | Proposed |
|---|---|
| `elio_blocks_register_weather_forecast_provider()` | `elio_blocks_register_weather_forecast_adapter()` |
| `WeatherForecastProviderInterface` | `WeatherForecastAdapterInterface` |
| `WeatherForecastProviderRegistry` | `WeatherForecastAdapterRegistry` |
| `OpenMeteoWeatherForecastProvider` | `OpenMeteoWeatherForecastAdapter` |
| `RegisterWeatherForecastProviders` (hook) | `RegisterWeatherForecastAdapters` |
| `OpenMeteoGeocodingProvider` | `OpenMeteoGeocodingAdapter` |
| planned `elio_blocks_register_tide_provider()` | `elio_blocks_register_tide_adapter()` |

Everything else keeps "provider" and keeps meaning the organization, so it stays as is: `ProviderRegistry`, `Provider`, `ProviderCredential`, `ProviderAttribution`, `ProviderNotFound` / `ProviderUnavailable` / `ProviderNotConfigured`, `getDefaultWeatherForecastProvider()` (a provider slug), `/providers` and `/weather-forecast/providers` (lists of organizations), `getWeatherForecastProviders()`, the provider cards of the settings page, `elio/reportProvider`, `elio/provider-attribution`. The rename stays surgical: the per-domain identifiers only, plus `PublicApiTest`, the `elio_blocks_init` docblock, the readme and the vocabulary of `CLAUDE.md`.

The `elio_blocks_init` example then reads:

```php
add_action( 'elio_blocks_init', function () {
    elio_blocks_register_provider( 'my-provider', array(
        'label'       => 'My Provider',
        'credentials' => array( 'api_key' => array( 'label' => __( 'API Key', 'my-plugin' ), 'required' => true, 'secret' => true ) ),
    ) );
    elio_blocks_register_weather_forecast_adapter( 'my-provider', new MyWeatherForecastAdapter() );
    elio_blocks_register_tide_adapter( 'my-provider', new MyTideAdapter() );
} );
```

Runner-up, if the WordPress feel matters more than uniformity: role nouns per domain (`elio_blocks_register_tide_predictor()`, `HarmonicTidePredictor`), accepting `WeatherForecaster` for the weather. Either way, the pure computation class of the tides plan (`HarmonicPredictor`, no WordPress) keeps its role name; the adapter wraps it.

## Sources

- WP Mail SMTP, `src/Providers/`: https://github.com/awesomemotive/WP-Mail-SMTP/tree/master/src/Providers
- WP Offload Media, `classes/providers/`: https://github.com/deliciousbrains/wp-amazon-s3-and-cloudfront/tree/master/classes/providers
- WooCommerce abstracts: https://github.com/woocommerce/woocommerce/tree/trunk/plugins/woocommerce/includes/abstracts
- WordPress php-ai-client: https://github.com/WordPress/php-ai-client
- Symfony Mailer: https://symfony.com/doc/current/mailer.html
- Laravel Mail: https://laravel.com/docs/12.x/mail
- Home Assistant architecture: https://developers.home-assistant.io/docs/architecture_components/
