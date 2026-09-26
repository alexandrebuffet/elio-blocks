<?php

declare(strict_types=1);

namespace ElioBlocks\Weather;

use InvalidArgumentException;

// Exit if called directly.
if (! defined('ABSPATH')) {
    die;
}

/**
 * A validated point on Earth.
 *
 * Values are rounded to PRECISION decimals (about 1.1 km), which is finer than
 * weather forecast model grids. Rounding makes neighbouring requests share one
 * cache entry and one upstream call instead of creating a new one per decimal.
 */
final class Coordinates
{
    public const PRECISION = 2;

    /**
     * Constructor.
     *
     * @param float $latitude  Latitude, -90 to 90.
     * @param float $longitude Longitude, -180 to 180.
     */
    private function __construct(
        public readonly float $latitude,
        public readonly float $longitude,
    ) {
    }

    /**
     * Builds coordinates from floats.
     *
     * @param float $latitude  Latitude.
     * @param float $longitude Longitude.
     * @return self
     *
     * @throws InvalidArgumentException If a value is not finite or out of range.
     */
    public static function fromFloats(float $latitude, float $longitude): self
    {
        if (! is_finite($latitude) || $latitude < -90.0 || $latitude > 90.0) {
            throw new InvalidArgumentException('Latitude must be a number between -90 and 90.');
        }

        if (! is_finite($longitude) || $longitude < -180.0 || $longitude > 180.0) {
            throw new InvalidArgumentException('Longitude must be a number between -180 and 180.');
        }

        // Adding 0.0 turns the "-0.0" produced by rounding small negatives into "0.0".
        return new self(
            round($latitude, self::PRECISION) + 0.0,
            round($longitude, self::PRECISION) + 0.0
        );
    }

    /**
     * Builds coordinates from untrusted values (block attributes, request params).
     *
     * @param mixed $latitude  Latitude.
     * @param mixed $longitude Longitude.
     * @return self|null Null when a value is missing, not numeric, or out of range.
     */
    public static function tryFrom(mixed $latitude, mixed $longitude): ?self
    {
        if (! is_numeric($latitude) || ! is_numeric($longitude)) {
            return null;
        }

        try {
            return self::fromFloats((float) $latitude, (float) $longitude);
        } catch (InvalidArgumentException) {
            return null;
        }
    }

    /**
     * Determines whether both points are the same once rounded.
     *
     * @param self $other Coordinates to compare with.
     * @return bool
     */
    public function equals(self $other): bool
    {
        return $this->latitude === $other->latitude && $this->longitude === $other->longitude;
    }
}
