<?php

namespace ElioBlocks\Interactivity\Blocks\Report;

use ElioBlocks\Settings\PluginSettings;
use ElioBlocks\Weather\Condition\Icons\ConditionIconCollectionResolver;
use ElioBlocks\Weather\Coordinates;
use ElioBlocks\WeatherForecast\WeatherForecastRequestSigner;
use ElioBlocks\WeatherForecast\WeatherForecastService;

// Exit if called directly.
if (! defined('ABSPATH')) {
    die;
}

/**
 * Builds the Interactivity API state and block context for the report block SSR.
 */
class DirectivesHelper
{
    /**
     * Sections of the weather forecast the report block puts in the page.
     *
     * The hourly and daily sections are left out: their rows are rendered by the
     * server and travel once, in the context of the forecast list showing them.
     * The browser gets the full weather forecast with its first refresh.
     */
    private const PAGE_SECTIONS = array( 'meta', 'current', 'icons' );

    /**
     * Constructor.
     *
     * @param WeatherForecastService          $weatherForecastService Weather forecast data provider.
     * @param PluginSettings                  $settings               Plugin settings.
     * @param WeatherForecastRequestSigner    $signer                 Signs the refresh request the client will send.
     * @param DerivedState                    $derivedState           Server-side twin of the view.js getters.
     * @param ConditionIconCollectionResolver $iconCollections        Collections the report and its blocks show.
     */
    public function __construct(
        private WeatherForecastService $weatherForecastService,
        private PluginSettings $settings,
        private WeatherForecastRequestSigner $signer,
        private DerivedState $derivedState,
        private ConditionIconCollectionResolver $iconCollections,
    ) {
    }

    /**
     * Retrieves the global Interactivity API state for the elio/weather-report store.
     *
     * No nonce here: the weather forecast endpoint authenticates anonymous
     * requests with the per-block signature, which stays valid in cached pages.
     *
     * The derived getters let `data-wp-text="state.xxx"` print values in the
     * server-rendered HTML; WordPress does not send closures to the browser.
     *
     * @return array<string, mixed>
     */
    public function getState(): array
    {
        return $this->derivedState->getters() + $this->settings->getRefreshSettings() + array(
            'weatherForecastUrl' => rest_url('elio/v1/weather-forecast'),
        );
    }

    /**
     * Returns what the page keeps of a weather forecast for the browser.
     *
     * Icons keep their style only: their SVG is a symbol printed once in the
     * page (IconSprite), which the condition-icon blocks point at.
     *
     * @param array<string, mixed> $weatherForecast Presented weather forecast.
     * @return array<string, mixed>
     */
    private function pageData(array $weatherForecast): array
    {
        $data = array_intersect_key($weatherForecast, array_flip(self::PAGE_SECTIONS));

        if (isset($data['icons']) && is_array($data['icons'])) {
            $data['icons'] = array_map(
                static fn(array $icon): array => array( 'style' => $icon['style'] ?? 'fill' ),
                $data['icons']
            );
        }

        return $data;
    }

    /**
     * Retrieves the per-block context, including an optional SSR weather
     * forecast fetch.
     *
     * When coordinates are available the weather forecast is fetched
     * server-side and stored in context.query. The client works out from
     * meta.fetched_at when the server will have newer data, and from
     * query.requestedAt (the render time, set even when the request failed)
     * when its last request was.
     *
     * @param \WP_Block $block Report block instance.
     * @return array<string, mixed>
     */
    public function getContext(\WP_Block $block): array
    {
        $attributes = $block->attributes ?? array();
        $location   = isset($attributes['location']) && is_array($attributes['location']) ? $attributes['location'] : array();
        $provider   = ! empty($attributes['provider']) ? (string) $attributes['provider'] : '';
        $blockUnits = ! empty($attributes['units']) ? (string) $attributes['units'] : '';

        // Resolve effective unit system: block attribute → global setting.
        $effectiveUnits = $blockUnits ?: $this->settings->getUnitSystem();
        $unitSettings   = $this->settings->getUnitOverrides();
        $coordinates    = Coordinates::tryFrom($location['latitude'] ?? null, $location['longitude'] ?? null);
        // The parsed block holds the inner blocks; a block built without one (tests) has its attributes only.
        $parsedBlock     = ! empty($block->parsed_block) ? $block->parsed_block : array( 'attrs' => $attributes );
        $iconCollections = $this->iconCollections->usedBy($parsedBlock);

        $queryData   = null;
        $requestedAt = null;
        $queryError  = '';

        if (null !== $coordinates) {
            $requestedAt = (int) ( microtime(true) * 1000 );

            try {
                $queryData = $this->weatherForecastService->getWeatherForecast(
                    $coordinates,
                    $provider ?: $this->settings->getDefaultWeatherForecastProvider(),
                    $effectiveUnits,
                    $unitSettings,
                    $iconCollections
                );
            } catch (\Throwable $e) {
                // The upstream message may expose network details: keep it out of the page.
                $queryError = __('Unable to fetch weather forecast data.', 'elio-blocks');
            }
        }

        return array(
            'location'        => $location,
            'provider'        => $provider,
            'units'           => $effectiveUnits,
            'unitSettings'    => $unitSettings,
            'iconCollections' => $iconCollections,
            'signature'       => null !== $coordinates ? $this->signer->sign($coordinates, $provider, $effectiveUnits) : '',
            'item'            => $queryData['current'] ?? null,
            'query'           => array(
                'isLoading'   => false,
                'data'        => null !== $queryData ? $this->pageData($queryData) : null,
                'error'       => $queryError,
                'requestedAt' => $requestedAt,
            ),
        );
    }
}
