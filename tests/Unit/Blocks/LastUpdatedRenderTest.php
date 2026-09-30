<?php

namespace ElioBlocks\Tests\Unit\Blocks;

use Brain\Monkey;
use Brain\Monkey\Functions;
use PHPUnit\Framework\TestCase;

/**
 * The last-updated block prints when the provider was asked: a <time> the
 * derived state fills (lastUpdatedDatetime, formattedLastUpdated), after a
 * prefix that says what the time is.
 */
class LastUpdatedRenderTest extends TestCase
{
    use RendersBlocks;

    protected function setUp(): void
    {
        parent::setUp();
        Monkey\setUp();

        $this->stubRenderFunctions();
        Functions\when('get_option')->justReturn('');
        Functions\when('wp_interactivity_state')->justReturn([]);
    }

    protected function tearDown(): void
    {
        Monkey\tearDown();
        parent::tearDown();
    }

    public function test_prints_the_time_in_a_time_element_the_derived_state_fills(): void
    {
        $html = $this->renderBlock('last-updated');

        $this->assertStringContainsString(
            '<time class="wp-block-elio-last-updated__value" data-wp-bind--datetime="state.lastUpdatedDatetime" '
            . 'data-wp-text="state.formattedLastUpdated"></time>',
            $html
        );
        $this->assertStringContainsString('class="elio-tabular-nums"', $html);
    }

    public function test_says_updated_without_a_prefix_of_its_own(): void
    {
        $html = $this->renderBlock('last-updated');

        $this->assertStringContainsString('<span class="wp-block-elio-last-updated__prefix">Updated</span>', $html);
    }

    public function test_prints_its_own_prefix(): void
    {
        $html = $this->renderBlock('last-updated', ['prefix' => 'Refreshed at']);

        $this->assertStringContainsString('<span class="wp-block-elio-last-updated__prefix">Refreshed at</span>', $html);
    }

    public function test_prints_no_prefix_when_emptied_or_hidden(): void
    {
        $this->assertStringNotContainsString('__prefix', $this->renderBlock('last-updated', ['prefix' => '']));
        $this->assertStringNotContainsString('__prefix', $this->renderBlock('last-updated', ['showPrefix' => false]));
    }

    public function test_gives_the_view_script_its_format(): void
    {
        $this->assertSame(['format' => ''], $this->contextOf($this->renderBlock('last-updated')));
        $this->assertSame(
            ['format' => 'H:i T'],
            $this->contextOf($this->renderBlock('last-updated', ['format' => 'H:i T']))
        );
    }

    public function test_has_no_aria_live_region(): void
    {
        // Announcing the time on every automatic refresh would be noise for screen readers.
        $this->assertStringNotContainsString('aria-live', $this->renderBlock('last-updated'));
    }
}
