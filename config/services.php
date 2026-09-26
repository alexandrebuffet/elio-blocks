<?php

use ElioBlocks\Vendor\Symfony\Component\DependencyInjection\ContainerBuilder;
use ElioBlocks\Vendor\Symfony\Component\DependencyInjection\Reference;
use ElioBlocks\BlockEditor\Hooks\EnqueueBlockEditorAssets;
use ElioBlocks\Blocks\Hooks\RegisterCommonStyleAsset;
use ElioBlocks\Blocks\Hooks\RegisterBlockCategories;
use ElioBlocks\Blocks\Hooks\RegisterBlockTypes;
use ElioBlocks\Weather\Condition\Icons\ConditionIconCollectionResolver;
use ElioBlocks\Weather\Condition\Icons\ConditionIconsRegistry;
use ElioBlocks\Weather\Condition\Icons\Hooks\RegisterConditionIcons;
use ElioBlocks\Contracts\Cache\CacheInterface;
use ElioBlocks\Contracts\Http\HttpClientInterface;
use ElioBlocks\Contracts\Security\SecretInterface;
use ElioBlocks\Interactivity\Blocks\Report\DerivedState;
use ElioBlocks\Interactivity\Blocks\Report\IconSprite;
use ElioBlocks\Interactivity\Blocks\Report\DirectivesHelper;
use ElioBlocks\Interactivity\Blocks\Report\Hooks\LinkConditionIcons;
use ElioBlocks\Interactivity\Blocks\Report\Hooks\PreloadWeatherForecast;
use ElioBlocks\Interactivity\Blocks\Report\ReportContext;
use ElioBlocks\Provider\Hooks\RegisterProviders;
use ElioBlocks\Provider\ProviderRegistry;
use ElioBlocks\RestApi\Endpoints\WeatherForecastController;
use ElioBlocks\RestApi\Endpoints\ConditionIconCollectionsController;
use ElioBlocks\RestApi\Endpoints\GeocodingController;
use ElioBlocks\RestApi\Endpoints\ProvidersController;
use ElioBlocks\RestApi\Endpoints\WeatherForecastProvidersController;
use ElioBlocks\RestApi\Hooks\RegisterRestApiRoutes;
use ElioBlocks\Settings\Hooks\RegisterGlobalSettings;
use ElioBlocks\Settings\Hooks\RegisterOptionsPage;
use ElioBlocks\Settings\PluginSettings;
use ElioBlocks\WeatherForecast\WeatherForecastPresenter;
use ElioBlocks\WeatherForecast\WeatherForecastProviderRegistry;
use ElioBlocks\WeatherForecast\WeatherForecastRequestSigner;
use ElioBlocks\WeatherForecast\WeatherForecastService;
use ElioBlocks\WeatherForecast\Hooks\RegisterWeatherForecastProviders;
use ElioBlocks\WeatherForecast\OpenMeteoWeatherForecastProvider;
use ElioBlocks\WeatherForecast\OpenMeteoWeatherForecastResponseNormalizer;
use ElioBlocks\Weather\Units\UnitsConversionService;
use ElioBlocks\Weather\Geocoding\GeocodingService;
use ElioBlocks\Weather\Geocoding\OpenMeteoGeocodingProvider;
use ElioBlocks\RestApi\Hooks\RegisterCacheApi;
use ElioBlocks\WordPress\Cache\TransientCache;
use ElioBlocks\WordPress\Http\WpHttpClient;
use ElioBlocks\WordPress\Security\SaltSecret;

// Exit if called directly.
if ( ! defined( 'ABSPATH' ) ) {
	die;
}

