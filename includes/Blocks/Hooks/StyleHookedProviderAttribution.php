<?php

namespace ElioBlocks\Blocks\Hooks;

use ElioBlocks\Contracts\HookInterface;
use WP_Block_Type_Registry;

// Exit if called directly.
if (! defined('ABSPATH')) {
    die;
}

/**
 * Puts the provider-attribution block Block Hooks inserts in a report laid
 * out as a flex row (the Minimal variation) on a line of its own, instead of
 * a place in the row next to the temperature.
 *
 * Its size and alignment are the default of its style attribute (block.json),
 * which every way of adding it applies: Block Hooks on the server, the toggle
 * Block Hooks adds to the report inspector (createBlock()), the inserter and
 * the report variations.
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
     * Gives the block Block Hooks inserts in a flex report a line of its own.
     *
     * Its style attribute is replaced as a whole: the default one, with the
     * layout added, so it keeps its size and alignment.
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
        if (null === $parsedHookedBlock || 'flex' !== ( $parsedAnchorBlock['attrs']['layout']['type'] ?? null )) {
            return $parsedHookedBlock;
        }

        $style           = $parsedHookedBlock['attrs']['style'] ?? $this->getDefaultStyle();
        $style['layout'] = array(
            'selfStretch' => 'fixed',
            'flexSize'    => '100%',
        );

        $parsedHookedBlock['attrs']['style'] = $style;

        return $parsedHookedBlock;
    }

    /**
     * Returns the default of the style attribute of the block.
     *
     * @return array<string, mixed>
     */
    private function getDefaultStyle(): array
    {
        $blockType = WP_Block_Type_Registry::get_instance()->get_registered(self::BLOCK_NAME);
        $default   = null !== $blockType ? ( $blockType->attributes['style']['default'] ?? null ) : null;

        return is_array($default) ? $default : array();
    }
}
