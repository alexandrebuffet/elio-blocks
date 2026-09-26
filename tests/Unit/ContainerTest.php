<?php

namespace ElioBlocks\Tests\Unit;

use ElioBlocks\Contracts\HookInterface;
use ElioBlocks\Vendor\Symfony\Component\DependencyInjection\ContainerBuilder;
use PHPUnit\Framework\TestCase;

/**
 * config/services.php is wired by hand: a missing or misplaced argument only
 * shows up at runtime. This builds every service the way Plugin does.
 */
class ContainerTest extends TestCase
{
    private static ContainerBuilder $container;

    public static function setUpBeforeClass(): void
    {
        if (! defined('ELIO_BLOCKS_PLUGIN_PATH')) {
            define('ELIO_BLOCKS_PLUGIN_PATH', dirname(__DIR__, 2) . '/');
        }
        if (! defined('ELIO_BLOCKS_VERSION')) {
            define('ELIO_BLOCKS_VERSION', '0.0.0-test');
        }
        if (! defined('ELIO_BLOCKS_PLUGIN_URL')) {
            define('ELIO_BLOCKS_PLUGIN_URL', 'https://example.test/wp-content/plugins/elio-blocks/');
        }

        self::$container = new ContainerBuilder();
        ( require ELIO_BLOCKS_PLUGIN_PATH . 'config/services.php' )(self::$container);
        self::$container->compile();
    }

    public function test_every_hookable_service_can_be_built_and_implements_the_hook_contract(): void
    {
        $ids = array_keys(self::$container->findTaggedServiceIds('elio_blocks.hookable'));

        $this->assertNotEmpty($ids);

        foreach ($ids as $id) {
            $this->assertInstanceOf(HookInterface::class, self::$container->get($id), $id);
        }
    }

    public function test_every_public_service_can_be_built(): void
    {
        foreach (self::$container->getServiceIds() as $id) {
            if ('service_container' === $id) {
                continue;
            }

            $this->assertIsObject(self::$container->get($id), $id);
        }
    }
}
