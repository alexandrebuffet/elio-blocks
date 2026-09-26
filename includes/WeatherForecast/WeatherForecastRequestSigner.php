<?php

declare(strict_types=1);

namespace ElioBlocks\WeatherForecast;

use ElioBlocks\Contracts\Security\SecretInterface;
use ElioBlocks\Weather\Coordinates;

// Exit if called directly.
if (! defined('ABSPATH')) {
    die;
}

/**
 * Signs the weather forecast requests a rendered block is allowed to make.
 *
 * The weather forecast endpoint is reachable by anonymous visitors. Without a
 * signature it would relay any coordinates to the upstream API and store a
 * cache entry for each of them. A signature is deterministic and never expires,
 * so it survives full-page caching (unlike a nonce).
 *
 * The signed text starts with the data it unlocks, as the action of a nonce
 * does: another endpoint signing with the site secret (a marine forecast of the
 * same place) cannot issue a signature this one accepts, nor the reverse.
 */
final class WeatherForecastRequestSigner
{
    /**
     * Data a signature unlocks, first in the signed text.
     */
    private const DOMAIN = 'weather-forecast';

    /**
     * Constructor.
     *
     * @param SecretInterface $secret Site secret.
     */
    public function __construct(private SecretInterface $secret)
    {
    }

    /**
     * Signs a weather forecast request.
     *
     * @param Coordinates $coordinates Requested location.
     * @param string      $provider    Provider slug as sent by the client ('' = site default).
     * @param string      $units       Unit system as sent by the client.
     * @return string
     */
    public function sign(Coordinates $coordinates, string $provider, string $units): string
    {
        $payload = implode('|', array( self::DOMAIN, $coordinates->latitude, $coordinates->longitude, $provider, $units ));

        return hash_hmac('sha256', $payload, $this->secret->get());
    }

    /**
     * Determines whether the signature matches the request.
     *
     * @param string      $signature   Signature sent by the client.
     * @param Coordinates $coordinates Requested location.
     * @param string      $provider    Provider slug as sent by the client.
     * @param string      $units       Unit system as sent by the client.
     * @return bool
     */
    public function isValid(string $signature, Coordinates $coordinates, string $provider, string $units): bool
    {
        if ('' === $signature) {
            return false;
        }

        return hash_equals($this->sign($coordinates, $provider, $units), $signature);
    }
}
