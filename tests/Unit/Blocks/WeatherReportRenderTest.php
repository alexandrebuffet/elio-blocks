<?php

namespace ElioBlocks\Tests\Unit\Blocks;

use Brain\Monkey;
use Brain\Monkey\Functions;
use ElioBlocks\Interactivity\Blocks\Report\IconSprite;
use ElioBlocks\Tests\Support\WordPressCore;
use PHPUnit\Framework\TestCase;
use WP_Block;

class WeatherReportRenderTest extends TestCase
{
    use RendersBlocks;

    private const STATE   = ['weatherForecastUrl' => 'https://example.test/wp-json/elio/v1/weather-forecast', 'dataTtl' => 1800000];
    private const CONTEXT = ['location' => ['name' => 'Paris'], 'signature' => 'abc'];

    private IconSprite $sprite;

    /** @var array<string, array<string, mixed>> State given to wp_interactivity_state(), by store. */
    private array $state = [];

    protected function setUp(): void
    {
        parent::setUp();

        // The sprite reads icons with the HTML API of WordPress core: the real one is used.
        if (! WordPressCore::isLoaded()) {
            $this->markTestSkipped('WP_HTML_Tag_Processor needs WordPress core next to the plugin.');
        }

        Monkey\setUp();
        $this->stubRenderFunctions();

        Functions\when('elio_blocks_get_weather_report_interactivity_state')->justReturn(self::STATE);
        Functions\when('elio_blocks_get_weather_report_interactivity_context')->alias(static fn(WP_Block $block): array => self::CONTEXT);
        Functions\when('wp_interactivity_state')->alias(
            function (string $store, array $state = []): array {
                $this->state[$store] = $state;

                return $state;
            }
        );
        Functions\when('tag_escape')->returnArg();

        $this->sprite = new IconSprite();
        $this->stubIconSpriteFunctions($this->sprite);
    }

    protected function tearDown(): void
    {
        Monkey\tearDown();
        parent::tearDown();
    }

    public function test_prints_the_icons_its_blocks_show_before_them_inside_the_block(): void
    {
        // What its condition-icon blocks did while they rendered, before the report.
        $this->sprite->add('sun', '<svg viewBox="0 0 24 24"><path d="M1 1"></path></svg>');

        $html = $this->renderBlock('weather-report', [], [], '<p>inner blocks</p>');

        // A browser drawing the page as it arrives meets each symbol before the icons using it.
        $this->assertMatchesRegularExpression(
            '#^\s*<section[^>]*>\s*<svg[^>]*class="wp-block-elio-weather-report__condition-icons-sprite"[^>]*><symbol id="elio-condition-icon-sun">.*</svg>\s*<p>inner blocks</p>#s',
            $html
        );
    }

    public function test_prints_no_sprite_when_its_blocks_show_no_icon(): void
    {
        $html = $this->renderBlock('weather-report', [], [], '<p>inner blocks</p>');

        $this->assertStringNotContainsString('wp-block-elio-weather-report__condition-icons-sprite', $html);
    }

    public function test_puts_the_state_of_the_store_in_the_page(): void
    {
        $this->renderBlock('weather-report');

        $this->assertSame(['elio/weather-report' => self::STATE], $this->state);
    }

    public function test_the_wrapper_carries_the_context_of_the_block_and_the_directives_of_the_store(): void
    {
        $html = $this->renderBlock('weather-report');

        $this->assertSame(self::CONTEXT, $this->contextOf($html));
        $this->assertStringContainsString('data-wp-interactive="elio/weather-report"', $html);
        $this->assertStringContainsString('data-wp-init="actions.init"', $html);
        $this->assertStringContainsString('data-wp-watch="callbacks.startAutoRefresh"', $html);
        $this->assertStringContainsString('data-wp-on--weather-refresh="actions.fetch"', $html);
        $this->assertStringContainsString('data-wp-on-document--visibilitychange="actions.catchUp"', $html);
        $this->assertStringContainsString('data-wp-on-window--online="actions.catchUp"', $html);
    }

    public function test_prints_the_tag_name_chosen_in_the_editor(): void
    {
        $html = $this->renderBlock('weather-report', ['tagName' => 'article'], [], '<p>inner blocks</p>');

        $this->assertMatchesRegularExpression('#^<article [^>]*>.*<p>inner blocks</p></article>\s*$#s', $html);
    }

    public function test_an_unknown_tag_name_falls_back_to_section(): void
    {
        $html = $this->renderBlock('weather-report', ['tagName' => 'span'], [], '<p>inner blocks</p>');

        $this->assertMatchesRegularExpression('#^<section [^>]*>.*<p>inner blocks</p></section>\s*$#s', $html);
    }
}
