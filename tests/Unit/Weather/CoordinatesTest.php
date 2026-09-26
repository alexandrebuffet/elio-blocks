<?php

namespace ElioBlocks\Tests\Unit\Weather;

use ElioBlocks\Weather\Coordinates;
use InvalidArgumentException;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

class CoordinatesTest extends TestCase
{
    public function test_rounds_to_two_decimals_so_neighbouring_points_share_a_cache_entry(): void
    {
        $a = Coordinates::fromFloats(48.8566141, 2.3522219);
        $b = Coordinates::fromFloats(48.8600001, 2.3549999);

        $this->assertSame(48.86, $a->latitude);
        $this->assertSame(2.35, $a->longitude);
        $this->assertTrue($a->equals($b));
    }

    #[DataProvider('outOfRange')]
    public function test_rejects_out_of_range_values(float $latitude, float $longitude): void
    {
        $this->expectException(InvalidArgumentException::class);

        Coordinates::fromFloats($latitude, $longitude);
    }

    public static function outOfRange(): array
    {
        return array(
            'latitude too high'  => array( 90.01, 0.0 ),
            'latitude too low'   => array( -90.01, 0.0 ),
            'longitude too high' => array( 0.0, 180.01 ),
            'longitude too low'  => array( 0.0, -180.01 ),
            'not a number'       => array( NAN, 0.0 ),
            'infinite'           => array( 0.0, INF ),
        );
    }

    public function test_accepts_the_equator_and_the_prime_meridian(): void
    {
        $coordinates = Coordinates::fromFloats(0.0, 0.0);

        $this->assertSame(0.0, $coordinates->latitude);
        $this->assertSame(0.0, $coordinates->longitude);
    }

    public function test_accepts_the_poles_and_the_antimeridian(): void
    {
        $coordinates = Coordinates::fromFloats(-90.0, 180.0);

        $this->assertSame(-90.0, $coordinates->latitude);
        $this->assertSame(180.0, $coordinates->longitude);
    }

    public function test_try_from_builds_coordinates_from_numeric_block_attributes(): void
    {
        $coordinates = Coordinates::tryFrom('51.5074', 0);

        $this->assertNotNull($coordinates);
        $this->assertSame(51.51, $coordinates->latitude);
        $this->assertSame(0.0, $coordinates->longitude);
    }

    #[DataProvider('unusableAttributes')]
    public function test_try_from_returns_null_for_unusable_block_attributes(mixed $latitude, mixed $longitude): void
    {
        $this->assertNull(Coordinates::tryFrom($latitude, $longitude));
    }

    public static function unusableAttributes(): array
    {
        return array(
            'missing'      => array( null, null ),
            'empty string' => array( '', '' ),
            'half missing' => array( 48.85, null ),
            'not numeric'  => array( 'Paris', 'France' ),
            'out of range' => array( 999, -999 ),
        );
    }
}
