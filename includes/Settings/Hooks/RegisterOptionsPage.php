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
    private const MENU_ICON = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMjggMTI4Ij48cGF0aCBkPSJNNjMuOSA1Mi42NkM2NS44NCA1Mi43MSA2Ny44NiA1My4zNSA2OS43OSA1NC42NUw1NC40NSA2OS45OUM1My4xNSA2OC4wNiA1Mi41MSA2Ni4wNCA1Mi40NiA2NC4xQzUyLjM5IDYxLjQyIDUzLjQ0IDU4LjYyIDU1LjkzIDU2LjEzQzU4LjQyIDUzLjY0IDYxLjIyIDUyLjU5IDYzLjkgNTIuNjZaIiBmaWxsPSJibGFjayIvPjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNMTA4IDBDMTE5LjA1IDAgMTI4IDguOTUgMTI4IDIwVjEwOEMxMjggMTE5LjA1IDExOS4wNSAxMjggMTA4IDEyOEgyMEM4Ljk1IDEyOCAwIDExOS4wNSAwIDEwOFYyMEMwIDguOTUgOC45NSAwIDIwIDBIMTA4Wk02MS40OCAxMDIuNjdINjcuMjNWODkuODlINjEuNDhWMTAyLjY3Wk0zNS4yMSA4OS40MkwzOS4yOCA5My40OUw0OC4zMSA4NC40NUw0NC4yNSA4MC4zOUwzNS4yMSA4OS40MlpNODAuMzkgODQuNDJMODkuNDIgOTMuNDZMOTMuNDkgODkuMzlMODQuNDUgODAuMzZMODAuMzkgODQuNDJaTTY0LjA1IDQ2LjkxQzU5LjY1IDQ2LjggNTUuMzYgNDguNTcgNTEuODcgNTIuMDdDNDguMzcgNTUuNTYgNDYuNiA1OS44NSA0Ni43MSA2NC4yNUM0Ni44MiA2OC42MyA0OC43OCA3Mi44NSA1Mi4yMiA3Ni4yOUM1NS42NiA3OS43MyA1OS44OCA4MS42OSA2NC4yNiA4MS43OUM2OC42NiA4MS45IDcyLjk0IDgwLjE0IDc2LjQ0IDc2LjY0Qzc5LjY3IDczLjQxIDgyLjM2IDY5LjM3IDgyLjM2IDY0LjM0TDc2LjYxIDY0LjM1Qzc2LjYxIDY3LjE3IDc1LjEzIDY5LjgyIDcyLjM3IDcyLjU3QzY5Ljg4IDc1LjA2IDY3LjA4IDc2LjExIDY0LjQgNzYuMDVDNjIuNDYgNzYgNjAuNDQgNzUuMzYgNTguNTEgNzQuMDZMNzguMTIgNTQuNDVMNzYuMDggNTIuNDJDNzIuNjUgNDguOTggNjguNDMgNDcuMDIgNjQuMDUgNDYuOTFaTTI2IDY3LjE5SDM4Ljc4VjYxLjQ0SDI2VjY3LjE5Wk04OS44OSA2Ny4xOUgxMDIuNjdWNjEuNDRIODkuODlWNjcuMTlaTTgwLjM5IDQ0LjI1TDg0LjQ1IDQ4LjMxTDkzLjQ5IDM5LjI4TDg5LjQyIDM1LjIxTDgwLjM5IDQ0LjI1Wk0zNS4yMSAzOS4yNUw0NC4yNSA0OC4yOEw0OC4zMSA0NC4yMUwzOS4yOCAzNS4xOEwzNS4yMSAzOS4yNVpNNjEuNDggMzguNzhINjcuMjNWMjZINjEuNDhWMzguNzhaIiBmaWxsPSJibGFjayIvPjwvc3ZnPg=='; // phpcs:ignore Generic.Files.LineLength.TooLong

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
