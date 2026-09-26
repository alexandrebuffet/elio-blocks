<?php

namespace ElioBlocks\WeatherForecast;

use ElioBlocks\WeatherForecast\Exception\InvalidProviderResponse;

// Exit if called directly.
if (! defined('ABSPATH')) {
    die;
}

/**
 * A weather forecast as a provider delivers it: current conditions, hourly
 * rows, daily rows.
 *
 * Providers are an extension point and return arrays. This object is where that
 * array is checked, once: past this point the cache, the REST API and the blocks
 * rely on its shape instead of re-checking it.
 *
 * Items stay maps: the fields a provider supports vary.
 *
 * @phpstan-type Item array<string, mixed>
 */
final class WeatherForecast
{
    /**
     * Constructor.
     *
     * @param array<string, mixed>       $meta    Location and provider metadata (timezone, units…).
     * @param array<string, mixed>|null  $current Current conditions.
     * @param list<array<string, mixed>> $hourly  Hourly rows.
     * @param list<array<string, mixed>> $daily   Daily rows.
     */
    private function __construct(
        private array $meta,
        private ?array $current,
        private array $hourly,
        private array $daily,
    ) {
    }

    /**
     * Creates a weather forecast from the array a provider returns, validating its sections.
     *
     * @param array<string, mixed> $data Normalized weather forecast returned by a provider.
     *
     * @throws InvalidProviderResponse If a section is not what it should be.
     */
    public static function fromArray(array $data): self
    {
        $meta    = $data['meta'] ?? array();
        $current = $data['current'] ?? null;

        if (! is_array($meta)) {
            throw new InvalidProviderResponse('Weather forecast "meta" must be a map.');
        }

        if (null !== $current && ! is_array($current)) {
            throw new InvalidProviderResponse('Weather forecast "current" must be a weather item.');
        }

        return new self($meta, $current, self::rows($data, 'hourly'), self::rows($data, 'daily'));
    }

    /**
     * Returns the rows of a section, checking each one is a weather item.
     *
     * @param array<string, mixed> $data    Normalized weather forecast.
     * @param string               $section 'hourly' or 'daily'.
     * @return list<array<string, mixed>>
     */
    private static function rows(array $data, string $section): array
    {
        $rows = $data[ $section ] ?? array();

        if (! is_array($rows)) {
            throw new InvalidProviderResponse(sprintf('Weather forecast "%s" must be a list of weather items.', esc_html($section)));
        }

        foreach ($rows as $row) {
            if (! is_array($row)) {
                throw new InvalidProviderResponse(sprintf('Weather forecast "%s" must be a list of weather items.', esc_html($section)));
            }
        }

        return array_values($rows);
    }

    /**
     * Returns the weather forecast stamped with the time the provider was asked
     * (meta.fetched_at).
     *
     * With the cache duration, it tells the browser when the server will have newer data.
     *
     * @param int $timestamp Unix timestamp.
     */
    public function withFetchedAt(int $timestamp): self
    {
        return new self(
            array( 'fetched_at' => gmdate(DATE_ATOM, $timestamp) ) + $this->meta,
            $this->current,
            $this->hourly,
            $this->daily,
        );
    }

    /**
     * Returns a weather forecast whose every weather item went through the
     * callback.
     *
     * @param callable(array<string, mixed>): array<string, mixed> $callback Receives and returns an item.
     */
    public function mapItems(callable $callback): self
    {
        return new self(
            $this->meta,
            null !== $this->current ? $callback($this->current) : null,
            array_map($callback, $this->hourly),
            array_map($callback, $this->daily),
        );
    }

    /**
     * Returns the weather forecast as an array.
     *
     * @return array{meta: array<string, mixed>, current: array<string, mixed>|null, hourly: list<array<string, mixed>>, daily: list<array<string, mixed>>}
     */
    public function toArray(): array
    {
        return array(
            'meta'    => $this->meta,
            'current' => $this->current,
            'hourly'  => $this->hourly,
            'daily'   => $this->daily,
        );
    }
}
