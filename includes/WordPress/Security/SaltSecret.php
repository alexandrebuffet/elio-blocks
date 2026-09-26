<?php

declare(strict_types=1);

namespace ElioBlocks\WordPress\Security;

use ElioBlocks\Contracts\Security\SecretInterface;

// Exit if called directly.
if (! defined('ABSPATH')) {
    die;
}

/**
 * Secret derived from the WordPress salts.
 *
 * Resolved on demand: wp_salt() is pluggable and not available when the
 * container is built.
 */
final class SaltSecret implements SecretInterface
{
    /**
     * {@inheritDoc}
     */
    public function get(): string
    {
        return wp_salt('auth');
    }
}
