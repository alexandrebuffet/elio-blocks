<?php

namespace ElioBlocks\Weather\Units;

// Exit if called directly.
if (! defined('ABSPATH')) {
    die;
}

/**
 * Converts weather measurement values between units not handled natively by providers.
 *
 * Open-Meteo handles temperature (°C/°F), wind speed (km/h/mph), and precipitation (mm/in)
 * natively via its API parameters. This service handles the remaining conversions:
 *   - Wind speed → m/s, knots, Beaufort (from km/h or mph)
 *   - Pressure → inHg, mbar (from hPa)
 *   - Temperature → °C ↔ °F (cross-preset conversion)
 *   - Precipitation → mm ↔ in (cross-preset conversion)
 */
class UnitsConversionService
{
    /**
     * Beaufort scale thresholds in km/h (lower bound of each force level).
     *
     * @var list<int>
     */
    private const BEAUFORT_KMH = array( 1, 6, 12, 20, 29, 39, 50, 62, 75, 89, 103, 118 );

    /**
     * Converts a temperature value between units.
     *
     * @param float  $value Raw value.
     * @param string $from  Source unit: 'celsius' or 'fahrenheit'.
     * @param string $to    Target unit: 'celsius' or 'fahrenheit'.
     * @return float
     */
    public function convertTemperature(float $value, string $from, string $to): float
    {
        if ($from === $to) {
            return $value;
        }

        if ('celsius' === $from && 'fahrenheit' === $to) {
            return $value * 9 / 5 + 32;
        }

        if ('fahrenheit' === $from && 'celsius' === $to) {
            return ( $value - 32 ) * 5 / 9;
        }

        return $value;
    }

    /**
     * Converts a wind speed value between units.
     *
     * @param float  $value Raw value.
     * @param string $from  Source unit: 'kmh' or 'mph'.
     * @param string $to    Target unit: 'kmh', 'mph', 'ms', 'knots', or 'beaufort'.
     * @return float
     */
    public function convertWind(float $value, string $from, string $to): float
    {
        if ($from === $to) {
            return $value;
        }

        // Normalize to km/h first.
        $kmh = match ($from) {
            'mph' => $value * 1.60934,
            default => $value, // already km/h
        };

        return match ($to) {
            'mph'     => $kmh / 1.60934,
            'ms'      => $kmh / 3.6,
            'knots'   => $kmh / 1.852,
            'beaufort' => (float) $this->kmhToBeaufort($kmh),
            default   => $kmh, // 'kmh'
        };
    }

    /**
     * Converts a pressure value between units.
     *
     * @param float  $value Raw value.
     * @param string $from  Source unit: 'hpa' or 'mbar'.
     * @param string $to    Target unit: 'hpa', 'mbar', or 'inhg'.
     * @return float
     */
    public function convertPressure(float $value, string $from, string $to): float
    {
        if ($from === $to) {
            return $value;
        }

        // hPa and mbar are equivalent.
        if (in_array($from, array( 'hpa', 'mbar' ), true) && in_array($to, array( 'hpa', 'mbar' ), true)) {
            return $value;
        }

        if (in_array($from, array( 'hpa', 'mbar' ), true) && 'inhg' === $to) {
            return $value * 0.02953;
        }

        if ('inhg' === $from && in_array($to, array( 'hpa', 'mbar' ), true)) {
            return $value / 0.02953;
        }

        return $value;
    }

    /**
     * Converts a precipitation value between units.
     *
     * @param float  $value Raw value.
     * @param string $from  Source unit: 'mm' or 'in'.
     * @param string $to    Target unit: 'mm' or 'in'.
     * @return float
     */
    public function convertPrecipitation(float $value, string $from, string $to): float
    {
        if ($from === $to) {
            return $value;
        }

        if ('mm' === $from && 'in' === $to) {
            return $value * 0.03937;
        }

        if ('in' === $from && 'mm' === $to) {
            return $value * 25.4;
        }

        return $value;
    }

    /**
     * Applies all unit conversions to a weather item based on source and target unit settings.
     *
     * @param array<string, mixed> $item         Weather data item.
     * @param string               $sourcePreset 'metric' or 'imperial' (what the provider returned).
     * @param array<string, string> $unitSettings Target unit overrides (temperature, wind, precipitation, pressure).
     * @return array<string, mixed> Item with converted values.
     */
    public function convertItem(array $item, string $sourcePreset, array $unitSettings): array
    {
        $sourceTemp = 'imperial' === $sourcePreset ? 'fahrenheit' : 'celsius';
        $sourceWind = 'imperial' === $sourcePreset ? 'mph' : 'kmh';
        $sourcePrec = 'imperial' === $sourcePreset ? 'in' : 'mm';
        $sourcePres = 'hpa'; // Always hPa from Open-Meteo.

        $targetTemp = $unitSettings['temperature'] ?? '';
        $targetWind = $unitSettings['wind'] ?? '';
        $targetPrec = $unitSettings['precipitation'] ?? '';
        $targetPres = $unitSettings['pressure'] ?? '';

        // Temperature fields.
        if ('' !== $targetTemp && $targetTemp !== $sourceTemp) {
            foreach (array( 'temperature', 'temperature_feels_like', 'temperature_min', 'temperature_max', 'temperature_feels_like_min', 'temperature_feels_like_max' ) as $field) {
                if (isset($item[ $field ]) && is_numeric($item[ $field ])) {
                    $item[ $field ] = round($this->convertTemperature((float) $item[ $field ], $sourceTemp, $targetTemp), 1);
                }
            }
        }

        // Wind fields.
        if ('' !== $targetWind && $targetWind !== $sourceWind) {
            foreach (array( 'wind_speed', 'wind_gusts' ) as $field) {
                if (isset($item[ $field ]) && is_numeric($item[ $field ])) {
                    $converted      = $this->convertWind((float) $item[ $field ], $sourceWind, $targetWind);
                    $item[ $field ] = 'beaufort' === $targetWind
                        ? (int) $converted
                        : round($converted, 1);
                }
            }
        }

        // Precipitation fields.
        if ('' !== $targetPrec && $targetPrec !== $sourcePrec) {
            foreach (array( 'precipitation' ) as $field) {
                if (isset($item[ $field ]) && is_numeric($item[ $field ])) {
                    $item[ $field ] = round($this->convertPrecipitation((float) $item[ $field ], $sourcePrec, $targetPrec), 2);
                }
            }
        }

        // Pressure fields.
        if ('' !== $targetPres && $targetPres !== $sourcePres) {
            foreach (array( 'pressure' ) as $field) {
                if (isset($item[ $field ]) && is_numeric($item[ $field ])) {
                    $item[ $field ] = round($this->convertPressure((float) $item[ $field ], $sourcePres, $targetPres), 2);
                }
            }
        }

        return $item;
    }

    /**
     * Converts km/h to Beaufort scale (0–12).
     *
     * @param float $kmh Wind speed in km/h.
     * @return int Beaufort force number.
     */
    private function kmhToBeaufort(float $kmh): int
    {
        foreach (array_reverse(self::BEAUFORT_KMH, true) as $force => $threshold) {
            if ($kmh >= $threshold) {
                return $force + 1;
            }
        }

        return 0;
    }
}
