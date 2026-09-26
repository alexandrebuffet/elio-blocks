<?php

namespace ElioBlocks\Tests\Unit\WeatherForecast;

use Brain\Monkey;
use Brain\Monkey\Functions;
use ElioBlocks\WeatherForecast\Exception\InvalidProviderResponse;
use ElioBlocks\WeatherForecast\WeatherForecast;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

/**
 * Providers are an extension point: what they return is checked once, here,
 * so the cache, the REST API and the blocks can rely on its shape.
 */
class WeatherForecastTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        Monkey\setUp();
        // The section named in an error message is escaped.
        Functions\stubEscapeFunctions();
    }

    protected function tearDown(): void
    {
        Monkey\tearDown();
        parent::tearDown();
    }

    public function test_keeps_the_sections_a_provider_returns(): void
    {
        $data = [
            'meta'    => ['timezone' => 'Europe/Paris'],
            'current' => ['temperature' => 20.0],
            'hourly'  => [['temperature' => 19.0]],
            'daily'   => [['temperature_max' => 25.0]],
        ];

        $this->assertSame($data, WeatherForecast::fromArray($data)->toArray());
    }

    public function test_a_provider_may_leave_sections_out(): void
    {
        $weatherForecast = WeatherForecast::fromArray(['current' => ['temperature' => 20.0]]);

        $this->assertSame(
            ['meta' => [], 'current' => ['temperature' => 20.0], 'hourly' => [], 'daily' => []],
            $weatherForecast->toArray()
        );
    }

    public function test_rows_are_reindexed_so_they_encode_to_json_arrays(): void
    {
        $weatherForecast = WeatherForecast::fromArray(['daily' => [3 => ['temperature_max' => 25.0], 7 => ['temperature_max' => 27.0]]]);

        $this->assertTrue(array_is_list($weatherForecast->toArray()['daily']));
    }

    #[DataProvider('malformedForecasts')]
    public function test_refuses_what_is_not_a_weather_forecast(array $data): void
    {
        $this->expectException(InvalidProviderResponse::class);

        WeatherForecast::fromArray($data);
    }

    public static function malformedForecasts(): array
    {
        return [
            'current is not an item' => [['current' => 'sunny']],
            'hourly is not a list'   => [['hourly' => 'later']],
            'a row is not an item'   => [['daily' => [['temperature_max' => 25.0], 'tomorrow']]],
            'meta is not a map'      => [['meta' => 'open-meteo']],
        ];
    }

    public function test_map_items_visits_current_conditions_and_every_row(): void
    {
        $weatherForecast = WeatherForecast::fromArray(
            [
                'current' => ['temperature' => 1.0],
                'hourly'  => [['temperature' => 2.0], ['temperature' => 3.0]],
                'daily'   => [['temperature' => 4.0]],
            ]
        );

        $doubled = $weatherForecast->mapItems(static fn(array $item): array => ['temperature' => $item['temperature'] * 2])->toArray();

        $this->assertSame(2.0, $doubled['current']['temperature']);
        $this->assertSame([4.0, 6.0], array_column($doubled['hourly'], 'temperature'));
        $this->assertSame([8.0], array_column($doubled['daily'], 'temperature'));
        $this->assertSame(1.0, $weatherForecast->toArray()['current']['temperature'], 'A weather forecast is immutable.');
    }

    public function test_map_items_has_nothing_to_visit_without_current_conditions(): void
    {
        $visited = 0;

        WeatherForecast::fromArray([])->mapItems(static function (array $item) use (&$visited): array {
            ++$visited;
            return $item;
        });

        $this->assertSame(0, $visited);
    }
}
