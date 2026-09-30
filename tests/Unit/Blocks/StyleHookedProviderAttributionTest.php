<?php

namespace ElioBlocks\Tests\Unit\Blocks;

use Brain\Monkey;
use Brain\Monkey\Filters;
use ElioBlocks\Blocks\Hooks\StyleHookedProviderAttribution;
use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;
use PHPUnit\Framework\TestCase;

/**
 * The credit Block Hooks inserts in a report keeps the default style of its
 * block.json, and takes a line of its own in a report laid out as a row.
 */
class StyleHookedProviderAttributionTest extends TestCase
{
    use MockeryPHPUnitIntegration;

    private const HOOKED_BLOCK = [
        'blockName'    => 'elio/provider-attribution',
        'attrs'        => [],
        'innerBlocks'  => [],
        'innerContent' => [],
    ];

    private StyleHookedProviderAttribution $hook;

    protected function setUp(): void
    {
        parent::setUp();
        Monkey\setUp();

        $metadata = json_decode(
            (string) file_get_contents(dirname(__DIR__, 3) . '/src/blocks/provider-attribution/block.json'),
            true
        );
        \WP_Block_Type_Registry::get_instance()->register(
            new \WP_Block_Type('elio/provider-attribution', $metadata['supports'], [], $metadata['attributes'])
        );

        $this->hook = new StyleHookedProviderAttribution();
    }

    protected function tearDown(): void
    {
        \WP_Block_Type_Registry::get_instance()->unregister('elio/provider-attribution');
        Monkey\tearDown();
        parent::tearDown();
    }

    /**
     * Inserts the credit in a report.
     *
     * @param array<string, mixed>      $reportAttributes Attributes of the report.
     * @param array<string, mixed>|null $hookedBlock      Block about to be inserted.
     * @return array<string, mixed>|null
     */
    private function insertIn(array $reportAttributes, ?array $hookedBlock = self::HOOKED_BLOCK): ?array
    {
        return $this->hook->styleHookedBlock(
            $hookedBlock,
            'elio/provider-attribution',
            'lastChild',
            ['blockName' => 'elio/weather-report', 'attrs' => $reportAttributes]
        );
    }

    public function test_filters_the_block_block_hooks_inserts(): void
    {
        Filters\expectAdded('hooked_block_elio/provider-attribution')->once()->with([$this->hook, 'styleHookedBlock'], 10, 4);

        $this->hook->initHooks();
    }

    public function test_in_a_report_laid_out_as_a_column_the_credit_is_left_to_its_defaults(): void
    {
        // The default of its style attribute applies when it renders.
        $this->assertSame(self::HOOKED_BLOCK, $this->insertIn([]));
        $this->assertSame(self::HOOKED_BLOCK, $this->insertIn(['layout' => ['type' => 'constrained']]));
    }

    public function test_in_a_report_laid_out_as_a_row_the_credit_takes_a_line_of_its_own_with_its_default_style(): void
    {
        $this->assertSame(
            [
                'typography' => ['fontSize' => '0.75em', 'textAlign' => 'center'],
                'layout'     => ['selfStretch' => 'fixed', 'flexSize' => '100%'],
            ],
            $this->insertIn(['layout' => ['type' => 'flex', 'flexWrap' => 'wrap']])['attrs']['style']
        );
    }

    public function test_a_style_another_filter_set_is_kept(): void
    {
        $style = $this->insertIn(
            ['layout' => ['type' => 'flex']],
            ['attrs' => ['style' => ['typography' => ['textAlign' => 'left']]]] + self::HOOKED_BLOCK
        )['attrs']['style'];

        $this->assertSame(['textAlign' => 'left'], $style['typography']);
        $this->assertSame('100%', $style['layout']['flexSize']);
    }

    public function test_a_block_another_filter_removed_stays_removed(): void
    {
        $this->assertNull($this->insertIn([], null));
    }
}
