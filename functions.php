<?php
/**
 * Elio Blocks public API: registration functions for providers and condition
 * icons, called on the elio_blocks_init action, and the functions the
 * render.php of the blocks read what they print with.
 *
 * @package ElioBlocks
 */

use ElioBlocks\Plugin;
use ElioBlocks\Provider\ProviderRegistry;
use ElioBlocks\Interactivity\Blocks\Report\DirectivesHelper;
use ElioBlocks\Interactivity\Blocks\Report\IconSprite;
use ElioBlocks\Interactivity\Blocks\Report\ReportContext;
use ElioBlocks\WeatherForecast\WeatherForecastProviderInterface;
use ElioBlocks\WeatherForecast\WeatherForecastProviderRegistry;
use ElioBlocks\Weather\Condition\Icons\ConditionIconCollectionResolver;
use ElioBlocks\Weather\Condition\Icons\ConditionIconsRegistry;

if ( ! defined( 'ABSPATH' ) ) {
	die;
}

/**
 * Registers a provider: an organization the data comes from.
 *
 * Must be called on the 'elio_blocks_init' action, before what it serves is
 * registered (elio_blocks_register_weather_forecast_provider()). A provider
 * the registry refuses (malformed slug or arguments, duplicate slug, registry
 * already locked) gets a _doing_it_wrong() notice, as register_block_type()
 * does.
 *
 * A provider that needs to identify the site (an API key, an account, a
 * contact address) declares its credentials: the settings page gives it a card
 * with their fields, and its providers get their values in fetch().
 *
 * @param string               $slug Unique identifier: lowercase letters, digits and hyphens.
 * @param array<string, mixed> $args {
 *     @type string $label       Name shown to people. Required.
 *     @type array  $credentials What identifies the site to it, by name (lowercase letters, digits and
 *                               underscores; each can also be set with the constant
 *                               ELIO_BLOCKS_{SLUG}_{NAME}, uppercased, hyphens as underscores). Each is
 *                               an array of:
 *                               'label' (string, required),
 *                               'description' (string, plain text shown under the field),
 *                               'required' (bool, default false: the provider is not asked while it
 *                               is not set),
 *                               'secret' (bool, default false: typed hidden, never sent back to the
 *                               browser). Default none.
 * }
 * @return bool True if the provider was registered, false otherwise.
 */
function elio_blocks_register_provider( string $slug, array $args ): bool {
	return Plugin::instance()->container()->get( ProviderRegistry::class )->register( $slug, $args );
}

/**
 * Registers how a provider serves the weather forecast.
 *
 * Must be called on the 'elio_blocks_init' action, once the provider is
 * registered (elio_blocks_register_provider()). A registration the registry
 * refuses (provider not registered, already serving the weather forecast,
 * registry already locked) gets a _doing_it_wrong() notice, as
 * register_block_type() does.
 *
 * @param string                           $provider                  Slug of the provider.
 * @param WeatherForecastProviderInterface $weather_forecast_provider Fetches its weather forecast.
 * @return bool True if the weather forecast provider was registered, false otherwise.
 */
function elio_blocks_register_weather_forecast_provider( string $provider, WeatherForecastProviderInterface $weather_forecast_provider ): bool {
	return Plugin::instance()->container()->get( WeatherForecastProviderRegistry::class )->register( $provider, $weather_forecast_provider );
}

/**
 * Registers a condition icon collection, a namespace for icons.
 *
 * Must be called on the 'elio_blocks_init' action, before the icons of the collection.
 *
 * @param string               $slug Collection slug: lowercase letters, digits, hyphens, underscores.
 * @param array<string, mixed> $args {
 *     @type string $label       Required. Human-readable label, shown in the editor.
 *     @type string $description Optional. Human-readable description.
 * }
 * @return bool True if the collection was registered, false otherwise.
 */
function elio_blocks_register_condition_icon_collection( string $slug, array $args ): bool {
	return Plugin::instance()->container()->get( ConditionIconsRegistry::class )->registerCollection( $slug, $args );
}

/**
 * Unregisters a condition icon collection and its icons.
 *
 * Must be called on the 'elio_blocks_init' action.
 *
 * @param string $slug Collection slug.
 * @return bool True if the collection was unregistered, false otherwise.
 */
function elio_blocks_unregister_condition_icon_collection( string $slug ): bool {
	return Plugin::instance()->container()->get( ConditionIconsRegistry::class )->unregisterCollection( $slug );
}

/**
 * Registers a condition icon in a registered collection.
 *
 * Must be called on the 'elio_blocks_init' action.
 *
 * @param string               $name Qualified name, "collection/icon-name".
 * @param array<string, mixed> $args {
 *     @type string $content    SVG markup. Required unless file_path is given.
 *     @type string $file_path  Absolute path of an .svg file, read when the icon is first shown.
 *     @type string $label      Optional. Human-readable label.
 *     @type string $style      Optional. 'fill' (default) or 'stroke': a stroke icon takes the stroke width of the block.
 *     @type array  $conditions Optional. Conditions the icon represents: array( WMO condition slug (WmoConditionCodes),
 *                              'day'|'night'|'all' ) pairs. Each pair is represented by one icon per collection; a block shows no icon
 *                              for a condition its collection does not represent.
 * }
 * @return bool True if the icon was registered, false otherwise.
 */
