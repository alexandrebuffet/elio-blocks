<?php

namespace ElioBlocks\Tests\Unit\Weather;

use Brain\Monkey;
use Brain\Monkey\Functions;
use ElioBlocks\Tests\Support\WordPressCore;
use ElioBlocks\Weather\Condition\Icons\ConditionIconsRegistry;
use ElioBlocks\Weather\Condition\Icons\Hooks\RegisterConditionIcons;
use PHPUnit\Framework\TestCase;

/**
 * The plugin registers its own collection, "elio", from the manifest the
 * build writes next to the icons (build/weather-condition-icons-manifest.php).
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
        array_map('unlink', glob($this->iconsPath . '/*') ?: []);
        @unlink($this->iconsPath . '-manifest.php');
        rmdir($this->iconsPath);
        Monkey\tearDown();
        parent::tearDown();
    }

    private function writeManifest(): void
    {
        file_put_contents($this->iconsPath . '/sun.svg', '<svg viewBox="0 0 24 24"><path d="M1 1"></path></svg>');
        file_put_contents($this->iconsPath . '/moon.svg', '<svg viewBox="0 0 24 24"><path d="M2 2"></path></svg>');
        file_put_contents(
            $this->iconsPath . '-manifest.php',
            '<?php return array(
                "icons" => array(
                    "sun"  => array("label" => "Sun", "filePath" => "sun.svg", "style" => "stroke"),
                    "moon" => array("label" => "Moon", "filePath" => "moon.svg", "style" => "stroke"),
                ),
                "conditionMappings" => array(
                    array("condition" => "clear-sky", "dayOrNight" => "day", "iconSlug" => "sun"),
                    array("condition" => "mainly-clear", "dayOrNight" => "day", "iconSlug" => "sun"),
                    array("condition" => "clear-sky", "dayOrNight" => "night", "iconSlug" => "moon"),
                ),
            );'
        );
    }

    private function hook(): RegisterConditionIcons
    {
        return new RegisterConditionIcons($this->registry, $this->iconsPath . '/');
    }

    public function test_registers_the_elio_collection_with_the_icons_and_conditions_of_the_manifest(): void
    {
        $this->writeManifest();

        $this->hook()->registerDefaultCollection();

        $this->assertSame('Elio', $this->registry->getRegisteredCollection('elio')['label'] ?? null);
        $sun = $this->registry->getRegisteredIcon('elio/sun');
        $this->assertSame('Sun', $sun['label']);
        $this->assertSame('stroke', $sun['style']);
        $this->assertSame([['clear-sky', 'day'], ['mainly-clear', 'day']], $sun['conditions']);
        $this->assertStringContainsString('d="M1 1"', $sun['content']);
        $this->assertSame('elio/moon', $this->registry->getIconForCondition('elio', 'clear-sky', 'night')['name']);
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
