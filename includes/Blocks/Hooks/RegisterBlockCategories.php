<?php

namespace ElioBlocks\Blocks\Hooks;

use ElioBlocks\Contracts\HookInterface;

// Exit if called directly.
if (! defined('ABSPATH')) {
    die;
}

/**
 * Registers custom block categories.
 */
class RegisterBlockCategories implements HookInterface
{
    /**
     * {@inheritDoc}
     */
    public function initHooks(): void
    {
        add_filter('block_categories_all', array( $this, 'registerBlockCategories' ));
    }

    /**
     * Adds the Weather block category.
     *
     * @param list<array<string, mixed>> $categories Existing block categories.
     * @return list<array<string, mixed>>
     */
    public function registerBlockCategories(array $categories): array
    {
        return array_merge(
            $categories,
            array(
                array(
                    'slug'  => 'elio-weather',
                    'title' => __('Weather', 'elio-blocks'),
                ),
            )
        );
    }
}
