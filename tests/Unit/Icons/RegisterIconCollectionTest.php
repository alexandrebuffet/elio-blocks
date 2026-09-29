<?php

namespace ElioBlocks\Tests\Unit\Icons;

use Brain\Monkey;
use Brain\Monkey\Functions;
use ElioBlocks\Icons\Hooks\RegisterIconCollection;
use PHPUnit\Framework\TestCase;

/**
 * The plugin registers its icons with the Icons API of WordPress 7.1, as the
 * "elio" collection, from the manifest the build writes next to them
 * (build/icons-manifest.php): every icon, by file path.
 */
class RegisterIconCollectionTest extends TestCase
{
    private string $iconsPath;

    /** @var list<array{0: string, 1: array<string, mixed>}> */
    private array $collections = [];

    /** @var list<array{0: string, 1: array<string, mixed>}> */
    private array $icons = [];

    protected function setUp(): void
    {
        parent::setUp();
        Monkey\setUp();

        $this->iconsPath = sys_get_temp_dir() . '/elio-blocks-icons-' . uniqid();
        mkdir($this->iconsPath);
    }

    protected function tearDown(): void
    {
        array_map('unlink', glob($this->iconsPath . '/*/*') ?: []);
        array_map('rmdir', glob($this->iconsPath . '/*') ?: []);
        @unlink($this->iconsPath . '-manifest.php');
        rmdir($this->iconsPath);
        Monkey\tearDown();
        parent::tearDown();
    }

    /**
     * Records what the plugin registers with the API.
     *
     * @param bool $accepted What wp_register_icon_collection() answers.
     */
    private function stubIconsApi(bool $accepted = true): void
    {
        Functions\when('wp_register_icon_collection')->alias(function (string $slug, array $args) use ($accepted): bool {
            $this->collections[] = [$slug, $args];
            return $accepted;
        });
        Functions\when('wp_register_icon')->alias(function (string $name, array $args): bool {
            $this->icons[] = [$name, $args];
            return true;
        });
    }

    private function writeManifest(string $icons = ''): void
    {
        mkdir($this->iconsPath . '/elio');
        file_put_contents($this->iconsPath . '/elio/sun.svg', '<svg viewBox="0 0 24 24"><path d="M1 1"/></svg>');
        file_put_contents($this->iconsPath . '/elio/moon.svg', '<svg viewBox="0 0 24 24"><path d="M2 2"/></svg>');
        file_put_contents(
            $this->iconsPath . '-manifest.php',
            '<?php return array(
                "slug"        => "elio",
                "label"       => "Elio",
                "description" => "The icons of the plugin.",
                "icons"       => array(' . ( $icons ?: '
                    "sun"  => array("label" => "Sun", "filePath" => "sun.svg"),
                    "moon" => array("label" => "Moon", "filePath" => "moon.svg"),
                ' ) . '),
            );'
        );
    }

    private function hook(): RegisterIconCollection
    {
        return new RegisterIconCollection($this->iconsPath . '/');
    }

    public function test_registers_the_collection_then_every_icon_of_the_manifest_by_file_path(): void
    {
        $this->writeManifest();
        $this->stubIconsApi();

        $this->hook()->registerCollection();

        $this->assertSame(
            [['elio', ['label' => 'Elio', 'description' => 'The icons of the plugin.']]],
            $this->collections
        );
        $this->assertSame(
            [
                ['elio/sun', ['label' => 'Sun', 'file_path' => $this->iconsPath . '/elio/sun.svg']],
                ['elio/moon', ['label' => 'Moon', 'file_path' => $this->iconsPath . '/elio/moon.svg']],
            ],
            $this->icons
        );
    }

    public function test_registers_no_icon_when_the_collection_is_refused(): void
    {
        $this->writeManifest();
        $this->stubIconsApi(false);

        $this->hook()->registerCollection();

        $this->assertCount(1, $this->collections);
        $this->assertSame([], $this->icons);
    }

    public function test_skips_an_icon_without_a_file_path(): void
    {
        $this->writeManifest('
            "sun"  => array("label" => "Sun"),
            "moon" => array("label" => "Moon", "filePath" => "moon.svg"),
        ');
        $this->stubIconsApi();

        $this->hook()->registerCollection();

        $this->assertSame(['elio/moon'], array_column($this->icons, 0));
    }

    public function test_registers_nothing_without_a_manifest(): void
    {
        $this->stubIconsApi();

        $this->hook()->registerCollection();

        $this->assertSame([], $this->collections);
        $this->assertSame([], $this->icons);
    }

    public function test_registers_on_init_where_the_core_registers_its_own_icons(): void
    {
        $hook = $this->hook();
        $hook->initHooks();

        $this->assertSame(10, has_action('init', [$hook, 'registerCollection']));
    }
}
