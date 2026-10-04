<?php

namespace ElioBlocks\Tests\Unit\Settings;

use Brain\Monkey;
use Brain\Monkey\Functions;
use ElioBlocks\Settings\Hooks\RegisterOptionsPage;
use PHPUnit\Framework\TestCase;

class RegisterOptionsPageTest extends TestCase
{
    private const SETTINGS_PAGE = 'toplevel_page_elio-blocks-settings';
    private const PLUGIN_URL    = 'https://example.test/wp-content/plugins/elio-blocks/';
    private const BUILD_VERSION = 'b3eb5c62907effd3aef8';

    private string $pluginPath;

    /** @var array<int, array<int, mixed>> Arguments of each wp_enqueue_script() call. */
    private array $scripts = [];

    /** @var array<int, array<int, mixed>> Arguments of each wp_enqueue_style() call. */
    private array $styles = [];

    /** @var array<int, array<int, mixed>> Arguments of each wp_style_add_data() call. */
    private array $styleData = [];

    /** @var array<int, array<int, mixed>> Arguments of each wp_set_script_translations() call. */
    private array $translations = [];

    protected function setUp(): void
    {
        parent::setUp();
        Monkey\setUp();

        Functions\when('untrailingslashit')->alias(fn(string $value): string => rtrim($value, '/\\'));
        Functions\when('wp_json_encode')->alias('json_encode');
        Functions\when('wp_add_inline_script')->justReturn(true);
        Functions\when('wp_enqueue_script')->alias(function (...$args): void {
            $this->scripts[] = $args;
        });
        Functions\when('wp_enqueue_style')->alias(function (...$args): void {
            $this->styles[] = $args;
        });
        Functions\when('wp_style_add_data')->alias(function (...$args): bool {
            $this->styleData[] = $args;

            return true;
        });
        Functions\when('wp_set_script_translations')->alias(function (...$args): bool {
            $this->translations[] = $args;

            return true;
        });

        $this->pluginPath = sys_get_temp_dir() . '/elio-blocks-options-page-' . uniqid() . '/';
        mkdir($this->pluginPath . 'build/settings', 0777, true);
        file_put_contents($this->pluginPath . 'build/settings/style-index.css', '.elio-blocks-settings{}');
        file_put_contents($this->pluginPath . 'build/settings/index.js', '');
        unset($GLOBALS['elio_blocks_test_asset_reads']);
    }

    protected function tearDown(): void
    {
        foreach (['index.asset.php', 'style-index.css', 'index.js'] as $file) {
            @unlink($this->pluginPath . 'build/settings/' . $file);
        }
        rmdir($this->pluginPath . 'build/settings');
        rmdir($this->pluginPath . 'build');
        rmdir($this->pluginPath);
        unset($GLOBALS['elio_blocks_test_asset_reads']);
        $this->scripts      = [];
        $this->styles       = [];
        $this->styleData    = [];
        $this->translations = [];

        Monkey\tearDown();
        parent::tearDown();
    }

    public function test_versions_the_stylesheet_with_the_version_of_the_built_asset(): void
    {
        $this->writeAssetFile();

        $this->hook()->enqueueAssets(self::SETTINGS_PAGE);

        $this->assertSame(
            [[
                'elio-blocks-settings-style',
                self::PLUGIN_URL . 'build/settings/style-index.css',
                ['wp-components'],
                self::BUILD_VERSION,
            ]],
            $this->styles
        );
    }

    public function test_loads_the_right_to_left_copy_of_the_stylesheet(): void
    {
        $this->writeAssetFile();

        $this->hook()->enqueueAssets(self::SETTINGS_PAGE);

        // style-index-rtl.css, built next to it, in place of it on a right-to-left admin.
        $this->assertSame([['elio-blocks-settings-style', 'rtl', 'replace']], $this->styleData);
    }

    public function test_reads_the_asset_file_once_for_the_script_and_the_stylesheet(): void
    {
        $this->writeAssetFile();

        $this->hook()->enqueueAssets(self::SETTINGS_PAGE);

        $this->assertSame(1, $GLOBALS['elio_blocks_test_asset_reads']);
        $this->assertSame(
            [[
                'elio-blocks-settings',
                self::PLUGIN_URL . 'build/settings/index.js',
                ['wp-components'],
                self::BUILD_VERSION,
                true,
            ]],
            $this->scripts
        );
        $this->assertSame(self::BUILD_VERSION, $this->styles[0][3]);
    }

