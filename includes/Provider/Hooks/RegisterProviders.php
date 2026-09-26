<?php

namespace ElioBlocks\Provider\Hooks;

use ElioBlocks\Contracts\HookInterface;
use ElioBlocks\Provider\ProviderRegistry;

if (! defined('ABSPATH')) {
    die;
}

/**
 * Registers the built-in provider before the domains register what it serves,
 * then locks the registry once third parties have registered theirs on
 * elio_blocks_init.
 */
class RegisterProviders implements HookInterface
{
    /**
     * Constructor.
     *
     * @param ProviderRegistry $registry Provider registry.
     */
    public function __construct(
        private ProviderRegistry $registry,
    ) {
    }

    /**
     * {@inheritDoc}
     */
    public function initHooks(): void
    {
        // Priority 15: before the built-in weather forecast provider (20) names its provider.
        add_action('init', array( $this, 'registerBuiltInProviders' ), 15);

        // Priority 26: lock the registry, after elio_blocks_init (25).
        add_action('init', array( $this, 'lockRegistry' ), 26);
    }

    /**
     * Registers the built-in providers.
     */
    public function registerBuiltInProviders(): void
    {
        $this->registry->register(
            'open-meteo',
            array(
                'label'       => 'Open-Meteo',
                'credentials' => array(
                    // Optional: the free access needs none, a commercial subscription comes with one.
                    'api_key' => array(
                        'label'       => __('API Key', 'elio-blocks'),
                        'description' => __('Only with an Open-Meteo subscription, required for commercial use: weather data then comes from its customer API. Leave empty for the free, non-commercial access.', 'elio-blocks'),
                        'secret'      => true,
                    ),
                ),
            )
        );
    }

    /**
     * Locks the registry to prevent further registrations.
     */
    public function lockRegistry(): void
    {
        $this->registry->build();
    }
}
