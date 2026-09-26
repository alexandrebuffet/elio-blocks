<?php

namespace ElioBlocks\Interactivity\Blocks\Report\Hooks;

use ElioBlocks\Contracts\HookInterface;
use ElioBlocks\Interactivity\Blocks\Report\ReportContext;
use ElioBlocks\Settings\PluginSettings;
use ElioBlocks\Weather\Condition\Icons\ConditionIconCollectionResolver;
use ElioBlocks\Weather\Coordinates;
use ElioBlocks\WeatherForecast\WeatherForecastService;

// Exit if called directly.
if (! defined('ABSPATH')) {
    die;
}

/**
 * Pre-fetches the weather forecast for elio/weather-report blocks via
 * render_block_context.
 *
 * render_block_context fires when a block is constructed, before its inner
 * blocks are rendered. By storing the weather forecast in ReportContext at this
 * point, inner blocks (condition-icon, forecast-template) can access it in
 * their render.php without issuing their own weather forecast requests.
 *
 * Multiple report blocks on the same page work correctly because WordPress
 * constructs inner blocks lazily: each report block's inner blocks are
 * constructed only when that specific report block renders, by which time
 * ReportContext holds the correct item for that block.
 */
class PreloadWeatherForecast implements HookInterface
{
    /**
     * Constructor.
     *
     * @param WeatherForecastService          $weatherForecastService Weather forecast data provider.
     * @param PluginSettings                  $settings               Plugin settings for default provider.
     * @param ReportContext                   $reportContext          Weather forecast shared with the inner blocks.
     * @param ConditionIconCollectionResolver $iconCollections        Collections the report and its blocks show.
     */
    public function __construct(
        private WeatherForecastService $weatherForecastService,
        private PluginSettings $settings,
        private ReportContext $reportContext,
        private ConditionIconCollectionResolver $iconCollections,
    ) {
    }

    /**
     * {@inheritDoc}
     */
    public function initHooks(): void
    {
        add_filter('render_block_context', array( $this, 'preloadForecast' ), 10, 2);
    }

    /**
     * Pre-fetches the weather forecast when a elio/weather-report block is
     * about to render.
     *
     * @param array<string, mixed> $context     Available block context.
     * @param array<string, mixed> $parsedBlock Parsed block data.
     * @return array<string, mixed> Unchanged context.
     */
    public function preloadForecast(array $context, array $parsedBlock): array
    {
        if ('elio/weather-report' !== ( $parsedBlock['blockName'] ?? '' )) {
            return $context;
        }

        $location    = $parsedBlock['attrs']['location'] ?? array();
        $coordinates = is_array($location)
            ? Coordinates::tryFrom($location['latitude'] ?? null, $location['longitude'] ?? null)
            : null;

        if (null === $coordinates) {
            $this->reportContext->setWeatherForecast(null);

            return $context;
        }

        $provider = (string) ( $parsedBlock['attrs']['provider'] ?? '' );
        $units    = (string) ( $parsedBlock['attrs']['units'] ?? '' );

        try {
            // Same provider, unit system and overrides as DirectivesHelper::getContext():
            // both share one fetch, and the rows of a forecast list show the same
            // units as the current conditions.
            $weatherForecast = $this->weatherForecastService->getWeatherForecast(
                $coordinates,
                $provider ?: $this->settings->getDefaultWeatherForecastProvider(),
                $units ?: $this->settings->getUnitSystem(),
                $this->settings->getUnitOverrides(),
                // The icons of every collection the report and its condition-icon blocks show.
                $this->iconCollections->usedBy($parsedBlock)
            );

            $this->reportContext->setWeatherForecast($weatherForecast);
        } catch (\Throwable $e) {
            $this->reportContext->setWeatherForecast(null);
        }

        return $context;
    }
}
