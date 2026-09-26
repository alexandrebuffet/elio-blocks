<?php

namespace ElioBlocks\WeatherForecast;

// Exit if called directly.
if (! defined('ABSPATH')) {
    die;
}

/**
 * Normalizes the raw Open-Meteo API response into the plugin's standard format.
 */
final class OpenMeteoWeatherForecastResponseNormalizer implements WeatherForecastResponseNormalizerInterface
{
    /**
     * Field map for current weather data.
     */
    private const CURRENT_FIELD_MAP = array(
        'time'                 => 'timestamp',
        'temperature_2m'       => 'temperature',
        'apparent_temperature' => 'temperature_feels_like',
        'relative_humidity_2m' => 'humidity',
        'weather_code'         => 'condition_code',
        'pressure_msl'         => 'pressure',
        'wind_speed_10m'       => 'wind_speed',
        'wind_direction_10m'   => 'wind_direction',
        'wind_gusts_10m'       => 'wind_gusts',
    );

    /**
     * Field map for hourly weather data.
     */
    private const HOURLY_FIELD_MAP = array(
        'time'                 => 'timestamp',
        'temperature_2m'       => 'temperature',
        'apparent_temperature' => 'temperature_feels_like',
        'relative_humidity_2m' => 'humidity',
        'weather_code'         => 'condition_code',
        'pressure_msl'         => 'pressure',
        'wind_speed_10m'       => 'wind_speed',
        'wind_direction_10m'   => 'wind_direction',
    );

    /**
     * Field map for daily weather data.
     */
    private const DAILY_FIELD_MAP = array(
        'time'                          => 'timestamp',
        'temperature_2m_max'            => 'temperature_max',
        'temperature_2m_min'            => 'temperature_min',
        'apparent_temperature_max'      => 'temperature_feels_like_max',
        'apparent_temperature_min'      => 'temperature_feels_like_min',
        'weather_code'                  => 'condition_code',
        'precipitation_sum'             => 'precipitation',
        'precipitation_probability_max' => 'precipitation_probability',
        'wind_speed_10m_max'            => 'wind_speed',
        'wind_gusts_10m_max'            => 'wind_gusts',
        'wind_direction_10m_dominant'   => 'wind_direction',
    );

    /**
     * Normalized fields holding a date or date-time local to the location.
     */
    private const TIME_FIELDS = array( 'timestamp', 'sunrise', 'sunset' );

    /**
     * Normalizes the Open-Meteo response into a standard format.
     *
     * @param array<string, mixed> $rawResponse Raw decoded JSON from the provider.
     * @param string               $units       Unit system used for the request ('metric'|'imperial').
     * @return array<string, mixed> Normalized weather forecast data.
     */
    public function normalize(array $rawResponse, string $units): array
    {
        $timezone = $this->resolveTimezone($rawResponse);

        // Conditions are not described here: the result is cached for every
        // visitor, and a description has a language. WeatherForecastPresenter
        // adds it per request.

        // Normalize current (flat object).
        $current            = $this->renameKeys($rawResponse['current'] ?? array(), self::CURRENT_FIELD_MAP);
        $current['sunrise'] = $rawResponse['daily']['sunrise'][0] ?? null;
        $current['sunset']  = $rawResponse['daily']['sunset'][0] ?? null;

        foreach (self::TIME_FIELDS as $field) {
            $current[ $field ] = $this->withOffset($current[ $field ] ?? null, $timezone);
        }

        // Hourly and daily come column-oriented (one array per field).
        $hourly = $this->renameKeys($rawResponse['hourly'] ?? array(), self::HOURLY_FIELD_MAP);
        $daily  = $this->renameKeys($rawResponse['daily'] ?? array(), self::DAILY_FIELD_MAP);

        return array(
            'meta'    => array(
                'latitude'  => $rawResponse['latitude'] ?? 0.0,
                'longitude' => $rawResponse['longitude'] ?? 0.0,
                'timezone'  => $rawResponse['timezone'] ?? '',
                'elevation' => $rawResponse['elevation'] ?? null,
                'provider'  => 'open-meteo',
                'units'     => $units,
            ),
            'current' => $current,
            'hourly'  => $this->columnsToRows($hourly, $timezone),
            'daily'   => $this->columnsToRows($daily, $timezone),
        );
    }

    /**
     * Resolves the timezone of the weather forecast location.
     *
     * The IANA name is preferred over utc_offset_seconds: the numeric offset is
     * the one in force today, and a daylight saving change can fall inside the
     * forecast window.
     *
     * @param array<string, mixed> $rawResponse Raw decoded JSON from the provider.
     */
    private function resolveTimezone(array $rawResponse): \DateTimeZone
    {
        try {
            return new \DateTimeZone((string) ( $rawResponse['timezone'] ?? '' ));
        } catch (\Exception $e) {
            $offset = (int) ( $rawResponse['utc_offset_seconds'] ?? 0 );

            return new \DateTimeZone(
                sprintf('%s%02d:%02d', $offset < 0 ? '-' : '+', intdiv(abs($offset), 3600), intdiv(abs($offset) % 3600, 60))
            );
        }
    }

    /**
     * Turns a local date or date-time of the location into ISO 8601 with offset.
     *
     * Open-Meteo answers "2026-07-01T14:00" in the location's local time. Without
     * an offset a browser reads it in the visitor's timezone and shifts every hour.
     *
     * @param mixed         $local    Local date ("2026-07-01") or date-time ("2026-07-01T14:00").
     * @param \DateTimeZone $timezone Timezone of the location.
     * @return string|null ISO 8601 date-time with offset, or null when the value is not a date.
     */
    private function withOffset(mixed $local, \DateTimeZone $timezone): ?string
    {
        if (! is_string($local) || '' === $local) {
            return null;
        }

        try {
            return ( new \DateTimeImmutable($local, $timezone) )->format(DATE_ATOM);
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Converts column-oriented weather forecast data to row-oriented items.
     *
     * @param array<string, mixed> $columns  Column-oriented data (one array per field).
     * @param \DateTimeZone        $timezone Timezone of the location, applied to time fields.
     * @return array<int, array<string, mixed>>
     */
    private function columnsToRows(array $columns, \DateTimeZone $timezone): array
    {
        $timestamps = $columns['timestamp'] ?? array();
        $rows       = array();

        foreach ($timestamps as $i => $_) {
            $row = array();
            foreach ($columns as $key => $values) {
                $row[ $key ] = is_array($values) ? ( $values[ $i ] ?? null ) : $values;
            }
            foreach (self::TIME_FIELDS as $field) {
                if (array_key_exists($field, $row)) {
                    $row[ $field ] = $this->withOffset($row[ $field ], $timezone);
                }
            }
            $rows[] = $row;
        }

        return $rows;
    }

    /**
     * Renames array keys using a field map.
     *
     * @param array<string, mixed>  $data     Source data.
     * @param array<string, string> $fieldMap Map of old key => new key.
     * @return array<string, mixed>
     */
    private function renameKeys(array $data, array $fieldMap): array
    {
        $result = array();

        foreach ($data as $key => $value) {
            $result[ $fieldMap[ $key ] ?? $key ] = $value;
        }

        return $result;
    }
}
