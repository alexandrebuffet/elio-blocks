<?php

namespace ElioBlocks\Blocks\Hooks;

use ElioBlocks\Contracts\HookInterface;

// Exit if called directly.
if (! defined('ABSPATH')) {
    die;
}

/**
 * Registers common frontend and editor assets shared across all blocks.
 */
class RegisterCommonStyleAsset implements HookInterface
{
    /**
     * {@inheritDoc}
     */
    public function initHooks(): void
    {
        // Run before block registration (default priority 10) so elio-common-style exists.
        add_action('init', array( $this, 'registerCommonStyle' ), 9);
    }

    /**
     * Registers the common stylesheet.
     */
    public function registerCommonStyle(): void
    {
        $basePath  = untrailingslashit(ELIO_BLOCKS_PLUGIN_PATH);
        $styleFile = $basePath . '/build/styles/common.css';
        $assetFile = $basePath . '/build/styles/common.asset.php';

        if (! file_exists($styleFile) || ! file_exists($assetFile)) {
            return;
        }

        $asset = require $assetFile;

        wp_register_style(
            'elio-common-style',
            untrailingslashit(ELIO_BLOCKS_PLUGIN_URL) . '/build/styles/common.css',
            array(),
            $asset['version']
        );
    }
}
