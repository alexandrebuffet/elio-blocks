<?php

namespace ElioBlocks\Weather\Condition\Icons\Hooks;

use ElioBlocks\Contracts\HookInterface;
use ElioBlocks\Weather\Condition\Icons\ConditionIconsRegistry;

// Exit if called directly.
if (! defined('ABSPATH')) {
    die;
}

/**
 * Registers the plugin's own icon collections on init (priority 20) and locks
 * the registry (priority 26), once elio_blocks_init (priority 25) has let
 * third parties register theirs with elio_blocks_register_condition_icon_collection()
 * and elio_blocks_register_condition_icon() (see functions.php).
 *
 * The collection comes from the manifest the build writes next to the icons
 * (scripts/build-icons.mjs): "elio", the icons drawn for the plugin, those its
 * condition mappings name. Each icon is registered by file path and read the
 * first time it is served.
 */
class RegisterConditionIcons implements HookInterface
{
    /**
     * Constructor.
     *
     * @param ConditionIconsRegistry $registry  The icon registry.
     * @param string                 $iconsPath Absolute path of the built icons directory, one folder per collection.
     */
    public function __construct(
        private ConditionIconsRegistry $registry,
        private string $iconsPath,
    ) {
    }

    /**
     * {@inheritDoc}
     */
    public function initHooks(): void
    {
        add_action('init', array( $this, 'registerDefaultCollection' ), 20);
        add_action('init', array( $this, 'lockRegistry' ), 26);
    }

    /**
     * Registers the plugin's collections and their icons from the manifest.
     */
    public function registerDefaultCollection(): void
    {
        $manifest = $this->manifest();

        if (empty($manifest['collections']) || ! is_array($manifest['collections'])) {
            return;
        }

        $directory = rtrim($this->iconsPath, '/\\');

        foreach ($manifest['collections'] as $slug => $collection) {
            if (! is_string($slug) || ! is_array($collection) || empty($collection['icons']) || ! is_array($collection['icons'])) {
                continue;
            }

            $this->registry->registerCollection(
                $slug,
                array(
                    'label'       => (string) ( $collection['label'] ?? $slug ),
                    'description' => (string) ( $collection['description'] ?? '' ),
                )
            );

            // The manifest maps conditions to icons; an icon is registered with the conditions it represents.
            $conditions = array();

            foreach ($collection['conditionMappings'] ?? array() as $mapping) {
                if (isset($mapping['condition'], $mapping['dayOrNight'], $mapping['iconSlug'])) {
                    $conditions[ $mapping['iconSlug'] ][] = array( $mapping['condition'], $mapping['dayOrNight'] );
                }
            }

            foreach ($collection['icons'] as $iconSlug => $entry) {
                if (! is_array($entry) || ! isset($entry['filePath'])) {
                    continue;
                }

                $this->registry->registerIcon(
                    $slug . '/' . $iconSlug,
                    array(
                        'label'      => (string) ( $entry['label'] ?? '' ),
                        'file_path'  => $directory . '/' . $slug . '/' . $entry['filePath'],
                        'style'      => $entry['style'] ?? 'fill',
                        'conditions' => $conditions[ $iconSlug ] ?? array(),
                    )
                );
            }
        }
    }

    /**
     * Locks the registry to prevent further registrations.
     */
    public function lockRegistry(): void
    {
        $this->registry->build();
    }

    /**
     * Loads the manifest: icons directory path (without trailing slash) + '-manifest.php'.
     *
     * @return array<string, mixed>
     */
    private function manifest(): array
    {
        $path = rtrim($this->iconsPath, '/\\') . '-manifest.php';

        if (! is_readable($path)) {
            return array();
        }

        $manifest = include $path; // phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.UsingVariable

        return is_array($manifest) ? $manifest : array();
    }
}
