<?php

namespace ElioBlocks\Tests\Unit\Blocks;

use Brain\Monkey;
use Brain\Monkey\Functions;
use ElioBlocks\Interactivity\Blocks\Report\IconSprite;
use ElioBlocks\Interactivity\Blocks\Report\ReportContext;
use ElioBlocks\Tests\Support\WordPressCore;
use PHPUnit\Framework\TestCase;

/**
 * The block is an <svg><use> pointing at the symbol of the icon of its item, in
 * a wrapper that names it. WordPress binds the wrapper in every forecast row
 * (it skips <svg> server-side), so rows show their icon in the server-rendered
 * HTML. The icons themselves go into the sprite of the page.
 */
class ConditionIconRenderTest extends TestCase
{
    use RendersBlocks;

    private const SUN  = '<svg viewBox="0 0 24 24"><path d="M1 1"></path></svg>';
    private const MOON = '<svg viewBox="0 0 24 24"><path d="M2 2"></path></svg>';
    private const RAIN = '<svg viewBox="0 0 24 24"><path d="M3 3"></path></svg>';

    private ReportContext $report;
    private IconSprite $sprite;

    /** @var list<array<string, mixed>> What the block gave the style engine, call by call. */
    private array $styleEngineInput = [];

    protected function setUp(): void
    {
        parent::setUp();

        // The sprite reads icons with the HTML API of WordPress core: the real one is used.
        if (! WordPressCore::isLoaded()) {
            $this->markTestSkipped('WP_HTML_Tag_Processor needs WordPress core next to the plugin.');
        }

        Monkey\setUp();

        $this->report = new ReportContext(static fn(): int => strtotime('2026-07-01T12:00:00+00:00'));
        $this->report->setWeatherForecast(
            [
                'current' => ['condition_code' => 0, 'condition_icons' => ['elio' => 'elio/sun', 'theme' => 'theme/sunny']],
                'daily'   => [
                    ['timestamp' => '2026-07-01T00:00:00+00:00', 'condition_icons' => ['elio' => 'elio/moon', 'theme' => null]],
                    ['timestamp' => '2026-07-02T00:00:00+00:00', 'condition_icons' => ['elio' => 'elio/rain', 'theme' => null]],
                    ['timestamp' => '2026-07-03T00:00:00+00:00', 'condition_icons' => ['elio' => 'elio/sun', 'theme' => 'theme/sunny']],
                ],
                'icons'   => [
                    'elio/sun'    => ['content' => self::SUN, 'style' => 'fill'],
                    'elio/moon'   => ['content' => self::MOON, 'style' => 'stroke'],
                    'elio/rain'   => ['content' => self::RAIN, 'style' => 'stroke'],
                    'theme/sunny' => ['content' => self::SUN, 'style' => 'stroke'],
                ],
            ]
        );
        $this->sprite = new IconSprite();

        $this->stubRenderFunctions();
        $this->stubWeatherForecastFunctions($this->report);
        $this->stubIconSpriteFunctions($this->sprite);
        Functions\when('wp_style_engine_get_styles')->alias(
            function (array $styles): array {
                $this->styleEngineInput[] = $styles;

                return ['css' => 'width:48px', 'classnames' => 'has-text-color'];
            }
        );
    }

    protected function tearDown(): void
    {
        Monkey\tearDown();
        parent::tearDown();
    }

    public function test_the_block_points_at_the_symbol_of_the_icon_of_its_item(): void
    {
        $html = $this->renderBlock('condition-icon');

        $this->assertMatchesRegularExpression('/<svg[^>]*><use><\/use><\/svg>/', $html);
        // WordPress prints it on the wrapper, LinkConditionIcons moves it into the <use>.
        $this->assertStringContainsString('data-wp-bind--data-elio-icon-href="state.conditionIconHref"', $html);
        // The browser keeps it up to date after a refresh.
        $this->assertStringContainsString('data-wp-watch="callbacks.linkConditionIcon"', $html);
    }

