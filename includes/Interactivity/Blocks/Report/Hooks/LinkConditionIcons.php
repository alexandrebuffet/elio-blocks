<?php

namespace ElioBlocks\Interactivity\Blocks\Report\Hooks;

use ElioBlocks\Contracts\HookInterface;

// Exit if called directly.
if (! defined('ABSPATH')) {
    die;
}

/**
 * Points each condition icon printed by the server at its symbol.
 *
 * A condition-icon block is an <svg><use> whose href follows the item in
 * context: in a forecast list WordPress repeats one template per row and can
 * only print what directives bind. It does not process directives inside an
 * <svg> though, so the block binds the href on its wrapper instead
 * (data-elio-icon-href), which WordPress does print, row by row. This hook
 * then moves it into the <use>: the icons are in the page before any script
 * runs, and the browser keeps the href up to date (callbacks.linkConditionIcon).
 *
 * Directives are processed once the outermost interactive block has rendered
 * (WP_Block::render(), after its own render_block filters). Nested, the filters
 * of the blocks around it run next. At the top level of a template, a widget or
 * post content, nothing does: that block is rendered here (renderTopLevelRoot).
 * Content whose directives were not processed yet is left alone.
 */
class LinkConditionIcons implements HookInterface
{
    /**
     * Attribute the server prints on the wrapper of the block. Preceded by a
     * space: the directive that binds it (data-wp-bind--data-elio-icon-href)
     * must not match.
     */
    private const MARKER = 'data-elio-icon-href';

    /**
     * Blocks a report may be in: the report, and blocks showing content that is
     * not in the tree around them (posts, synced patterns, template parts).
     */
    private const MAY_HOLD_REPORT = array( 'elio/weather-report', 'core/post-content', 'core/block', 'core/pattern', 'core/template-part' );

    /**
     * Whether renderTopLevelRoot() is rendering a block: render_block() asks it
     * again for that block, and for the top-level blocks of any content inside.
     */
    private bool $rendering = false;

    /**
     * {@inheritDoc}
     */
    public function initHooks(): void
    {
        add_filter('render_block', array( $this, 'link' ), 10, 1);
        // Last: a block another filter rendered is left to it.
        add_filter('pre_render_block', array( $this, 'renderTopLevelRoot' ), PHP_INT_MAX, 3);
    }

    /**
     * Renders an interactive block at the top level through WordPress, then links
     * its icons: its directives are processed by the time render_block() returns.
     *
     * Only blocks a report may be in: the others, most of them images and menus,
     * render as usual. render_block() applies pre_render_block again to the block,
     * so the other filters of that hook run twice for it.
     *
     * @param mixed $preRender   What another filter rendered the block to, null otherwise.
     * @param mixed $parsedBlock Block to render.
     * @param mixed $parentBlock Parent block, null at the top level.
     * @return mixed The block, rendered and linked; $preRender to let WordPress render it.
     */
    public function renderTopLevelRoot(mixed $preRender, mixed $parsedBlock, mixed $parentBlock = null): mixed
    {
        if (
            null !== $preRender || null !== $parentBlock || $this->rendering
            || ! is_array($parsedBlock) || ! $this->isInteractive($parsedBlock) || ! $this->mayHoldReport($parsedBlock)
        ) {
            return $preRender;
        }

        $this->rendering = true;

        try {
            $content = render_block($parsedBlock);
        } finally {
            $this->rendering = false;
        }

        return $this->link($content);
    }

    /**
     * Moves the href printed on each wrapper into the <use> of its icon.
     *
     * @param mixed $content Rendered HTML (a filter before this one may have returned anything).
     * @return mixed HTML whose icons point at their symbol, anything else as is.
     */
    public function link(mixed $content): mixed
    {
        if (! is_string($content) || ! str_contains($content, ' ' . self::MARKER . '=')) {
            return $content;
        }

        $processor = new \WP_HTML_Tag_Processor($content);
        $href      = null;

        while ($processor->next_tag()) {
            $marker = $processor->get_attribute(self::MARKER);

            if (is_string($marker)) {
                // Printed once: the blocks around this one get nothing left to do.
                $processor->remove_attribute(self::MARKER);
                $href = $marker;
            } elseif (null !== $href && 'USE' === $processor->get_tag()) {
                $processor->set_attribute('href', $href);
                $href = null;
            }
        }

        return $processor->get_updated_html();
    }

    /**
     * Determines whether WordPress processes the directives of the block once it has rendered,
     * when no interactive block is around it: the test of WP_Block::render().
     *
     * @param array<mixed> $parsedBlock Parsed block.
     */
    private function isInteractive(array $parsedBlock): bool
    {
        $name     = $parsedBlock['blockName'] ?? null;
        $type     = is_string($name) ? \WP_Block_Type_Registry::get_instance()->get_registered($name) : null;
        $supports = $type?->supports['interactivity'] ?? null;

        return true === $supports || ( is_array($supports) && ! empty($supports['interactive']) );
    }

    /**
     * Determines whether a report may be in the block or in its inner blocks.
     *
     * @param array<mixed> $parsedBlock Parsed block.
     */
    private function mayHoldReport(array $parsedBlock): bool
    {
        if (in_array($parsedBlock['blockName'] ?? null, self::MAY_HOLD_REPORT, true)) {
            return true;
        }

        foreach ((array) ( $parsedBlock['innerBlocks'] ?? array() ) as $innerBlock) {
            if (is_array($innerBlock) && $this->mayHoldReport($innerBlock)) {
                return true;
            }
        }

        return false;
    }
}