    public function test_loads_the_script_translations_from_the_language_packs(): void
    {
        $this->writeAssetFile();

        $this->hook()->enqueueAssets(self::SETTINGS_PAGE);

        // Handle and domain only: the language packs of translate.wordpress.org are in
        // WP_LANG_DIR/plugins, where WordPress looks by itself; the plugin ships no languages/.
        $this->assertSame([['elio-blocks-settings', 'elio-blocks']], $this->translations);
    }

    public function test_falls_back_to_the_plugin_version_when_the_asset_file_is_missing(): void
    {
        $this->hook()->enqueueAssets(self::SETTINGS_PAGE);

        $this->assertSame([], $this->scripts);
        $this->assertSame([], $this->translations);
        $this->assertSame(
            [[
                'elio-blocks-settings-style',
                self::PLUGIN_URL . 'build/settings/style-index.css',
                ['wp-components'],
                '0.0.0-test',
            ]],
            $this->styles
        );
    }

    public function test_enqueues_nothing_on_other_admin_pages(): void
    {
        $this->writeAssetFile();

        $this->hook()->enqueueAssets('index.php');

        $this->assertSame([], $this->scripts);
        $this->assertSame([], $this->styles);
        $this->assertSame([], $this->translations);
        $this->assertArrayNotHasKey('elio_blocks_test_asset_reads', $GLOBALS);
    }

    public function test_registers_a_menu_whose_settings_item_is_the_menu_page(): void
    {
        [$menu, $submenu, $hook] = $this->registerMenu();

        $this->assertSame(
            ['Elio Blocks', 'Elio', 'manage_options', 'elio-blocks-settings', [$hook, 'renderPage']],
            array_slice($menu, 0, 5)
        );
        // Same slug as the menu: the item opens the menu page, no callback of its own.
        $this->assertSame(['elio-blocks-settings', 'Elio Blocks', 'Settings', 'manage_options', 'elio-blocks-settings'], $submenu);
    }

    public function test_the_menu_icon_is_an_svg_the_admin_color_scheme_can_paint(): void
    {
        [$menu] = $this->registerMenu();
        $prefix = 'data:image/svg+xml;base64,';

        // svg-painter.js only paints base64 SVG data URIs, by rewriting their fill attributes.
        $this->assertStringStartsWith($prefix, $menu[5]);
        $svg = base64_decode(substr($menu[5], strlen($prefix)), true);
        $this->assertIsString($svg);

        $document = new \DOMDocument();
        $this->assertTrue($document->loadXML($svg));
        $this->assertSame('svg', $document->documentElement?->nodeName);
        $this->assertGreaterThan(0, $document->getElementsByTagName('path')->length);
        foreach ($document->getElementsByTagName('path') as $path) {
            $this->assertTrue($path->hasAttribute('fill'));
        }
    }

    /**
     * Runs addSettingsPage() and returns the arguments of add_menu_page() and add_submenu_page(),
     * with the hook that registered them.
     *
     * @return array{0: array<int, mixed>, 1: array<int, mixed>, 2: RegisterOptionsPage}
     */
    private function registerMenu(): array
    {
        $menu    = [];
        $submenu = [];
        Functions\when('__')->returnArg();
        Functions\when('add_menu_page')->alias(function (...$args) use (&$menu): string {
            $menu = $args;

            return self::SETTINGS_PAGE;
        });
        Functions\when('add_submenu_page')->alias(function (...$args) use (&$submenu): string {
            $submenu = $args;

            return self::SETTINGS_PAGE;
        });

        $hook = $this->hook();
        $hook->addSettingsPage();

        return [$menu, $submenu, $hook];
    }

    private function hook(): RegisterOptionsPage
    {
        return new RegisterOptionsPage($this->pluginPath, self::PLUGIN_URL, '0.0.0-test');
    }

    /**
     * Writes an asset file that counts how many times it is required.
     */
    private function writeAssetFile(): void
    {
        file_put_contents(
            $this->pluginPath . 'build/settings/index.asset.php',
            '<?php $GLOBALS["elio_blocks_test_asset_reads"] = ($GLOBALS["elio_blocks_test_asset_reads"] ?? 0) + 1;'
            . ' return array("dependencies" => array("wp-components"), "version" => ' . var_export(self::BUILD_VERSION, true) . ');'
        );
    }
}
