<?php

namespace ElioBlocks\Tests\Unit\Weather\Units;

use ElioBlocks\Weather\Units\UnitsConversionService;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

class UnitsConversionServiceTest extends TestCase
{
    private UnitsConversionService $units;

    protected function setUp(): void
    {
        $this->units = new UnitsConversionService();
    }

    #[DataProvider('temperatures')]
    public function test_temperature(float $value, string $from, string $to, float $expected): void
    {
        $this->assertEqualsWithDelta($expected, $this->units->convertTemperature($value, $from, $to), 0.001);
    }

    public static function temperatures(): array
    {
        return [
            'freezing point to °F' => [0.0, 'celsius', 'fahrenheit', 32.0],
            'boiling point to °F'  => [100.0, 'celsius', 'fahrenheit', 212.0],
            '-40 is -40'           => [-40.0, 'celsius', 'fahrenheit', -40.0],
            'body heat to °C'      => [98.6, 'fahrenheit', 'celsius', 37.0],
            'same unit'            => [21.5, 'celsius', 'celsius', 21.5],
            'unknown target'       => [21.5, 'celsius', 'kelvin', 21.5],
        ];
    }

    #[DataProvider('winds')]
    public function test_wind(float $value, string $from, string $to, float $expected): void
    {
        $this->assertEqualsWithDelta($expected, $this->units->convertWind($value, $from, $to), 0.01);
    }

    public static function winds(): array
    {
        return [
            'km/h to m/s'   => [36.0, 'kmh', 'ms', 10.0],
            'km/h to mph'   => [100.0, 'kmh', 'mph', 62.14],
            'km/h to knots' => [18.52, 'kmh', 'knots', 10.0],
            'mph to km/h'   => [10.0, 'mph', 'kmh', 16.09],
            'mph to m/s'    => [10.0, 'mph', 'ms', 4.47],
            'same unit'     => [12.0, 'mph', 'mph', 12.0],
        ];
    }

    #[DataProvider('beaufortForces')]
    public function test_beaufort_force_starts_at_its_lower_bound(float $kmh, float $force): void
    {
        $this->assertSame($force, $this->units->convertWind($kmh, 'kmh', 'beaufort'));
    }

    public static function beaufortForces(): array
    {
        return [
            'calm'                   => [0.9, 0.0],
            'light air'              => [1.0, 1.0],
            'still light air'        => [5.9, 1.0],
            'light breeze'           => [6.0, 2.0],
            'strong breeze'          => [39.0, 6.0],
            'gale'                   => [62.0, 8.0],
            'just under a hurricane' => [117.9, 11.0],
            'hurricane'              => [118.0, 12.0],
            'beyond the scale'       => [250.0, 12.0],
        ];
    }

    public function test_beaufort_from_mph_goes_through_kmh(): void
    {
        // 25 mph = 40.2 km/h: strong breeze.
        $this->assertSame(6.0, $this->units->convertWind(25.0, 'mph', 'beaufort'));
    }

    #[DataProvider('pressures')]
    public function test_pressure(float $value, string $from, string $to, float $expected): void
    {
        $this->assertEqualsWithDelta($expected, $this->units->convertPressure($value, $from, $to), 0.01);
    }

    public static function pressures(): array
    {
        return [
            'standard atmosphere to inHg' => [1013.25, 'hpa', 'inhg', 29.92],
            'inHg back to hPa'            => [29.92, 'inhg', 'hpa', 1013.21],
            'hPa and mbar are the same'   => [1013.25, 'hpa', 'mbar', 1013.25],
        ];
    }

    #[DataProvider('precipitations')]
    public function test_precipitation(float $value, string $from, string $to, float $expected): void
    {
        $this->assertEqualsWithDelta($expected, $this->units->convertPrecipitation($value, $from, $to), 0.001);
    }

    public static function precipitations(): array
    {
        return [
            'an inch of rain' => [25.4, 'mm', 'in', 1.0],
            'and back'        => [1.0, 'in', 'mm', 25.4],
        ];
    }

    // --- A weather item ---

    private const METRIC_ITEM = [
        'temperature'     => 20.0,
        'temperature_min' => 12.34,
        'wind_speed'      => 36.0,
        'wind_gusts'      => 62.0,
        'precipitation'   => 2.54,
        'pressure'        => 1013.25,
        'humidity'        => 64,
    ];

    public function test_an_item_is_converted_field_by_field_with_display_rounding(): void
    {
        $item = $this->units->convertItem(
            self::METRIC_ITEM,
            'metric',
            ['temperature' => 'fahrenheit', 'wind' => 'ms', 'precipitation' => 'in', 'pressure' => 'inhg']
        );

        $this->assertSame(68.0, $item['temperature']);
        $this->assertSame(54.2, $item['temperature_min']);
        $this->assertSame(10.0, $item['wind_speed']);
        $this->assertSame(17.2, $item['wind_gusts']);
        $this->assertSame(0.1, $item['precipitation']);
        $this->assertSame(29.92, $item['pressure']);
        $this->assertSame(64, $item['humidity'], 'Fields without a unit are left alone.');
    }

    public function test_beaufort_is_a_whole_number(): void
    {
        $item = $this->units->convertItem(self::METRIC_ITEM, 'metric', ['wind' => 'beaufort']);

        $this->assertSame(5, $item['wind_speed']);
        $this->assertSame(8, $item['wind_gusts']);
    }

    public function test_an_empty_override_follows_the_unit_system(): void
    {
        $settings = ['temperature' => '', 'wind' => '', 'precipitation' => '', 'pressure' => ''];

        $this->assertSame(self::METRIC_ITEM, $this->units->convertItem(self::METRIC_ITEM, 'metric', $settings));
    }

    public function test_an_override_equal_to_the_source_unit_does_not_touch_the_value(): void
    {
        $item = $this->units->convertItem(['temperature' => 68.04], 'imperial', ['temperature' => 'fahrenheit']);

        $this->assertSame(68.04, $item['temperature'], 'No rounding either: nothing was converted.');
    }

    public function test_imperial_data_is_converted_from_imperial_units(): void
    {
        $item = $this->units->convertItem(
            ['temperature' => 68.0, 'wind_speed' => 10.0, 'precipitation' => 1.0, 'pressure' => 1013.25],
            'imperial',
            ['temperature' => 'celsius', 'wind' => 'kmh', 'precipitation' => 'mm', 'pressure' => 'mbar']
        );

        $this->assertSame(20.0, $item['temperature']);
        $this->assertSame(16.1, $item['wind_speed']);
        $this->assertSame(25.4, $item['precipitation']);
        $this->assertSame(1013.25, $item['pressure'], 'Open-Meteo reports hPa in both unit systems.');
    }

    public function test_missing_and_null_values_stay_as_they_are(): void
    {
        $item = $this->units->convertItem(['temperature' => null, 'wind_speed' => 'n/a'], 'metric', ['temperature' => 'fahrenheit', 'wind' => 'ms']);

        $this->assertSame(['temperature' => null, 'wind_speed' => 'n/a'], $item);
    }
}