return static function ( ContainerBuilder $container ): void {
	// Explicit hook tags avoid Symfony's instanceof autoconfiguration pass, which
	// unserializes Definition with hardcoded byte offsets that break under PHP-Scoper.

	// -------------------------------------------------------------------------
	// Settings
	// -------------------------------------------------------------------------

	$container->register( PluginSettings::class )->setPublic( true );

	$container->register( TransientCache::class )
		->setArguments( array( TransientCache::PREFIX, new Reference( PluginSettings::class ) ) )
		->setPublic( true );
	$container->setAlias( CacheInterface::class, TransientCache::class )->setPublic( true );

	$container->register( RegisterGlobalSettings::class )
		->addTag( 'elio_blocks.hookable' )
		->setPublic( true );

	$container->register( RegisterOptionsPage::class )
		->setArguments( array( ELIO_BLOCKS_PLUGIN_PATH, ELIO_BLOCKS_PLUGIN_URL, ELIO_BLOCKS_VERSION ) )
		->addTag( 'elio_blocks.hookable' )
		->setPublic( true );

	// -------------------------------------------------------------------------
	// Icons
	// -------------------------------------------------------------------------

	$container->register( ConditionIconsRegistry::class )
		->setPublic( true );

	$container->register( ConditionIconCollectionResolver::class )
		->setArguments( array( new Reference( ConditionIconsRegistry::class ), new Reference( PluginSettings::class ) ) )
		->setPublic( true );

	$container->register( RegisterConditionIcons::class )
		->setArguments(
			array(
				new Reference( ConditionIconsRegistry::class ),
				ELIO_BLOCKS_PLUGIN_PATH . 'build/weather-condition-icons/',
			)
		)
		->addTag( 'elio_blocks.hookable' )
		->setPublic( true );

	// -------------------------------------------------------------------------
	// HTTP / Cache
	// -------------------------------------------------------------------------

	$container->register( WpHttpClient::class )
		->setArguments( array( ELIO_BLOCKS_VERSION ) )
		->setPublic( true );
	$container->setAlias( HttpClientInterface::class, WpHttpClient::class )->setPublic( true );

	$container->register( SaltSecret::class )->setPublic( true );
	$container->setAlias( SecretInterface::class, SaltSecret::class )->setPublic( true );

	$container->register( RegisterCacheApi::class )
		->setArguments( array( new Reference( CacheInterface::class ) ) )
		->addTag( 'elio_blocks.hookable' )
		->setPublic( true );

	// -------------------------------------------------------------------------
	// Providers
	// -------------------------------------------------------------------------

	$container->register( ProviderRegistry::class )
		->setPublic( true );

	$container->register( RegisterProviders::class )
		->setArguments( array( new Reference( ProviderRegistry::class ) ) )
		->addTag( 'elio_blocks.hookable' )
		->setPublic( true );

	// -------------------------------------------------------------------------
	// Weather
	// -------------------------------------------------------------------------

	$container->register( OpenMeteoWeatherForecastResponseNormalizer::class )->setPublic( true );

	$container->register( UnitsConversionService::class )->setPublic( true );

	$container->register( OpenMeteoWeatherForecastProvider::class )
		->setArguments( array( new Reference( HttpClientInterface::class ), new Reference( OpenMeteoWeatherForecastResponseNormalizer::class ) ) )
		->setPublic( true );

	$container->register( WeatherForecastProviderRegistry::class )
		->setArguments( array( new Reference( ProviderRegistry::class ) ) )
		->setPublic( true );

	$container->register( RegisterWeatherForecastProviders::class )
		->setArguments(
			array(
				new Reference( WeatherForecastProviderRegistry::class ),
				new Reference( OpenMeteoWeatherForecastProvider::class ),
			)
		)
		->addTag( 'elio_blocks.hookable' )
		->setPublic( true );

	$container->register( WeatherForecastPresenter::class )
		->setArguments(
			array(
				new Reference( ConditionIconsRegistry::class ),
				new Reference( UnitsConversionService::class ),
			)
		);

	$container->register( WeatherForecastService::class )
		->setArguments(
			array(
				new Reference( WeatherForecastProviderRegistry::class ),
				new Reference( CacheInterface::class ),
				new Reference( WeatherForecastPresenter::class ),
				new Reference( PluginSettings::class ),
			)
		)
		->setPublic( true );

	$container->register( WeatherForecastRequestSigner::class )
		->setArguments( array( new Reference( SecretInterface::class ) ) )
		->setPublic( true );

	$container->register( OpenMeteoGeocodingProvider::class )
		->setArguments( array( new Reference( HttpClientInterface::class ) ) )
		->setPublic( true );

	$container->register( GeocodingService::class )
		->setArguments( array( new Reference( OpenMeteoGeocodingProvider::class ), new Reference( CacheInterface::class ) ) )
		->setPublic( true );

	// -------------------------------------------------------------------------
	// REST API
	// -------------------------------------------------------------------------

	$container->register( WeatherForecastController::class )
		->setArguments(
			array(
				new Reference( WeatherForecastService::class ),
				new Reference( PluginSettings::class ),
				new Reference( WeatherForecastRequestSigner::class ),
				new Reference( ConditionIconCollectionResolver::class ),
			)
		)
		->setPublic( true );

	$container->register( ConditionIconCollectionsController::class )
		->setArguments( array( new Reference( ConditionIconsRegistry::class ), new Reference( PluginSettings::class ) ) )
		->setPublic( true );

	$container->register( GeocodingController::class )
		->setArguments( array( new Reference( GeocodingService::class ) ) )
		->setPublic( true );

	$container->register( ProvidersController::class )
		->setArguments( array( new Reference( ProviderRegistry::class ), new Reference( PluginSettings::class ) ) )
		->setPublic( true );

	$container->register( WeatherForecastProvidersController::class )
		->setArguments( array( new Reference( WeatherForecastProviderRegistry::class ), new Reference( PluginSettings::class ) ) )
		->setPublic( true );

	$container->register( RegisterRestApiRoutes::class )
		->setArguments(
			array(
				new Reference( WeatherForecastController::class ),
				new Reference( ConditionIconCollectionsController::class ),
				new Reference( GeocodingController::class ),
				new Reference( ProvidersController::class ),
				new Reference( WeatherForecastProvidersController::class ),
			)
		)
		->addTag( 'elio_blocks.hookable' )
		->setPublic( true );

	// -------------------------------------------------------------------------
	// Interactivity
	// -------------------------------------------------------------------------

	$container->register( ReportContext::class )->setPublic( true );

	// Condition icons of the page: added by condition-icon blocks, printed by report blocks.
	$container->register( IconSprite::class )->setPublic( true );

	$container->register( DerivedState::class );

	$container->register( DirectivesHelper::class )
		->setArguments(
			array(
				new Reference( WeatherForecastService::class ),
				new Reference( PluginSettings::class ),
				new Reference( WeatherForecastRequestSigner::class ),
				new Reference( DerivedState::class ),
				new Reference( ConditionIconCollectionResolver::class ),
			)
		)
		->setPublic( true );

	$container->register( LinkConditionIcons::class )
		->addTag( 'elio_blocks.hookable' )
		->setPublic( true );

	$container->register( PreloadWeatherForecast::class )
		->setArguments( array(
			new Reference( WeatherForecastService::class ),
			new Reference( PluginSettings::class ),
			new Reference( ReportContext::class ),
			new Reference( ConditionIconCollectionResolver::class ),
		) )
		->addTag( 'elio_blocks.hookable' )
		->setPublic( true );

	// -------------------------------------------------------------------------
	// Blocks
	// -------------------------------------------------------------------------

	$container->register( RegisterCommonStyleAsset::class )
		->addTag( 'elio_blocks.hookable' )
		->setPublic( true );

	$container->register( EnqueueBlockEditorAssets::class )
		->setArguments( array( ELIO_BLOCKS_PLUGIN_PATH, ELIO_BLOCKS_PLUGIN_URL ) )
		->addTag( 'elio_blocks.hookable' )
		->setPublic( true );

	$container->register( RegisterBlockCategories::class )
		->addTag( 'elio_blocks.hookable' )
		->setPublic( true );

	$container->register( RegisterBlockTypes::class )
		->addTag( 'elio_blocks.hookable' )
		->setPublic( true );
};
