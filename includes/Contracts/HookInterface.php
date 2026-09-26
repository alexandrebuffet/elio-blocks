<?php

namespace ElioBlocks\Contracts;

// Exit if called directly.
if (! defined('ABSPATH')) {
    die;
}

/**
 * Interface for classes that initialize WordPress actions and filters.
 */
interface HookInterface
{
    /**
     * Initializes WordPress actions and filters.
     */
    public function initHooks(): void;
}
