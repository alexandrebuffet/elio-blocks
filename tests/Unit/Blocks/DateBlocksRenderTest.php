<?php

namespace ElioBlocks\Tests\Unit\Blocks;

use Brain\Monkey;
use Brain\Monkey\Functions;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

/**
 * The datetime and sun-event blocks format dates in the browser without the
 * wp-date script: they put the date settings of the site in the page.
 */
class DateBlocksRenderTest extends TestCase
{
    use RendersBlocks;

    /** @var array<string, array<string, mixed>> */
    private array $state = [];

    protected function setUp(): void
    {
        parent::setUp();
        Monkey\setUp();

        $this->stubRenderFunctions();
        Functions\when('get_option')->justReturn('');
        Functions\when('wp_interactivity_state')->alias(
            function (string $store, array $state = []): array {
                $this->state[$store] = array_replace_recursive($this->state[$store] ?? [], $state);

                return $this->state[$store];
            }
        );
    }

    protected function tearDown(): void
    {
        Monkey\tearDown();
        parent::tearDown();
    }

    /**
     * Provides the blocks that print a date.
     *
     * @return array<string, array{string}>
     */
    public static function dateBlocks(): array
    {
        return [
            'datetime'  => ['datetime'],
            'sun-event' => ['sun-event'],
        ];
    }

    #[DataProvider('dateBlocks')]
    public function test_puts_the_date_settings_of_the_site_in_the_page(string $name): void
    {
        $this->renderBlock($name);

        $settings = $this->state['elio/weather-report']['dateSettings'] ?? null;

        $this->assertIsArray($settings);
        $this->assertSame(['l10n', 'formats', 'timezone'], array_keys($settings));
    }

    #[DataProvider('dateBlocks')]
    public function test_needs_no_wp_date_script(string $name): void
    {
        $metadata = json_decode((string) file_get_contents(dirname(__DIR__, 3) . "/src/blocks/{$name}/block.json"), true);

        $this->assertNotContains('wp-date', (array) ( $metadata['viewScript'] ?? [] ));
    }
}
