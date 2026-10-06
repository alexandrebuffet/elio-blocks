<?php

namespace ElioBlocks\Tests\Unit\Blocks;

use Brain\Monkey\Functions;
use ElioBlocks\Interactivity\Blocks\Report\IconSprite;
use ElioBlocks\Interactivity\Blocks\Report\ReportContext;
use ElioBlocks\Tests\Support\WordPressCore;
use WP_Block;

/**
 * Renders a block's render.php the way WordPress does: $attributes, $content
 * and $block in scope, the output captured.
 */
trait RendersBlocks
{
    private function stubRenderFunctions(): void
    {
        Functions\stubTranslationFunctions();
        Functions\stubEscapeFunctions();
        WordPressCore::stubDependencies();
        Functions\when('absint')->alias(static fn($value): int => abs((int) $value));
        Functions\when('wp_json_encode')->alias('json_encode');
        // Real one when WordPress core is loaded (see tests/bootstrap.php): it cannot be stubbed then.
        if (! WordPressCore::isLoaded()) {
            Functions\when('wp_kses_data')->returnArg();
        }
        Functions\when('sanitize_text_field')->returnArg();
        Functions\when('get_block_wrapper_attributes')->alias(
            static function (array $extra = []): string {
                $html = [];
                foreach ($extra as $name => $value) {
                    $html[] = sprintf('%s="%s"', $name, htmlspecialchars((string) $value, ENT_QUOTES));
                }

                return implode(' ', $html);
            }
        );
    }

    /**
     * Stubs the functions a block inside a report reads its weather forecast with, on
     * this report context rather than the one of the plugin container.
     */
    private function stubWeatherForecastFunctions(ReportContext $report): void
    {
        Functions\when('elio_blocks_get_current_conditions')->alias($report->getCurrentItem(...));
        Functions\when('elio_blocks_get_forecast_items')->alias($report->getForecastItems(...));
        Functions\when('elio_blocks_get_condition_icon')->alias($report->getIcon(...));
        Functions\when('elio_blocks_get_condition_icon_stroke_width')->alias(static fn(string $collection): float => 1.5);
        Functions\when('elio_blocks_get_condition_icon_collection')->alias(
            static fn(?string $block, ?string $report): string => $block ?? $report ?? 'elio'
        );
    }

    /**
     * Stubs the functions condition-icon blocks add their icons to the sprite of the
     * page with, and the report block prints it with, on this sprite.
     */
    private function stubIconSpriteFunctions(IconSprite $sprite): void
    {
        Functions\when('elio_blocks_add_icon_to_sprite')->alias($sprite->add(...));
        Functions\when('elio_blocks_render_icon_sprite')->alias($sprite->render(...));
    }

    /**
     * Renders a block with its render.php.
     *
     * @param array<string, mixed> $attributes   Block attributes.
     * @param array<string, mixed> $blockContext Block context (usesContext values).
     */
    private function renderBlock(string $name, array $attributes = [], array $blockContext = [], string $content = ''): string
    {
        $block = new WP_Block($attributes, $blockContext);

        ob_start();

        try {
            include dirname(__DIR__, 3) . "/src/blocks/{$name}/render.php";
        } catch (\Throwable $e) {
            ob_end_clean();

            throw $e;
        }

        return (string) ob_get_clean();
    }

    /**
     * Returns the interactivity context the block printed on its wrapper.
     *
     * @return array<string, mixed>
     */
    private function contextOf(string $html): array
    {
        preg_match('/data-wp-context="([^"]*)"/', $html, $matches);

        return json_decode(htmlspecialchars_decode($matches[1] ?? '', ENT_QUOTES), true) ?? [];
    }
}
