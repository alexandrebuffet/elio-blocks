<?php

namespace ElioBlocks\Tests\Unit\Interactivity;

use Brain\Monkey;
use Brain\Monkey\Functions;
use ElioBlocks\Interactivity\Blocks\Report\Hooks\LinkConditionIcons;
use ElioBlocks\Tests\Support\WordPressCore;
use PHPUnit\Framework\TestCase;

/**
 * WordPress does not process directives inside an <svg>: it prints the href of
 * each condition icon on the wrapper of the block (data-elio-icon-href), and
 * this filter moves it into the <use> once directives have been processed.
 */
class LinkConditionIconsTest extends TestCase
{
    /** @var list<string> Blocks render_block() was asked to render. */
    private array $rendered = [];

    protected function setUp(): void
    {
        parent::setUp();

        if (! WordPressCore::isLoaded()) {
            $this->markTestSkipped('WP_HTML_Tag_Processor needs WordPress core next to the plugin.');
        }

        Monkey\setUp();
        WordPressCore::stubDependencies();

        // What block.json says: blocks that WordPress processes directives for once they have rendered.
        foreach (['elio/weather-report', 'core/accordion', 'core/query', 'core/image'] as $name) {
            \WP_Block_Type_Registry::get_instance()->register(new \WP_Block_Type($name, ['interactivity' => true]));
        }
        \WP_Block_Type_Registry::get_instance()->register(new \WP_Block_Type('core/group'));
    }

    protected function tearDown(): void
    {
        foreach (['elio/weather-report', 'core/accordion', 'core/query', 'core/image', 'core/group'] as $name) {
            \WP_Block_Type_Registry::get_instance()->unregister($name);
        }
        Monkey\tearDown();
        parent::tearDown();
    }

    /**
     * Returns a condition-icon block once WordPress processed its directives.
     */
    private function icon(?string $href): string
    {
        $marker = null !== $href ? sprintf(' data-elio-icon-href="%s"', $href) : '';

        return sprintf(
            '<div class="wp-block-elio-condition-icon" data-wp-bind--data-elio-icon-href="state.conditionIconHref"%s>'
            . '<svg aria-hidden="true"><use></use></svg></div>',
            $marker
        );
    }

    public function test_each_icon_points_at_the_symbol_printed_on_its_block(): void
    {
        $rows = '<ol><li data-wp-each-child>' . $this->icon('#elio-condition-icon-sun') . '</li>'
            . '<li data-wp-each-child>' . $this->icon('#elio-condition-icon-rain') . '</li></ol>';

        $html = (new LinkConditionIcons())->link($rows);

        $this->assertSame(
            ['#elio-condition-icon-sun', '#elio-condition-icon-rain'],
            preg_match_all('/<use[^>]* href="([^"]*)"/', $html, $matches) ? $matches[1] : []
        );
    }

    public function test_the_marker_is_removed_so_outer_blocks_do_not_process_it_again(): void
    {
        $html = (new LinkConditionIcons())->link($this->icon('#elio-condition-icon-sun'));

        $this->assertStringNotContainsString(' data-elio-icon-href=', $html);
        $this->assertStringContainsString('data-wp-bind--data-elio-icon-href=', $html, 'The directive stays for the browser.');
    }

    public function test_an_icon_without_symbol_stays_empty(): void
    {
        $html = (new LinkConditionIcons())->link($this->icon(null));

        $this->assertDoesNotMatchRegularExpression('/<use[^>]* href=/', $html);
    }

    public function test_content_whose_directives_were_not_processed_yet_is_left_alone(): void
    {
        $template = '<template data-wp-each--item="context.forecastItems"><li>' . $this->icon(null) . '</li></template>';

        $this->assertSame($template, (new LinkConditionIcons())->link($template));
    }

    public function test_leaves_what_is_not_html_alone(): void
    {
        // Another filter of render_block or the_content may have returned anything.
        $this->assertNull((new LinkConditionIcons())->link(null));
    }

