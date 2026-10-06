<?php

namespace ElioBlocks\Tests\Unit\BlockEditor;

use Brain\Monkey;
use Brain\Monkey\Functions;
use ElioBlocks\BlockEditor\Hooks\EnqueueBlockEditorAssets;
use ElioBlocks\Interactivity\Blocks\Report\DateSettings;
use PHPUnit\Framework\TestCase;

class EnqueueBlockEditorAssetsTest extends TestCase
{
    private const PLUGIN_URL    = 'https://example.test/wp-content/plugins/elio-blocks/';
    private const BUILD_VERSION = '93b16fbd9d508ecd2863';

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

        Functions\when('get_option')->returnArg(2);
        Functions\when('get_locale')->justReturn('ru_RU');
        Functions\when('get_translations_for_domain')->justReturn(new class {
            public function translate(string $text, ?string $context = null): string
            {
                return 'decline months names: on or off' === $context ? 'on' : $text;
            }
        });
        Functions\when('wp_json_encode')->alias('json_encode');
        Functions\when('untrailingslashit')->alias(fn(string $value): string => rtrim($value, '/\\'));
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

        $this->pluginPath = sys_get_temp_dir() . '/elio-blocks-block-editor-' . uniqid() . '/';
        mkdir($this->pluginPath . 'build/block-editor', 0777, true);

        $GLOBALS['wp_locale'] = (object) [
            'month'          => ['01' => 'Январь'],
            'month_genitive' => ['01' => 'января'],
            'month_abbrev'   => ['Январь' => 'Янв'],
            'weekday'        => [0 => 'Воскресенье'],
            'weekday_abbrev' => ['Воскресенье' => 'Вс'],
            'meridiem'       => ['am' => 'am', 'pm' => 'pm', 'AM' => 'AM', 'PM' => 'PM'],
        ];
    }

    protected function tearDown(): void
    {
        unset($GLOBALS['wp_locale']);
        @unlink($this->pluginPath . 'build/block-editor/index.asset.php');
        @unlink($this->pluginPath . 'build/block-editor/style-index.css');
        rmdir($this->pluginPath . 'build/block-editor');
        rmdir($this->pluginPath . 'build');
        rmdir($this->pluginPath);
        $this->scripts      = [];
        $this->styles       = [];
        $this->styleData    = [];
        $this->translations = [];
        Monkey\tearDown();
        parent::tearDown();
    }

    public function test_gives_the_editor_the_date_settings_of_the_front_which_decline_month_names(): void
    {
        $inline = [];
        Functions\when('wp_add_inline_script')->alias(
            function (string $handle, string $script, string $position) use (&$inline): bool {
                $inline[] = [$handle, $script, $position];

                return true;
            }
        );

        $this->hook()->addDateSettings();

        $this->assertCount(1, $inline);
        [$handle, $script, $position] = $inline[0];
        $this->assertSame(['elio-blocks-block-editor', 'before'], [$handle, $position]);
        // @wordpress/date has neither the genitive names nor the setting to use them.
        $this->assertMatchesRegularExpression('/^window\.elioBlocksDateSettings = (.+);$/s', $script);
        preg_match('/^window\.elioBlocksDateSettings = (.+);$/s', $script, $json);
        $this->assertSame(
            json_decode((string) json_encode(DateSettings::fromSite()), true),
            json_decode($json[1], true)
        );
    }

    public function test_loads_the_script_translations_from_the_language_packs(): void
    {
        $this->writeAssetFile();

        $this->hook()->enqueueBlockEditorScript();

        $this->assertSame(
            [[
                'elio-blocks-block-editor',
                self::PLUGIN_URL . 'build/block-editor/index.js',
                ['wp-blocks', 'wp-i18n'],
                self::BUILD_VERSION,
                true,
            ]],
            $this->scripts
        );
        // Handle and domain only: the language packs of translate.wordpress.org are in
        // WP_LANG_DIR/plugins, where WordPress looks by itself; the plugin ships no languages/.
        $this->assertSame([['elio-blocks-block-editor', 'elio-blocks']], $this->translations);
    }

    public function test_enqueues_nothing_when_the_build_is_missing(): void
    {
        $this->hook()->enqueueBlockEditorScript();
        $this->hook()->enqueueBlockEditorStyle();

        $this->assertSame([], $this->scripts);
        $this->assertSame([], $this->translations);
        $this->assertSame([], $this->styles);
        $this->assertSame([], $this->styleData);
    }

    public function test_enqueues_the_stylesheet_with_its_right_to_left_copy(): void
    {
        $this->writeAssetFile();
        file_put_contents($this->pluginPath . 'build/block-editor/style-index.css', '.weather-location-control{}');

        $this->hook()->enqueueBlockEditorStyle();

        $this->assertSame(
            [[
                'elio-blocks-block-editor',
                self::PLUGIN_URL . 'build/block-editor/style-index.css',
                [],
                self::BUILD_VERSION,
            ]],
            $this->styles
        );
        // style-index-rtl.css, built next to it, in place of it on a right-to-left admin.
        $this->assertSame([['elio-blocks-block-editor', 'rtl', 'replace']], $this->styleData);
    }

    private function hook(): EnqueueBlockEditorAssets
    {
        return new EnqueueBlockEditorAssets($this->pluginPath, self::PLUGIN_URL);
    }

    private function writeAssetFile(): void
    {
        file_put_contents(
            $this->pluginPath . 'build/block-editor/index.asset.php',
            '<?php return array("dependencies" => array("wp-blocks", "wp-i18n"), "version" => ' . var_export(self::BUILD_VERSION, true) . ');'
        );
    }
}
