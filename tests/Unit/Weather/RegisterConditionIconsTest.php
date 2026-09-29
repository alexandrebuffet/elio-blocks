<?php

namespace ElioBlocks\Tests\Unit\Weather;

use Brain\Monkey;
use Brain\Monkey\Functions;
use ElioBlocks\Tests\Support\WordPressCore;
use ElioBlocks\Weather\Condition\Icons\ConditionIconsRegistry;
use ElioBlocks\Weather\Condition\Icons\Hooks\RegisterConditionIcons;
use PHPUnit\Framework\TestCase;

/**
 * The plugin registers its own collections ("elio" and its own families) from
 * the manifest the build writes next to the icons
 * (build/weather-condition-icons-manifest.php), one folder per collection.
 */
class RegisterConditionIconsTest extends TestCase
{
    private ConditionIconsRegistry $registry;

    private string $iconsPath;

    protected function setUp(): void
    {
        parent::setUp();
        Monkey\setUp();
        Functions\stubEscapeFunctions();
        Functions\when('__')->returnArg();
        WordPressCore::stubKses();

        $this->registry  = new ConditionIconsRegistry();
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

    private function writeManifest(): void
    {
        mkdir($this->iconsPath . '/elio');
        mkdir($this->iconsPath . '/cumulus-solid');
        file_put_contents($this->iconsPath . '/elio/sun.svg', '<svg viewBox="0 0 24 24"><path d="M1 1"></path></svg>');
        file_put_contents($this->iconsPath . '/elio/moon.svg', '<svg viewBox="0 0 24 24"><path d="M2 2"></path></svg>');
        file_put_contents($this->iconsPath . '/cumulus-solid/sun.svg', '<svg viewBox="0 0 24 24"><path d="M3 3"></path></svg>');
        file_put_contents(
            $this->iconsPath . '-manifest.php',
            '<?php return array(
                "collections" => array(
                    "elio" => array(
                        "label"       => "Elio",
                        "description" => "The icons of the plugin.",
                        "strokeWidth" => 1.5,
                        "icons" => array(
                            "sun"  => array("label" => "Sun", "filePath" => "sun.svg", "style" => "stroke"),
                            "moon" => array("label" => "Moon", "filePath" => "moon.svg", "style" => "stroke"),
                        ),
                        "conditionMappings" => array(
                            array("condition" => "clear-sky", "dayOrNight" => "day", "iconSlug" => "sun"),
                            array("condition" => "mainly-clear", "dayOrNight" => "day", "iconSlug" => "sun"),
                            array("condition" => "clear-sky", "dayOrNight" => "night", "iconSlug" => "moon"),
                        ),
                    ),
                    "cumulus-solid" => array(
                        "label"       => "Cumulus Solid",
                        "description" => "Soft, rounded silhouettes.",
                        "icons" => array(
                            "sun" => array("label" => "Sun", "filePath" => "sun.svg", "style" => "fill"),
                        ),
                        "conditionMappings" => array(
                            array("condition" => "clear-sky", "dayOrNight" => "day", "iconSlug" => "sun"),
                        ),
                    ),
                ),
            );'
        );
    }

    private function hook(): RegisterConditionIcons
    {
        return new RegisterConditionIcons($this->registry, $this->iconsPath . '/');
    }

    public function test_registers_every_collection_of_the_manifest_with_its_icons_and_conditions(): void
    {
        $this->writeManifest();

        $this->hook()->registerDefaultCollection();

        $this->assertSame(
            ['elio', 'cumulus-solid'],
            array_column($this->registry->getAllRegisteredCollections(), 'slug')
        );
        $this->assertSame('Elio', $this->registry->getRegisteredCollection('elio')['label'] ?? null);
        $this->assertSame('Soft, rounded silhouettes.', $this->registry->getRegisteredCollection('cumulus-solid')['description'] ?? null);
        $this->assertSame(1.5, $this->registry->getRegisteredCollection('elio')['stroke_width'] ?? null, 'The stroke width of the manifest.');
        $this->assertSame(2.0, $this->registry->getRegisteredCollection('cumulus-solid')['stroke_width'] ?? null, 'Two when the manifest says nothing.');

        $sun = $this->registry->getRegisteredIcon('elio/sun');
        $this->assertSame('Sun', $sun['label']);
        $this->assertSame('stroke', $sun['style']);
        $this->assertSame([['clear-sky', 'day'], ['mainly-clear', 'day']], $sun['conditions']);
        $this->assertStringContainsString('d="M1 1"', $sun['content']);
        $this->assertSame('elio/moon', $this->registry->getIconForCondition('elio', 'clear-sky', 'night')['name']);

        // Each collection reads its icons from its own folder.
        $solidSun = $this->registry->getRegisteredIcon('cumulus-solid/sun');
        $this->assertSame('fill', $solidSun['style']);
        $this->assertStringContainsString('d="M3 3"', $solidSun['content']);
        $this->assertSame('cumulus-solid/sun', $this->registry->getIconForCondition('cumulus-solid', 'clear-sky', 'day')['name']);
        $this->assertNull($this->registry->getIconForCondition('cumulus-solid', 'clear-sky', 'night'));
    }

    public function test_registers_nothing_without_a_manifest(): void
    {
        $this->hook()->registerDefaultCollection();

        $this->assertSame([], $this->registry->getAllRegisteredCollections());
    }

    public function test_no_third_party_can_take_the_elio_slug(): void
    {
        $this->writeManifest();
        $this->hook()->registerDefaultCollection();
        Functions\expect('_doing_it_wrong')->once();

        $this->assertFalse($this->registry->registerCollection('elio', ['label' => 'Mine']));
    }

    public function test_locks_the_registry_after_elio_blocks_init(): void
    {
        $hook = $this->hook();
        $hook->initHooks();

        $this->assertSame(20, has_action('init', [$hook, 'registerDefaultCollection']));
        $this->assertSame(26, has_action('init', [$hook, 'lockRegistry']));

        $hook->lockRegistry();
        $this->assertTrue($this->registry->isBuilt());
    }
}
