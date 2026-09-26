<?php

namespace ElioBlocks\Tests\Unit\Interactivity;

use Brain\Monkey;
use ElioBlocks\Interactivity\Blocks\Report\IconSprite;
use ElioBlocks\Tests\Support\WordPressCore;
use PHPUnit\Framework\TestCase;

class IconSpriteTest extends TestCase
{
    private const SUN = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" width="24" height="24" '
        . 'class="icon" stroke-width="1.5" aria-hidden="true"><path stroke="currentColor" d="M1 1"/></svg>';

    private const MOON = '<svg viewBox="0 0 24 24"><path d="M2 2"/></svg>';

    protected function setUp(): void
    {
        parent::setUp();

        // Root attributes are removed with the HTML API of WordPress core: the real one is used.
        if (! WordPressCore::isLoaded()) {
            $this->markTestSkipped('WP_HTML_Tag_Processor needs WordPress core next to the plugin.');
        }

        Monkey\setUp();
        WordPressCore::stubDependencies();
    }

    protected function tearDown(): void
    {
        Monkey\tearDown();
        parent::tearDown();
    }

    public function test_prints_each_icon_used_as_a_symbol_blocks_point_at(): void
    {
        $sprite = new IconSprite();
        $sprite->add('sun', self::SUN);
        $sprite->add('moon', self::MOON);

        $html = $sprite->render();

        $this->assertStringContainsString('<symbol id="elio-condition-icon-sun">', $html);
        $this->assertStringContainsString('<symbol id="elio-condition-icon-moon">', $html);
        $this->assertStringContainsString('d="M1 1"', $html);
    }

    public function test_an_icon_is_printed_once_per_page_however_many_blocks_show_it(): void
    {
        $sprite = new IconSprite();
        $sprite->add('sun', self::SUN);
        $sprite->add('sun', self::SUN);
        $first = $sprite->render();

        // A second report block of the page shows the sun too.
        $sprite->add('sun', self::SUN);
        $sprite->add('moon', self::MOON);
        $second = $sprite->render();

        $this->assertSame(1, substr_count($first, 'id="elio-condition-icon-sun"'));
        $this->assertStringNotContainsString('elio-condition-icon-sun', $second);
        $this->assertStringContainsString('elio-condition-icon-moon', $second);
    }

    public function test_prints_nothing_when_no_icon_is_used(): void
    {
        $this->assertSame('', (new IconSprite())->render());
    }

    public function test_the_block_owns_size_stroke_width_and_accessibility_the_icon_keeps_its_drawing(): void
    {
        $sprite = new IconSprite();
        $sprite->add('sun', self::SUN);

        preg_match('/<symbol[^>]*>\s*(<svg[^>]*>)/', $sprite->render(), $matches);
        $root = $matches[1] ?? '';

        foreach (['width=', 'height=', 'class=', 'stroke-width=', 'aria-hidden='] as $attribute) {
            $this->assertStringNotContainsString($attribute, $root, $attribute);
        }
        $this->assertStringContainsString('viewBox="0 0 24 24"', $root);
        $this->assertStringContainsString('fill="none"', $root);
    }

    public function test_the_sprite_is_an_element_of_the_report_hidden_from_assistive_technology(): void
    {
        $sprite = new IconSprite();
        $sprite->add('sun', self::SUN);

        preg_match('/^<svg[^>]*>/', $sprite->render(), $matches);
        $container = $matches[0] ?? '';

        $this->assertStringContainsString('class="wp-block-elio-weather-report__condition-icons-sprite"', $container);
        $this->assertStringContainsString('aria-hidden="true"', $container);
        // Hidden by the stylesheet of the block (style.scss), not inline.
        $this->assertStringNotContainsString('style=', $container);
    }

    public function test_symbol_ids_come_from_the_qualified_name_and_are_safe_in_an_href(): void
    {
        $this->assertSame('elio-condition-icon-elio--sun', IconSprite::symbolId('elio/sun'));
        $this->assertSame('elio-condition-icon-sun_cloud__', IconSprite::symbolId('sun cloud">'));
    }

    public function test_two_collections_with_an_icon_of_the_same_name_get_two_symbols(): void
    {
        $sprite = new IconSprite();
        $sprite->add('elio/sun', self::SUN);
        $sprite->add('theme/sun', self::MOON);

        $html = $sprite->render();

        $this->assertStringContainsString('<symbol id="elio-condition-icon-elio--sun">', $html);
        $this->assertStringContainsString('<symbol id="elio-condition-icon-theme--sun">', $html);
    }

    public function test_inner_ids_are_prefixed_per_symbol_so_two_icons_do_not_share_a_gradient(): void
    {
        $sun  = '<svg viewBox="0 0 24 24"><linearGradient id="a"><stop offset="0" stop-color="#fff"/></linearGradient>'
            . '<path fill="url(#a)" d="M1 1"/></svg>';
        $moon = '<svg viewBox="0 0 24 24"><linearGradient id="a"><stop offset="0" stop-color="#000"/></linearGradient>'
            . '<path fill="url(#a)" d="M2 2"/></svg>';

        $sprite = new IconSprite();
        $sprite->add('elio/sun', $sun);
        $sprite->add('elio/moon', $moon);

        $html = $sprite->render();

        $this->assertStringContainsString('<linearGradient id="elio-condition-icon-elio--sun-a">', $html);
        $this->assertStringContainsString('fill="url(#elio-condition-icon-elio--sun-a)"', $html);
        $this->assertStringContainsString('<linearGradient id="elio-condition-icon-elio--moon-a">', $html);
        $this->assertStringContainsString('fill="url(#elio-condition-icon-elio--moon-a)"', $html);
        $this->assertStringNotContainsString('url(#a)', $html);
    }

    public function test_href_and_xlink_href_references_to_inner_ids_are_rewritten_too(): void
    {
        $svg = '<svg viewBox="0 0 24 24"><mask id="m"><rect/></mask><use href="#m" xlink:href="#m"/></svg>';

        $sprite = new IconSprite();
        $sprite->add('elio/sun', $svg);

        $html = $sprite->render();

        $this->assertStringContainsString('<mask id="elio-condition-icon-elio--sun-m">', $html);
        $this->assertStringContainsString('href="#elio-condition-icon-elio--sun-m"', $html);
        $this->assertStringContainsString('xlink:href="#elio-condition-icon-elio--sun-m"', $html);
        $this->assertStringNotContainsString('href="#m"', $html);
    }
}
