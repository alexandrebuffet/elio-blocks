<?php

namespace ElioBlocks\Tests\Unit\Blocks;

use Brain\Monkey;
use Brain\Monkey\Functions;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

/**
 * The blocks showing one value print it like the editor does
 * (WeatherValueEdit): the prefix, a space, the value, then its unit.
 */
class ValueBlocksRenderTest extends TestCase
{
    use RendersBlocks;

    protected function setUp(): void
    {
        parent::setUp();
        Monkey\setUp();

        $this->stubRenderFunctions();
        // datetime, sun-event and last-updated put the date settings of the site in the page.
        Functions\when('get_option')->justReturn('');
        Functions\when('wp_interactivity_state')->justReturn([]);
    }

    protected function tearDown(): void
    {
        Monkey\tearDown();
        parent::tearDown();
    }

    /**
     * Provides the blocks that print a unit.
     *
     * @return array<string, array{string}>
     */
    public static function blocksWithAUnit(): array
    {
        return self::blocks([
            'temperature',
            'daily-temperature',
            'hourly-temperature',
            'humidity',
            'cloud-cover',
            'precipitation-probability',
            'precipitation',
            'pressure',
            'wind-speed',
        ]);
    }

    /**
     * Provides the blocks that print a prefix.
     *
     * @return array<string, array{string}>
     */
    public static function blocksWithAPrefix(): array
    {
        return self::blocks([
            'temperature',
            'daily-temperature',
            'hourly-temperature',
            'humidity',
            'cloud-cover',
            'precipitation',
            'pressure',
            'wind-speed',
            'wind-direction',
            'uv-index',
            'condition-description',
            'datetime',
            'sun-event',
            'last-updated',
        ]);
    }

    /**
     * Builds data provider rows: one per block, keyed by its name.
     *
     * @param list<string> $names Block names.
     * @return array<string, array{string}>
     */
    private static function blocks(array $names): array
    {
        return array_combine($names, array_map(static fn(string $name): array => [$name], $names));
    }

    /**
     * Checks that the unit comes right after the value.
     *
     * The label carries its own separator (a non-breaking space before "km/h",
     * nothing before "°C" or "%"): whitespace in the markup would add a space
     * the editor does not show.
     */
    #[DataProvider('blocksWithAUnit')]
    public function test_puts_the_unit_right_after_the_value(string $name): void
    {
        $html = $this->renderBlock($name);

        $this->assertMatchesRegularExpression(
            "#<span class=\"wp-block-elio-{$name}__value\"[^>]*></span><span class=\"wp-block-elio-{$name}__unit\"#",
            $html
        );
    }

    #[DataProvider('blocksWithAPrefix')]
    public function test_separates_the_prefix_from_the_value_with_a_space(string $name): void
    {
        $html = $this->renderBlock($name, ['showPrefix' => true, 'prefix' => 'Prefix']);

        $this->assertMatchesRegularExpression(
            "#<span class=\"wp-block-elio-{$name}__prefix\">Prefix</span>\s+<(span|time) class=\"wp-block-elio-{$name}__value\"#",
            $html
        );
    }
}