    public function test_no_directive_on_or_inside_the_svg_since_wordpress_rejects_them_server_side(): void
    {
        $html = $this->renderBlock('condition-icon', [], ['elio/forecastType' => 'daily', 'elio/forecastCount' => 2]);

        preg_match('/<svg.*<\/svg>/s', $html, $matches);

        $this->assertStringNotContainsString('data-wp-', $matches[0] ?? 'no svg');
    }

    public function test_the_wrapper_names_the_icon_and_the_svg_is_hidden_from_assistive_technology(): void
    {
        $html = $this->renderBlock('condition-icon');

        $this->assertStringContainsString('data-wp-bind--role="state.conditionIconRole"', $html);
        $this->assertStringContainsString('data-wp-bind--aria-label="state.conditionIconLabel"', $html);
        $this->assertMatchesRegularExpression('/<svg[^>]*aria-hidden="true"/', $html);
    }

    public function test_a_stroke_icon_is_drawn_with_the_stroke_width_of_the_block(): void
    {
        $html = $this->renderBlock('condition-icon', ['strokeWidth' => 2]);

        $this->assertMatchesRegularExpression('/<svg[^>]*stroke-width="2"/', $html);
    }

    public function test_without_a_stroke_width_of_its_own_the_block_draws_with_the_one_of_its_collection(): void
    {
        $html = $this->renderBlock('condition-icon');

        $this->assertMatchesRegularExpression('/<svg[^>]*stroke-width="1.5"/', $html);
    }

    public function test_the_icon_of_the_current_conditions_goes_into_the_sprite_of_the_page(): void
    {
        $this->renderBlock('condition-icon');

        $sprite = $this->sprite->render();

        $this->assertStringContainsString('id="elio-condition-icon-elio--sun"', $sprite);
        $this->assertStringNotContainsString('elio-condition-icon-elio--moon', $sprite);
    }

    public function test_in_a_forecast_list_the_icons_of_the_rows_go_into_the_sprite(): void
    {
        $this->renderBlock('condition-icon', [], ['elio/forecastType' => 'daily', 'elio/forecastCount' => 2]);

        $sprite = $this->sprite->render();

        $this->assertStringContainsString('id="elio-condition-icon-elio--moon"', $sprite);
        $this->assertStringContainsString('id="elio-condition-icon-elio--rain"', $sprite);
        $this->assertStringNotContainsString('elio-condition-icon-elio--sun', $sprite, 'Neither a shown row nor the current conditions.');
    }

    public function test_block_styles_stay_on_the_svg(): void
    {
        $html = $this->renderBlock('condition-icon', [], ['elio/forecastType' => 'daily', 'elio/forecastCount' => 2]);

        // Width, colors, border and padding are only known server-side: they live on the svg node.
        $this->assertMatchesRegularExpression('/<svg[^>]*style="width:48px"/', $html);
        $this->assertMatchesRegularExpression('/<svg[^>]*class="wp-block-elio-condition-icon__symbol has-text-color"/', $html);
    }

    public function test_colors_borders_padding_and_width_go_to_the_svg_through_the_style_engine(): void
    {
        $this->renderBlock(
            'condition-icon',
            [
                'textColor' => 'contrast',
                'style'     => [
                    'color'      => ['background' => '#abcdef'],
                    'border'     => ['radius' => '4px', 'width' => '1px', 'top' => ['color' => '#f00']],
                    'spacing'    => ['padding' => ['top' => '2px'], 'margin' => ['top' => '5px']],
                    'dimensions' => ['width' => '32px'],
                ],
            ]
        );

        $noSide = ['color' => null, 'style' => null, 'width' => null];

        // Margin is not there: WordPress serializes it on the wrapper.
        $this->assertSame(
            [
                [
                    'color'      => ['text' => 'var:preset|color|contrast', 'background' => '#abcdef'],
                    'border'     => [
                        'radius' => '4px',
                        'width'  => '1px',
                        'color'  => null,
                        'top'    => ['color' => '#f00', 'style' => null, 'width' => null],
                        'right'  => $noSide,
                        'bottom' => $noSide,
                        'left'   => $noSide,
                    ],
                    'spacing'    => ['padding' => ['top' => '2px']],
                    'dimensions' => ['width' => '32px'],
                ],
            ],
            $this->styleEngineInput
        );
    }

