---
title: Weather data providers
sidebar_label: Providers
---

A provider is an organization the data comes from, such as Open-Meteo, the provider built into the plugin. Register your own to show the weather forecast of another service: it then appears in the settings and in the Provider setting of the Weather block.

A provider holds:

- its slug and its label;
- its credentials, the values it identifies the site with (an API key, an account, a contact address), which the settings page asks for;
- its attribution, the credit its license asks for wherever its data is shown, which the Provider Attribution block prints;
- its adapters, one for each kind of data it serves: a `WeatherForecastAdapterInterface` for the weather forecast.

## Register a provider

Register it on the [`elio_blocks_init`](../reference/hooks.md#elio_blocks_init) action, with [`elio_blocks_register_provider()`](../reference/functions.md#elio_blocks_register_provider):

```php
use ElioBlocks\Provider\Provider;
use ElioBlocks\Provider\ProviderAttribution;
use ElioBlocks\Provider\ProviderCredential;

add_action( 'elio_blocks_init', function () {
	elio_blocks_register_provider(
		new Provider(
			'my-provider',
			'My Provider',
			array(
				new ProviderCredential( 'api_key', __( 'API Key', 'my-plugin' ), required: true, secret: true ),
			),
			new ProviderAttribution( 'https://my-provider.example/', 'CC BY 4.0', 'https://creativecommons.org/licenses/by/4.0/' ),
			array( new My_Weather_Forecast_Adapter() ),
		)
	);
} );
```

The registries are locked right after this action: a registration made anywhere else, like an invalid one, is refused with a `_doing_it_wrong()` notice.

While a `required` credential is not set, the provider is not asked, and the weather forecast endpoint answers 503.

## Write the adapter

The adapter fetches the weather forecast. It implements [`WeatherForecastAdapterInterface`](../reference/classes.md#weatherforecastadapterinterface): one method, `fetch()`, which gets the coordinates, the unit system and the credentials that are set, and returns the normalized weather forecast.

```php
use ElioBlocks\WeatherForecast\WeatherForecastAdapterInterface;
use ElioBlocks\WeatherForecast\Exception\ProviderUnavailable;

final class My_Weather_Forecast_Adapter implements WeatherForecastAdapterInterface {
	public function fetch( float $latitude, float $longitude, string $units, array $args = array() ): array {
		$response = wp_remote_get(
			add_query_arg(
				array(
					'lat' => $latitude,
					'lon' => $longitude,
					'key' => $args['credentials']['api_key'],
				),
				'https://api.my-provider.example/forecast'
			)
		);
		if ( is_wp_error( $response ) || 200 !== wp_remote_retrieve_response_code( $response ) ) {
			throw new ProviderUnavailable( 'My Provider did not answer.' );
		}

		return my_provider_normalize( json_decode( wp_remote_retrieve_body( $response ), true ) );
	}
}
```

The adapter of Open-Meteo, [`OpenMeteoWeatherForecastAdapter`](https://github.com/alexandrebuffet/elio-blocks/blob/main/includes/WeatherForecast/OpenMeteoWeatherForecastAdapter.php), and its [`OpenMeteoWeatherForecastResponseNormalizer`](https://github.com/alexandrebuffet/elio-blocks/blob/main/includes/WeatherForecast/OpenMeteoWeatherForecastResponseNormalizer.php) show the normalized data and how to read an answer into it. [`WeatherForecast`](https://github.com/alexandrebuffet/elio-blocks/blob/main/includes/WeatherForecast/WeatherForecast.php) checks what the adapter returns: an answer it refuses throws `InvalidProviderResponse`.

Answers are cached by the plugin, for the duration set in the settings: the adapter does not cache them itself.
