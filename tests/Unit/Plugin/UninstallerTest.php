<?php

namespace ElioBlocks\Tests\Unit\Plugin;

use Brain\Monkey;
use Brain\Monkey\Functions;
use ElioBlocks\Plugin\Uninstaller;
use ElioBlocks\Settings\PluginSettings;
use ElioBlocks\Tests\Stub\ArrayCache;
use PHPUnit\Framework\TestCase;

class UninstallerTest extends TestCase
{
    /** @var list<string> */
    private array $deleted = array();

    protected function setUp(): void
    {
        parent::setUp();
        Monkey\setUp();

        Functions\when('delete_option')->alias(
            function (string $name): bool {
                $this->deleted[] = $name;

                return true;
            }
        );
    }

    protected function tearDown(): void
    {
        Monkey\tearDown();
        parent::tearDown();
    }

    private function settings(bool $cleanupEnabled): PluginSettings
    {
        Functions\when('get_option')->alias(
            static fn(string $name, $default = false) => PluginSettings::OPTION_CLEANUP_ON_DELETE === $name ? $cleanupEnabled : $default
        );

        return new PluginSettings();
    }

    public function test_removes_every_stored_option_including_provider_credentials(): void
    {
        (new Uninstaller($this->settings(true), new ArrayCache()))->cleanup();

        $expected = PluginSettings::optionNames();
        sort($expected);
        sort($this->deleted);

        $this->assertSame($expected, $this->deleted);
        $this->assertContains(PluginSettings::OPTION_PROVIDER_CREDENTIALS, $this->deleted);
        $this->assertContains(PluginSettings::OPTION_WIND_UNIT, $this->deleted);
    }

    public function test_purges_cached_weather_data(): void
    {
        $cache = new ArrayCache();
        $cache->set('k', array( 'current' => array() ));

        (new Uninstaller($this->settings(true), $cache))->cleanup();

        $this->assertSame(array(), $cache->entries);
    }

    public function test_keeps_everything_when_the_site_owner_disabled_cleanup_on_delete(): void
    {
        $cache = new ArrayCache();
        $cache->set('k', array( 'current' => array() ));

        (new Uninstaller($this->settings(false), $cache))->cleanup();

        $this->assertSame(array(), $this->deleted);
        $this->assertCount(1, $cache->entries);
    }
}
