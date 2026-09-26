<?php

namespace ElioBlocks\Interactivity\Blocks\Report;

// Exit if called directly.
if (! defined('ABSPATH')) {
    die;
}

/**
 * Condition icons of the page, printed once each as SVG symbols.
 *
 * A directive can set an attribute but not write markup: inside a forecast
 * list, WordPress repeats one template per row and can only bind attributes
 * in it. Each condition-icon block is therefore an <svg><use href="#…"> that
 * points at the icon of its item (DerivedState::conditionIconHref, moved into
 * the <use> by LinkConditionIcons), and the icons themselves are printed here,
 * once per page, by the report block. The page shows every icon before any
 * script runs.
 *
 * Icons a refresh brings later are added by the browser (src/shared/icon-sprite.js).
 *
 * Registered as a singleton in the DI container: condition-icon blocks add the
 * icons they show, the report block prints them before its inner blocks (which
 * are rendered by then).
 */
final class IconSprite
{
    /**
     * Root attributes of an icon that belong to the block drawing it (size,
     * stroke width, accessibility), not to the symbol. Same list as
     * BLOCK_OWNED_ATTRIBUTES in src/shared/icon-sprite.js.
     */
    private const BLOCK_OWNED_ATTRIBUTES = array(
        'id',
        'class',
        'style',
        'width',
        'height',
        'x',
        'y',
        'stroke-width',
        'role',
        'aria-hidden',
        'aria-label',
        'focusable',
    );

    /**
     * Icons shown since the last render, by qualified name: SVG markup.
     *
     * @var array<string, string>
     */
    private array $pending = array();

    /**
     * Icons already printed in the page, by qualified name.
     *
     * @var array<string, true>
     */
    private array $printed = array();

    /**
     * Returns the id of the symbol of an icon, from its qualified name ("elio/sun"). Same as symbolId() in JS.
     */
    public static function symbolId(string $name): string
    {
        return 'elio-condition-icon-' . preg_replace('/[^A-Za-z0-9_-]/', '_', str_replace('/', '--', $name));
    }

    /**
     * Records an icon a block shows.
     *
     * @param string $name Qualified icon name.
     * @param string $svg  Sanitized SVG markup (ConditionIconsRegistry).
     */
    public function add(string $name, string $svg): void
    {
        if (! isset($this->printed[ $name ])) {
            $this->pending[ $name ] = $svg;
        }
    }

    /**
     * Renders the symbols of the icons shown since the last call and not printed yet.
     *
     * @return string Hidden <svg> holding the symbols, empty when there is none.
     */
    public function render(): string
    {
        $symbols = '';

        foreach ($this->pending as $name => $svg) {
            $symbols                .= $this->symbol($name, $svg);
            $this->printed[ $name ] = true;
        }

        $this->pending = array();

        if ('' === $symbols) {
            return '';
        }

        // An element of the report block, hidden by its stylesheet (style.scss).
        return '<svg xmlns="http://www.w3.org/2000/svg" class="wp-block-elio-weather-report__condition-icons-sprite"'
            . ' aria-hidden="true" focusable="false">' . $symbols . '</svg>';
    }

    /**
     * Builds the symbol of an icon, the icon inside it: the nested <svg> keeps
     * its viewBox and paint attributes and fills the <use> that points at it.
     *
     * Icon exports routinely reuse the same inner ids (a gradient named "a" in
     * every file): each icon's ids are prefixed with its symbol id so two
     * icons in one sprite never share a gradient, clipPath or mask.
     *
     * @param string $name Qualified icon name.
     * @param string $svg  SVG markup.
     */
    private function symbol(string $name, string $svg): string
    {
        $processor = new \WP_HTML_Tag_Processor($svg);

        if (! $processor->next_tag(array( 'tag_name' => 'svg' ))) {
            return '';
        }

        foreach (self::BLOCK_OWNED_ATTRIBUTES as $attribute) {
            $processor->remove_attribute($attribute);
        }

        $prefix = self::symbolId($name) . '-';
        $ids    = array();

        while ($processor->next_tag()) {
            $id = $processor->get_attribute('id');

            if (is_string($id) && '' !== $id) {
                $ids[ $id ] ??= $prefix . $id;
                $processor->set_attribute('id', $ids[ $id ]);
            }
        }

        $markup = self::rewriteIdReferences($processor->get_updated_html(), $ids);

        // The id only holds [A-Za-z0-9_-] (symbolId()).
        return '<symbol id="' . self::symbolId($name) . '">' . $markup . '</symbol>';
    }

    /**
     * Rewrites what points at the ids renamed by symbol(): url(#id) (fill,
     * stroke, clip-path, mask) and href/xlink:href. Same as prefixInnerIds()
     * in src/shared/icon-sprite.js.
     *
     * @param string                $markup SVG markup, ids already renamed.
     * @param array<string, string> $ids    Old id => new id.
     */
    private static function rewriteIdReferences(string $markup, array $ids): string
    {
        foreach ($ids as $old => $new) {
            $quoted = preg_quote($old, '/');
            $markup = (string) preg_replace(
                '/url\(\s*([\'"]?)#' . $quoted . '\1\s*\)/',
                'url($1#' . $new . '$1)',
                $markup
            );
            $markup = (string) preg_replace(
                '/((?:xlink:)?href)="#' . $quoted . '"/',
                '$1="#' . $new . '"',
                $markup
            );
        }

        return $markup;
    }
}