    public function test_preset_colors_win_over_custom_ones(): void
    {
        $this->renderBlock(
            'condition-icon',
            [
                'textColor'       => 'contrast',
                'backgroundColor' => 'base',
                'borderColor'     => 'accent-1',
                'style'           => ['color' => ['text' => '#111', 'background' => '#222'], 'border' => ['color' => '#333']],
            ]
        );

        $this->assertSame(
            ['text' => 'var:preset|color|contrast', 'background' => 'var:preset|color|base'],
            $this->styleEngineInput[0]['color']
        );
        $this->assertSame('var:preset|color|accent-1', $this->styleEngineInput[0]['border']['color']);
    }

    public function test_the_wrapper_follows_the_icon_of_the_item(): void
    {
        $html = $this->renderBlock('condition-icon', ['isDecorative' => true]);

        $this->assertStringContainsString('data-wp-class--has-svg-symbol="state.hasConditionIcon"', $html);
        $this->assertStringContainsString('data-wp-class--has-stroke-svg-symbol="state.isStrokeConditionIcon"', $html);
        $this->assertSame(['isDecorative' => true, 'iconCollection' => 'elio'], $this->contextOf($html));
    }

    public function test_no_icon_goes_into_the_sprite_without_a_weather_forecast(): void
    {
        $this->report->setWeatherForecast(null);

        $this->renderBlock('condition-icon');

        $this->assertSame('', $this->sprite->render());
    }

    public function test_forecast_type_and_count_reach_the_block_so_it_knows_the_rows_it_is_in(): void
    {
        $metadata = json_decode((string) file_get_contents(dirname(__DIR__, 3) . '/src/blocks/condition-icon/block.json'), true);

        $this->assertContains('elio/forecastType', $metadata['usesContext']);
        $this->assertContains('elio/forecastCount', $metadata['usesContext']);
    }

    public function test_a_block_choosing_a_collection_adds_the_icons_of_that_collection(): void
    {
        $html = $this->renderBlock('condition-icon', ['iconCollection' => 'theme']);

        $sprite = $this->sprite->render();

        $this->assertStringContainsString('id="elio-condition-icon-theme--sunny"', $sprite);
        $this->assertStringNotContainsString('elio-condition-icon-elio--sun', $sprite);
        $this->assertSame('theme', $this->contextOf($html)['iconCollection']);
    }

    public function test_a_block_follows_the_collection_of_its_report(): void
    {
        $html = $this->renderBlock('condition-icon', [], ['elio/reportIconCollection' => 'theme']);

        $this->assertSame('theme', $this->contextOf($html)['iconCollection']);
        $this->assertStringContainsString('elio-condition-icon-theme--sunny', $this->sprite->render());
    }

    public function test_rows_without_icon_in_the_collection_add_nothing(): void
    {
        $this->renderBlock('condition-icon', ['iconCollection' => 'theme'], ['elio/forecastType' => 'daily', 'elio/forecastCount' => 2]);

        $this->assertSame('', $this->sprite->render());
    }

    public function test_two_blocks_on_different_collections_in_one_report_get_two_distinct_symbols(): void
    {
        $this->renderBlock('condition-icon');
        $this->renderBlock('condition-icon', ['iconCollection' => 'theme']);

        $sprite = $this->sprite->render();

        $this->assertStringContainsString('id="elio-condition-icon-elio--sun"', $sprite);
        $this->assertStringContainsString('id="elio-condition-icon-theme--sunny"', $sprite);
    }

    public function test_the_collection_of_the_report_reaches_the_block(): void
    {
        $metadata = json_decode((string) file_get_contents(dirname(__DIR__, 3) . '/src/blocks/condition-icon/block.json'), true);
        $report   = json_decode((string) file_get_contents(dirname(__DIR__, 3) . '/src/blocks/weather-report/block.json'), true);

        $this->assertContains('elio/reportIconCollection', $metadata['usesContext']);
        $this->assertSame('string', $metadata['attributes']['iconCollection']['type']);
        $this->assertSame('iconCollection', $report['providesContext']['elio/reportIconCollection']);
    }
}
