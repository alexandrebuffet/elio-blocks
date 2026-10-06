<?php

namespace ElioBlocks\BlockEditor\Hooks;

use ElioBlocks\Contracts\HookInterface;
use ElioBlocks\Interactivity\Blocks\Report\DateSettings;
use ElioBlocks\Settings\PluginSettings;

// Exit if called directly.
if (! defined('ABSPATH')) {
    die;
}

/**
 * Enqueues Block Editor assets.
 */
class EnqueueBlockEditorAssets implements HookInterface
{
    /**
     * Constructor.
     *
     * @param string         $pluginPath Absolute path to the plugin directory.
     * @param string         $pluginUrl  Public URL of the plugin directory.
     * @param PluginSettings $settings   Plugin settings.
     */
    public function __construct(
        private string $pluginPath,
        private string $pluginUrl,
        private PluginSettings $settings
    ) {
    }

    /**
     * {@inheritDoc}
     */
    public function initHooks(): void
    {
        add_action('enqueue_block_editor_assets', array( $this, 'enqueueBlockEditorAssets' ));
    }

    /**
     * Enqueues Block Editor assets.
     */
    public function enqueueBlockEditorAssets(): void
    {
        $this->enqueueBlockEditorScript();
        $this->addDateSettings();
        $this->addRefreshSettings();
        $this->enqueueBlockEditorStyle();
    }

    /**
     * Enqueues Block Editor script.
     */
    public function enqueueBlockEditorScript(): void
    {
        $assetFile = untrailingslashit($this->pluginPath) . '/build/block-editor/index.asset.php';

        if (! file_exists($assetFile)) {
            return;
        }

        $asset = require $assetFile;

        wp_enqueue_script(
            'elio-blocks-block-editor',
            untrailingslashit($this->pluginUrl) . '/build/block-editor/index.js',
            $asset['dependencies'],
            $asset['version'],
            true
        );

        // Strings come from the JSON files of the translate.wordpress.org language packs,
        // which WordPress finds in WP_LANG_DIR/plugins: no path, the plugin ships no languages/.
        wp_set_script_translations('elio-blocks-block-editor', 'elio-blocks');
    }

    /**
     * Gives the editor the date settings the front gets (DateSettings), so the
     * date blocks write dates there as wp_date() does: @wordpress/date has no
     * declined month names.
     */
    public function addDateSettings(): void
    {
        $settings = wp_json_encode(DateSettings::fromSite(), JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT);

        if (false !== $settings) {
            wp_add_inline_script('elio-blocks-block-editor', 'window.elioBlocksDateSettings = ' . $settings . ';', 'before');
        }
    }

    /**
     * Gives the editor the refresh settings the front gets, so the elio/data
     * store asks for a weather forecast again when the front does.
     */
    public function addRefreshSettings(): void
    {
        $settings = wp_json_encode($this->settings->getRefreshSettings());

        if (false !== $settings) {
            wp_add_inline_script('elio-blocks-block-editor', 'window.elioBlocksRefreshSettings = ' . $settings . ';', 'before');
        }
    }

    /**
     * Enqueues Block Editor style.
     */
    public function enqueueBlockEditorStyle(): void
    {
        $assetFile = untrailingslashit($this->pluginPath) . '/build/block-editor/index.asset.php';

        if (! file_exists($assetFile)) {
            return;
        }

        $styleFile = untrailingslashit($this->pluginPath) . '/build/block-editor/style-index.css';

        if (! file_exists($styleFile)) {
            return;
        }

        $asset = require $assetFile;

        wp_enqueue_style(
            'elio-blocks-block-editor',
            untrailingslashit($this->pluginUrl) . '/build/block-editor/style-index.css',
            array(),
            $asset['version']
        );
        // The build has its right-to-left copy (style-index-rtl.css).
        wp_style_add_data('elio-blocks-block-editor', 'rtl', 'replace');
    }
}
