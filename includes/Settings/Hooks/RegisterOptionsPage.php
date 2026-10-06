<?php

namespace ElioBlocks\Settings\Hooks;

use ElioBlocks\Contracts\HookInterface;
use ElioBlocks\Settings\PluginSettings;

// Exit if called directly.
if (! defined('ABSPATH')) {
    die;
}

/**
 * Registers the plugin settings admin page and enqueues its assets.
 */
class RegisterOptionsPage implements HookInterface
{
    private const PAGE_SLUG = 'elio-blocks-settings';

    private const PAGE_HOOK = 'toplevel_page_elio-blocks-settings';

    /**
     * Icon of the menu: a base64 SVG, which WordPress paints in the colors of the admin
     * color scheme by rewriting its fill attributes.
     */
    private const MENU_ICON = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMjggMTI4Ij48cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTEwOCAwQzExOS4wNSAwIDEyOCA4Ljk1IDEyOCAyMFYxMDhDMTI4IDExOS4wNSAxMTkuMDUgMTI4IDEwOCAxMjhIMjBDOC45NSAxMjggMCAxMTkuMDUgMCAxMDhWMjBDMCA4Ljk1IDguOTUgMCAyMCAwSDEwOFpNNjEuMTMgMjRMNjEuMTIgNTMuMjRMNDYuNDkgMjcuOTJMNDEuNTEgMzAuOEw1Ni4xMiA1Ni4xMkwzMC44IDQxLjUxTDI3LjkyIDQ2LjQ5TDI3LjkyIDQ2LjQ5TDUzLjI0IDYxLjEyTDI0IDYxLjEzVjY2Ljg4TDUzLjI0IDY2Ljg4TDI3LjkyIDgxLjUxTDI3LjkyIDgxLjUxTDMwLjggODYuNDlMNTYuMTIgNzEuODhMNDEuNTEgOTcuMkw0Ni40OSAxMDAuMDhMNjEuMTIgNzQuNzZMNjEuMTMgMTA0SDY2Ljg4TDY2Ljg4IDc0Ljc2TDgxLjUxIDEwMC4wOEw4Ni40OSA5Ny4yTDcxLjg4IDcxLjg4TDk3LjIgODYuNDlMMTAwLjA4IDgxLjUxTDEwMC4wOCA4MS41MUw3NC43NiA2Ni44OEwxMDQgNjYuODhWNjEuMTNMNzQuNzYgNjEuMTJMMTAwLjA4IDQ2LjQ5SDEwMC4wOEw5Ny4yIDQxLjUxTDcxLjg4IDU2LjEyTDg2LjQ5IDMwLjhMODEuNTEgMjcuOTJMNjYuODggNTMuMjRMNjYuODggMjRINjEuMTNaIiBmaWxsPSJibGFjayIvPjwvc3ZnPg=='; // phpcs:ignore Generic.Files.LineLength.TooLong

    /**
     * Constructor.
     *
     * @param string $pluginPath    Absolute path to the plugin directory.
     * @param string $pluginUrl     Public URL of the plugin directory.
     * @param string $pluginVersion Plugin version: versions the stylesheet when the build has no asset file.
     */
    public function __construct(
        private string $pluginPath,
        private string $pluginUrl,
        private string $pluginVersion
    ) {
    }

    /**
     * {@inheritDoc}
     */
    public function initHooks(): void
    {
        add_action('admin_menu', array( $this, 'addSettingsPage' ));
        add_action('admin_enqueue_scripts', array( $this, 'enqueueAssets' ));
    }

    /**
     * Registers the Elio menu, which opens the settings page.
     *
     * The Settings item has the slug of the menu: it is the page the menu opens. WordPress
     * lists it once the menu has a second item, and hides a lone item leading to the menu page.
     */
    public function addSettingsPage(): void
    {
        add_menu_page(
            __('Elio Blocks', 'elio-blocks'),
            __('Elio', 'elio-blocks'),
            'manage_options',
            self::PAGE_SLUG,
            array( $this, 'renderPage' ),
            self::MENU_ICON
        );

        add_submenu_page(
            self::PAGE_SLUG,
            __('Elio Blocks', 'elio-blocks'),
            __('Settings', 'elio-blocks'),
            'manage_options',
            self::PAGE_SLUG
        );
    }

    /**
     * Enqueues the settings page React app and its stylesheet.
     *
     * The build asset file is read once: the stylesheet carries the version of the script,
     * so the browser cache is invalidated with each build.
     *
     * @param string $hookSuffix Current admin page hook suffix.
     */
    public function enqueueAssets(string $hookSuffix): void
    {
        if (self::PAGE_HOOK !== $hookSuffix) {
            return;
        }

        $asset = $this->readAsset();

        $this->enqueueScript($asset);
        $this->enqueueStyle($asset['version'] ?? $this->pluginVersion);
    }

    /**
     * Reads the asset file of the settings build.
     *
     * @return array{dependencies: string[], version: string}|null Null when the build is missing.
     */
    private function readAsset(): ?array
    {
        $assetFile = untrailingslashit($this->pluginPath) . '/build/settings/index.asset.php';

        if (! file_exists($assetFile)) {
            return null;
        }

        $asset = require $assetFile;

        return is_array($asset) ? $asset : null;
    }

    /**
     * Enqueues the settings page React app, with its configuration inlined before it.
     *
     * @param array{dependencies: string[], version: string}|null $asset The asset file, null when the build is missing.
     */
    private function enqueueScript(?array $asset): void
    {
        if (null === $asset) {
            return;
        }

        wp_enqueue_script(
            'elio-blocks-settings',
            untrailingslashit($this->pluginUrl) . '/build/settings/index.js',
            $asset['dependencies'],
            $asset['version'],
            true
        );

        // Strings come from the JSON files of the translate.wordpress.org language packs,
        // which WordPress finds in WP_LANG_DIR/plugins: no path, the plugin ships no languages/.
        wp_set_script_translations('elio-blocks-settings', 'elio-blocks');

        $config_json = wp_json_encode(
            PluginSettings::getElioBlocksConfigForSettingsScript(),
            JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT
        );

        if (false !== $config_json) {
            wp_add_inline_script(
                'elio-blocks-settings',
                'window.elioBlocksConfig = ' . $config_json . ';',
                'before'
            );
        }
    }

    /**
     * Enqueues the settings page stylesheet.
     *
     * @param string $version Version of the stylesheet, for cache busting.
     */
    private function enqueueStyle(string $version): void
    {
        $styleFile = untrailingslashit($this->pluginPath) . '/build/settings/style-index.css';

        if (! file_exists($styleFile)) {
            return;
        }

        wp_enqueue_style(
            'elio-blocks-settings-style',
            untrailingslashit($this->pluginUrl) . '/build/settings/style-index.css',
            array( 'wp-components' ),
            $version
        );
        // The build has its right-to-left copy (style-index-rtl.css), which also
        // holds the bundled @wordpress/components styles.
        wp_style_add_data('elio-blocks-settings-style', 'rtl', 'replace');
    }

    /**
     * Renders the settings page mount point.
     */
    public function renderPage(): void
    {
        echo '<div id="elio-blocks-settings" class="elio-blocks-settings"></div>';
    }
}
