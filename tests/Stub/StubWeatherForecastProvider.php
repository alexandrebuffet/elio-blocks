<?php

namespace ElioBlocks\Tests\Stub;

use ElioBlocks\WeatherForecast\WeatherForecastProviderInterface;

final class StubWeatherForecastProvider implements WeatherForecastProviderInterface
{
	/** @var list<array{latitude: float, longitude: float, units: string}> Every fetch() call received. */
	public array $calls = [];

	/** @var list<array<string, mixed>> The $args of every fetch() call. */
	public array $receivedArgs = [];

	public function __construct(
		private array $response = [],
	) {}

	public function fetch(float $latitude, float $longitude, string $units, array $args = []): array
	{
		$this->calls[]        = ['latitude' => $latitude, 'longitude' => $longitude, 'units' => $units];
		$this->receivedArgs[] = $args;

		return $this->response;
	}
}
