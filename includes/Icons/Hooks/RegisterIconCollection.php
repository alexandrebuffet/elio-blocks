<?php

namespace ElioBlocks\Icons\Hooks;

use ElioBlocks\Contracts\HookInterface;

// Exit if called directly.
if (! defined('ABSPATH')) {
    die;
}

/**
 * Registers the Elio icon collection with the Icons API of WordPress 7.1, so
 * the Icon block (core/icon) offers the icons of the plugin next to the core
 * ones, and wp_get_icon( 'elio/sun' ) prints them.
 *
 * The collection comes from the manifest the build writes next to the icons
 * (scripts/build-icons.mjs): build/icons-manifest.php lists every icon of the
 * plugin, the condition icons included, as filled outlines in build/icons/elio/,
 * since the API keeps nothing but <path> and <polygon> fills. Each icon is
 * registered by file path and read the first time it is served.
 *
 * On init at the default priority, where the core registers its own icons
 * (its collection registers at 0). Nothing on a WordPress without the API.
 */
class RegisterIconCollection implements HookInterface
{
    /**
     * Constructor.
     *
     * @param string $iconsPath Absolute path of the built icons directory, one folder per collection.
     */
    public function __construct(
        private string $iconsPath,
    ) {
    }

    /**
     * {@inheritDoc}
     */
    public function initHooks(): void
    {
        add_action('init', array( $this, 'registerCollection' ));
    }

    /**
     * Registers the collection and its icons from the manifest.
     */
    public function registerCollection(): void
    {
        if (! function_exists('wp_register_icon_collection') || ! function_exists('wp_register_icon')) {
            return;
        }

        $manifest = $this->manifest();

        if (
            empty($manifest['slug']) || ! is_string($manifest['slug'])
            || empty($manifest['icons']) || ! is_array($manifest['icons'])
        ) {
            return;
        }

        $slug       = $manifest['slug'];
        $registered = wp_register_icon_collection(
            $slug,
            array(
                'label'       => (string) ( $manifest['label'] ?? $slug ),
                'description' => (string) ( $manifest['description'] ?? '' ),
            )
        );

        if (! $registered) {
            return;
        }

        $directory = rtrim($this->iconsPath, '/\\') . '/' . $slug;

        foreach ($manifest['icons'] as $iconSlug => $entry) {
            if (! is_string($iconSlug) || ! is_array($entry) || empty($entry['filePath']) || ! is_string($entry['filePath'])) {
                continue;
            }

            wp_register_icon(
                $slug . '/' . $iconSlug,
                array(
                    'label'     => (string) ( $entry['label'] ?? $iconSlug ),
                    'file_path' => $directory . '/' . $entry['filePath'],
                )
            );
        }
    }

    /**
     * Loads the manifest: icons directory path (without trailing slash) + '-manifest.php'.
     *
     * @return array<string, mixed> The manifest, empty when missing or invalid.
     */
    private function manifest(): array
    {
        $path = rtrim($this->iconsPath, '/\\') . '-manifest.php';

        if (! is_readable($path)) {
            return array();
        }

        $manifest = include $path;

        return is_array($manifest) ? $manifest : array();
    }
}