function elio_blocks_register_condition_icon( string $name, array $args ): bool {
	return Plugin::instance()->container()->get( ConditionIconsRegistry::class )->registerIcon( $name, $args );
}

/**
 * Unregisters a condition icon.
 *
 * Must be called on the 'elio_blocks_init' action.
 *
 * @param string $name Qualified icon name.
 * @return bool True if the icon was unregistered, false otherwise.
 */
function elio_blocks_unregister_condition_icon( string $name ): bool {
	return Plugin::instance()->container()->get( ConditionIconsRegistry::class )->unregisterIcon( $name );
}

/**
 * Adds an icon to the sprite of the page, the symbols condition icons point at.
 *
 * Condition-icon blocks add the icons they show; the report block around them
 * prints the sprite (elio_blocks_render_icon_sprite()). An icon the page has
 * already is not printed again.
 *
 * @param string $name Qualified icon name.
 * @param string $svg  Sanitized SVG markup, the content of elio_blocks_get_condition_icon().
 * @return void
 */
function elio_blocks_add_icon_to_sprite( string $name, string $svg ): void {
	Plugin::instance()->container()->get( IconSprite::class )->add( $name, $svg );
}

/**
 * Returns the sprite of the icons added since the last call and not printed yet.
 *
 * For the report block, after its inner blocks rendered: printed before them,
 * the symbols reach the browser before the icons using them.
 *
 * @return string Hidden <svg> holding one <symbol> per icon, empty when there is none.
 */
function elio_blocks_render_icon_sprite(): string {
	return Plugin::instance()->container()->get( IconSprite::class )->render();
}

/**
 * Returns the state of the elio/weather-report store, for wp_interactivity_state().
 *
 * The weather forecast endpoint, how long a weather forecast stays fresh, the
 * refresh interval, and the derived values (state.*) the blocks of a report
 * print.
 *
 * @return array<string, mixed>
 */
function elio_blocks_get_weather_report_interactivity_state(): array {
	return Plugin::instance()->container()->get( DirectivesHelper::class )->getState();
}

/**
 * Returns the interactivity context of a weather report block (data-wp-context).
 *
 * Its location, provider and units, the signature of the requests its view
 * script sends, and its weather forecast, fetched now (or read from the cache).
 * Not the block context ($block->context) the report gives its inner blocks.
 *
 * @param WP_Block $block Weather report block being rendered.
 * @return array<string, mixed>
 */
function elio_blocks_get_weather_report_interactivity_context( WP_Block $block ): array {
	return Plugin::instance()->container()->get( DirectivesHelper::class )->getContext( $block );
}

/**
 * Returns the current conditions of the weather report being rendered.
 *
 * An item like the rows of elio_blocks_get_forecast_items() (temperature,
 * condition_icons…); null when the report has no weather forecast.
 *
 * @return array<string, mixed>|null
 */
function elio_blocks_get_current_conditions(): ?array {
	return Plugin::instance()->container()->get( ReportContext::class )->getCurrentItem();
}

/**
 * Returns the rows of a forecast list of the weather report being rendered.
 *
 * Hourly rows start at the hour in progress. Empty when the report has no
 * weather forecast.
 *
 * @param string $type  'daily' or 'hourly'.
 * @param int    $count Number of rows.
 * @return list<array<string, mixed>>
 */
function elio_blocks_get_forecast_items( string $type, int $count ): array {
	return Plugin::instance()->container()->get( ReportContext::class )->getForecastItems( $type, $count );
}

/**
 * Returns an icon of the weather report being rendered.
 *
 * Items point to their icon by qualified name, in condition_icons[ collection ].
 * Null when the weather forecast of the report has no such icon.
 *
 * @param string $name Qualified icon name ("elio/sun").
 * @return array{content: string, style: string}|null Sanitized SVG markup, and 'fill' or 'stroke'.
 */
function elio_blocks_get_condition_icon( string $name ): ?array {
	return Plugin::instance()->container()->get( ReportContext::class )->getIcon( $name );
}

/**
 * Returns the icon collection a condition-icon block shows.
 *
 * Its own, else the one of its report, else the one of the site, else the
 * plugin one ("elio"). A collection that is not registered counts as not chosen.
 *
 * @param string|null $block_collection  The iconCollection attribute of the block.
 * @param string|null $report_collection The elio/reportIconCollection block context.
 * @return string Collection slug.
 */
function elio_blocks_get_condition_icon_collection( ?string $block_collection, ?string $report_collection ): string {
	return Plugin::instance()->container()->get( ConditionIconCollectionResolver::class )->resolve( $block_collection, $report_collection );
}
