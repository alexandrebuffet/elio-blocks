<?php

namespace ElioBlocks\Tests\Unit\Blocks;

use Brain\Monkey;
use Brain\Monkey\Functions;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

/**
 * The datetime, sun-event and last-updated blocks format dates in the browser without the
 * wp-date script: they put the date settings of the site in the page, and have
 * the report keep a relative date ("5 minutes ago") current.
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
            'datetime'     => ['datetime'],
            'sun-event'    => ['sun-event'],
            'last-updated' => ['last-updated'],
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

    #[DataProvider('dateBlocks')]
    public function test_runs_the_clock_of_relative_dates_only_for_a_relative_date(string $name): void
    {
        $clock = 'data-wp-watch="callbacks.startRelativeDateClock"';

        $this->assertStringContainsString($clock, $this->renderBlock($name, ['format' => 'human-diff']));
        $this->assertStringNotContainsString($clock, $this->renderBlock($name, ['format' => 'H:i']));
        $this->assertStringNotContainsString($clock, $this->renderBlock($name));
    }

    public function test_moves_the_now_and_today_labels_with_the_hour_and_the_day_in_progress(): void
    {
        $clock = 'data-wp-watch="callbacks.startQuarterHourClock"';

        $this->assertStringContainsString($clock, $this->renderBlock('datetime', ['currentAsLabel' => true]));
        $this->assertStringNotContainsString($clock, $this->renderBlock('datetime'));
        // The clock of relative dates, every 30 seconds, moves the labels too.
        $this->assertStringNotContainsString(
            $clock,
            $this->renderBlock('datetime', ['currentAsLabel' => true, 'format' => 'human-diff'])
        );
    }
}
