<?php

namespace ElioBlocks\Tests\Unit\Blocks;

use Brain\Monkey;
use Brain\Monkey\Functions;
use ElioBlocks\Blocks\Hooks\RegisterBlockPatterns;
use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

/**
 * The patterns of the Weather Report: each one registered for the report,
 * from a file holding one report whose Elio blocks only set attributes they
 * declare (a typo would be dropped silently by the editor) and credit the
 * provider once.
 */
class BlockPatternsTest extends TestCase
{
    use MockeryPHPUnitIntegration;

    private const PLUGIN_DIR = __DIR__ . '/../../../';

    /** Attributes block supports add to every block, which no block.json lists. */
    private const SUPPORT_ATTRIBUTES = ['style', 'fontSize', 'align', 'layout', 'metadata', 'fitText', 'className'];

    protected function setUp(): void
    {
        parent::setUp();
        Monkey\setUp();
        Functions\stubTranslationFunctions();
        Functions\stubEscapeFunctions();
    }

    protected function tearDown(): void
    {
        Monkey\tearDown();
        parent::tearDown();
    }

    public function test_registers_each_pattern_for_the_report_in_the_weather_category(): void
    {
        $registered = [];
        Functions\expect('register_block_pattern_category')->once()->with('elio-weather', \Mockery::type('array'));
        Functions\when('register_block_pattern')->alias(
            static function (string $name, array $properties) use (&$registered): void {
                $registered[$name] = $properties;
            }
        );

        ( new RegisterBlockPatterns(self::PLUGIN_DIR) )->registerBlockPatterns();

        $this->assertCount(count(self::patterns()), $registered);
        foreach ($registered as $name => $properties) {
            $this->assertMatchesRegularExpression('#^elio/[a-z-]+$#', $name);
            $this->assertSame(['elio/weather-report'], $properties['blockTypes']);
            $this->assertSame(['elio-weather'], $properties['categories']);
            $this->assertFileExists($properties['filePath']);
            $this->assertNotSame('', $properties['title']);
        }
    }

    /**
     * @return array<string, array{string}>
     */
    public static function patterns(): array
    {
        Functions\stubTranslationFunctions();
        $slugs = array_keys(( new RegisterBlockPatterns(self::PLUGIN_DIR) )->getPatterns());

        return array_combine($slugs, array_map(static fn(string $slug): array => [$slug], $slugs));
    }

    #[DataProvider('patterns')]
    public function test_holds_one_report_crediting_its_provider_once(string $slug): void
    {
        $blocks = $this->parse($slug);

        $this->assertSame('elio/weather-report', $blocks[0]['name']);
        $this->assertSame(1, count(array_filter($blocks, static fn(array $block): bool => 'elio/weather-report' === $block['name'])));
        $this->assertSame(['elio/provider-attribution'], $blocks[0]['attrs']['metadata']['ignoredHookedBlocks'] ?? null);
        $this->assertSame(1, count(array_filter($blocks, static fn(array $block): bool => 'elio/provider-attribution' === $block['name'])));
    }

    #[DataProvider('patterns')]
    public function test_sets_only_attributes_its_elio_blocks_declare(string $slug): void
    {
        foreach ($this->parse($slug) as $block) {
            if (! str_starts_with($block['name'], 'elio/')) {
                continue;
            }

            $metadata = self::PLUGIN_DIR . 'src/blocks/' . substr($block['name'], 5) . '/block.json';
            $this->assertFileExists($metadata, "{$slug}: {$block['name']} is no block");
            $declared = array_keys(json_decode((string) file_get_contents($metadata), true)['attributes'] ?? []);

            foreach (array_keys($block['attrs']) as $attribute) {
                $this->assertContains(
                    $attribute,
                    [...$declared, ...self::SUPPORT_ATTRIBUTES],
                    "{$slug}: {$block['name']} has no attribute {$attribute}"
                );
            }
        }
    }

    /**
     * Blocks of a pattern file, in order, from their comment delimiters.
     *
     * @return list<array{name: string, attrs: array<string, mixed>}>
     */
    private function parse(string $slug): array
    {
        ob_start();
        include self::PLUGIN_DIR . "patterns/{$slug}.php";
        $content = (string) ob_get_clean();

        preg_match_all('#<!-- wp:([a-z0-9/-]+) (?:(\{.*?\}) )?/?-->#', $content, $matches, PREG_SET_ORDER);
        $this->assertNotEmpty($matches, "{$slug}: no block");

        return array_map(
            function (array $match) use ($slug): array {
                $attrs = isset($match[2]) && '' !== $match[2] ? json_decode($match[2], true) : [];
                $this->assertIsArray($attrs, "{$slug}: invalid attributes of {$match[1]}");

                return ['name' => str_contains($match[1], '/') ? $match[1] : 'core/' . $match[1], 'attrs' => $attrs];
            },
            $matches
        );
    }
}
