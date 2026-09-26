<?php

namespace ElioBlocks\Blocks\Hooks;

use ElioBlocks\Contracts\HookInterface;

// Exit if called directly.
if (! defined('ABSPATH')) {
    die;
}

/**
 * Registers all block types from the build directory.
 */
class RegisterBlockTypes implements HookInterface
{
    /**
     * {@inheritDoc}
     */
    public function initHooks(): void
    {
        add_action('init', array( $this, 'registerBlockTypes' ));
    }

    /**
     * Registers all block types from the build directory.
     *
     * Uses wp_register_block_types_from_metadata_collection() when available (WP 6.7+),
     * otherwise falls back to wp_register_block_metadata_collection() if available (WP 6.6+)
     * and registers each block type individually (WP 6.5+).
     */
    public function registerBlockTypes(): void
    {
        $blocksPath   = untrailingslashit(ELIO_BLOCKS_PLUGIN_PATH) . '/build/blocks';
        $manifestFile = untrailingslashit(ELIO_BLOCKS_PLUGIN_PATH) . '/build/blocks-manifest.php';

        if (function_exists('wp_register_block_types_from_metadata_collection')) {
            wp_register_block_types_from_metadata_collection($blocksPath, $manifestFile);

            return;
        }

        if (! file_exists($manifestFile)) {
            return;
        }

        if (function_exists('wp_register_block_metadata_collection')) {
            wp_register_block_metadata_collection($blocksPath, $manifestFile);
        }

        $blocksManifest = include $manifestFile;

        foreach (array_keys($blocksManifest) as $blockDir) {
            $blockPath = $blocksPath . '/' . $blockDir;

            if (! file_exists($blockPath)) {
                continue;
            }

            register_block_type($blockPath);
        }
    }
}
