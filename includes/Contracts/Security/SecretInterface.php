<?php

declare(strict_types=1);

namespace ElioBlocks\Contracts\Security;

// Exit if called directly.
if (! defined('ABSPATH')) {
    die;
}

/**
 * Site-specific secret used to sign values handed to the browser.
 */
interface SecretInterface
{
    /**
     * Returns the secret.
     *
     * @return string
     */
    public function get(): string;
}
