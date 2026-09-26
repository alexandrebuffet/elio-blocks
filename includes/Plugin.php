<?php

namespace ElioBlocks;

use ElioBlocks\Vendor\Symfony\Component\DependencyInjection\ContainerBuilder;
use ElioBlocks\Contracts\HookInterface;

// Exit if called directly.
if (! defined('ABSPATH')) {
    die;
}

/**
 * Plugin singleton that wires the service container and registers WordPress hooks.
 */
class Plugin
{
    /**
     * Singleton instance.
     *
     * @var self|null
     */
    private static ?self $instance = null;

    /**
     * Service container.
     *
     * @var ContainerBuilder
     */
    private ContainerBuilder $container;

    /**
     * Hook registrars.
     *
     * @var HookInterface[]
     */
    private array $hooks = array();

    /**
     * Private constructor — use instance() instead.
     */
    private function __construct()
    {
        $this->container = new ContainerBuilder();
        ( require ELIO_BLOCKS_PLUGIN_PATH . 'config/services.php' )($this->container);
        $this->container->compile();

        foreach (array_keys($this->container->findTaggedServiceIds('elio_blocks.hookable')) as $id) {
            /** @var HookInterface $hook */
            $hook          = $this->container->get($id);
            $this->hooks[] = $hook;
        }
    }

    /**
     * Returns the singleton instance.
     *
     * @return self
     */
    public static function instance(): self
    {
        if (null === self::$instance) {
            self::$instance = new self();
        }

        return self::$instance;
    }

    /**
     * Runs the plugin: registers all WordPress hooks.
     */
    public function run(): void
    {
        foreach ($this->hooks as $hook) {
            $hook->initHooks();
        }
    }

    /**
     * Returns the service container.
     *
     * @return ContainerBuilder
     */
    public function container(): ContainerBuilder
    {
        return $this->container;
    }
}
