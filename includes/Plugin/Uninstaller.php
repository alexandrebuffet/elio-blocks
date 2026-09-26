<?php

namespace ElioBlocks\Plugin;

use ElioBlocks\Contracts\Cache\CacheInterface;
use ElioBlocks\Settings\PluginSettings;

// Exit if called directly.
if (! defined('ABSPATH')) {
    die;
}

/**
 * Removes the plugin data when the plugin is deleted. Run from uninstall.php.
 */
class Uninstaller
{
    /**
     * Constructor.
     *
     * @param PluginSettings $settings Plugin settings (holds the "cleanup on delete" choice).
     * @param CacheInterface $cache    Cache to purge on cleanup.
     */
    public function __construct(
        private PluginSettings $settings,
        private CacheInterface $cache,
    ) {
    }

    /**
     * Removes all plugin data from the current site, unless the site owner opted out.
     */
    public function cleanup(): void
    {
        if (! $this->settings->isCleanupOnDeleteEnabled()) {
            return;
        }

        foreach (PluginSettings::optionNames() as $option) {
            delete_option($option);
        }

        $this->cache->purge();
    }
}
