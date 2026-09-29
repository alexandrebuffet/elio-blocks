<?php

namespace ElioBlocks\Blocks\Hooks;

use ElioBlocks\Contracts\HookInterface;
use WP_Block_Type_Registry;

// Exit if called directly.
if (! defined('ABSPATH')) {
    die;
}

/**
 * Gives the provider-attribution block Block Hooks inserts in a report the
 * attributes of its default variation (block.json), the ones the report
 * variations and the inserter give it: a credit smaller than the report and
 * centered. As attributes, they show in its Typography panel, where they can
 * be changed, instead of a stylesheet default no panel knows about.
 */
class StyleHookedProviderAttribution implements HookInterface
{
    /**
     * Name of the hooked block.
     */
    private const BLOCK_NAME = 'elio/provider-attribution';

    /**
     * {@inheritDoc}
     */
    public function initHooks(): void
    {
        add_filter('hooked_block_' . self::BLOCK_NAME, array( $this, 'styleHookedBlock' ), 10, 4);
    }

    /**
     * Sets the attributes of the provider-attribution block Block Hooks inserts.
     *
     * In a report laid out as a flex row (the Minimal variation), the credit
     * takes a line of its own instead of a place in the row.
     *
     * @param array<string, mixed>|null $parsedHookedBlock Block about to be inserted, null if another filter removed it.
     * @param string                    $hookedBlockType   Its name.
     * @param string                    $relativePosition  Where it goes ('lastChild').
     * @param array<string, mixed>      $parsedAnchorBlock Report block it goes in.
     * @return array<string, mixed>|null
     */
    public function styleHookedBlock(
        ?array $parsedHookedBlock,
        string $hookedBlockType,
        string $relativePosition,
        array $parsedAnchorBlock
    ): ?array {
        if (null === $parsedHookedBlock) {
            return null;
        }

        $attributes = $this->getDefaultAttributes();

        if ('flex' === ( $parsedAnchorBlock['attrs']['layout']['type'] ?? null )) {
            $attributes['style']['layout'] = array(
                'selfStretch' => 'fixed',
                'flexSize'    => '100%',
            );
        }

        $parsedHookedBlock['attrs'] = array_replace_recursive($attributes, $parsedHookedBlock['attrs'] ?? array());

        return $parsedHookedBlock;
    }

    /**
     * Returns the attributes of the default variation of the block.
     *
     * @return array<string, mixed>
     */
    private function getDefaultAttributes(): array
    {
        $blockType = WP_Block_Type_Registry::get_instance()->get_registered(self::BLOCK_NAME);

        foreach (null !== $blockType ? $blockType->get_variations() : array() as $variation) {
            if (! empty($variation['isDefault']) && is_array($variation['attributes'] ?? null)) {
                return $variation['attributes'];
            }
        }

        return array();
    }
}