    public function test_runs_where_directives_have_been_processed(): void
    {
        $hook = new LinkConditionIcons();
        $hook->initHooks();

        // The blocks around a nested interactive block, and interactive blocks at the top level.
        $this->assertNotFalse(has_filter('render_block', [$hook, 'link']));
        $this->assertNotFalse(has_filter('pre_render_block', [$hook, 'renderTopLevelRoot']));
    }

    /**
     * Builds a parsed block.
     *
     * @param array<string, mixed> ...$innerBlocks
     * @return array<string, mixed> Parsed block.
     */
    private function block(string $name, array ...$innerBlocks): array
    {
        return ['blockName' => $name, 'attrs' => [], 'innerBlocks' => $innerBlocks, 'innerHTML' => '', 'innerContent' => []];
    }

    /**
     * Stubs render_block() as WordPress runs it, rendering the block and processing its directives:
     * it ends with them when the block is the outermost interactive one.
     */
    private function renderBlockProcessesDirectives(): void
    {
        Functions\when('render_block')->alias(
            function (array $block): string {
                $this->rendered[] = $block['blockName'];

                return $this->icon('#elio-condition-icon-sun');
            }
        );
    }

    public function test_a_report_at_the_top_level_of_a_template_or_a_widget_is_linked(): void
    {
        // Nothing runs after it in a template: do_blocks() returns what render_block() does.
        $this->renderBlockProcessesDirectives();
        $report = $this->block('elio/weather-report');

        $html = (new LinkConditionIcons())->renderTopLevelRoot(null, $report, null);

        $this->assertMatchesRegularExpression('/<use[^>]* href="#elio-condition-icon-sun"/', (string) $html);
    }

    public function test_an_interactive_block_holding_a_report_at_the_top_level_is_linked(): void
    {
        $this->renderBlockProcessesDirectives();
        $hook = new LinkConditionIcons();

        foreach (
            [
                $this->block('core/accordion', $this->block('core/group', $this->block('elio/weather-report'))),
                // A report may be in the posts a query lists, or in a synced pattern: not in the tree.
                $this->block('core/query', $this->block('core/post-template', $this->block('core/post-content'))),
                $this->block('core/accordion', $this->block('core/block')),
            ] as $root
        ) {
            $html = $hook->renderTopLevelRoot(null, $root, null);

            $this->assertMatchesRegularExpression('/<use[^>]* href=/', (string) $html, $root['blockName']);
        }
    }

    public function test_leaves_other_blocks_to_wordpress(): void
    {
        $this->renderBlockProcessesDirectives();
        $hook = new LinkConditionIcons();

        // Nested: the filters of the blocks around it link it.
        $this->assertNull($hook->renderTopLevelRoot(null, $this->block('elio/weather-report'), new \WP_Block()));
        // Not interactive: its own render_block filters run after the directives inside it.
        $this->assertNull($hook->renderTopLevelRoot(null, $this->block('core/group', $this->block('elio/weather-report')), null));
        // Interactive, but no report can be in it: an image, a menu.
        $this->assertNull($hook->renderTopLevelRoot(null, $this->block('core/image'), null));
        // Rendered by another filter already.
        $this->assertSame('<p>cached</p>', $hook->renderTopLevelRoot('<p>cached</p>', $this->block('elio/weather-report'), null));

        $this->assertSame([], $this->rendered);
    }

    public function test_lets_wordpress_render_the_block_it_asks_for_again(): void
    {
        $hook  = new LinkConditionIcons();
        $again = 'not asked';
        Functions\when('render_block')->alias(
            function (array $block) use ($hook, &$again): string {
                // render_block() applies pre_render_block again, to the same block.
                $again = $hook->renderTopLevelRoot(null, $block, null);

                return $this->icon('#elio-condition-icon-sun');
            }
        );

        $hook->renderTopLevelRoot(null, $this->block('elio/weather-report'), null);

        $this->assertNull($again, 'Rendered by WordPress, not by this filter again.');
    }
}
