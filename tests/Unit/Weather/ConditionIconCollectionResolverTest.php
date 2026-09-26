<?php

namespace ElioBlocks\Tests\Unit\Weather;

use Brain\Monkey;
use Brain\Monkey\Functions;
use ElioBlocks\Settings\PluginSettings;
use ElioBlocks\Weather\Condition\Icons\ConditionIconCollectionResolver;
use ElioBlocks\Weather\Condition\Icons\ConditionIconsRegistry;
use PHPUnit\Framework\TestCase;

/**
 * Which collection a block shows: its own, else the one of its report, else the
 * one of the site, else the plugin one. A collection that is not registered
 * (its plugin deactivated) counts as not chosen.
 */
class ConditionIconCollectionResolverTest extends TestCase
{
    private ConditionIconsRegistry $registry;

    protected function setUp(): void
    {
        parent::setUp();
        Monkey\setUp();
        Functions\stubEscapeFunctions();

        $this->registry = new ConditionIconsRegistry();
        $this->registry->registerCollection('elio', ['label' => 'Elio']);
        $this->registry->registerCollection('theme', ['label' => 'Theme']);
        $this->registry->registerCollection('plugin', ['label' => 'Plugin']);
    }

    protected function tearDown(): void
    {
        Monkey\tearDown();
        parent::tearDown();
    }

    private function resolver(string $siteCollection = 'elio'): ConditionIconCollectionResolver
    {
        $settings = $this->createMock(PluginSettings::class);
        $settings->method('getConditionIconCollection')->willReturn($siteCollection);

        return new ConditionIconCollectionResolver($this->registry, $settings);
    }

    public function test_the_block_wins_over_the_report_which_wins_over_the_site(): void
    {
        $this->assertSame('plugin', $this->resolver('theme')->resolve('plugin', 'elio'));
        $this->assertSame('elio', $this->resolver('theme')->resolve(null, 'elio'));
        $this->assertSame('theme', $this->resolver('theme')->resolve(null, null));
        $this->assertSame('theme', $this->resolver('theme')->resolve('', ''));
    }

    public function test_a_collection_that_is_not_registered_is_skipped(): void
    {
        $this->assertSame('theme', $this->resolver('elio')->resolve('uninstalled', 'theme'));
        $this->assertSame('elio', $this->resolver('uninstalled')->resolve(null, null), 'The plugin one when even the site setting is gone.');
    }

    public function test_lists_the_collections_a_report_and_its_condition_icon_blocks_show(): void
    {
        $report = [
            'blockName'   => 'elio/weather-report',
            'attrs'       => ['iconCollection' => 'theme'],
            'innerBlocks' => [
                ['blockName' => 'elio/condition-icon', 'attrs' => [], 'innerBlocks' => []],
                [
                    'blockName'   => 'elio/forecast',
                    'attrs'       => [],
                    'innerBlocks' => [
                        [
                            'blockName'   => 'elio/forecast-template',
                            'attrs'       => [],
                            'innerBlocks' => [
                                ['blockName' => 'elio/condition-icon', 'attrs' => ['iconCollection' => 'plugin'], 'innerBlocks' => []],
                                ['blockName' => 'elio/condition-icon', 'attrs' => ['iconCollection' => 'plugin'], 'innerBlocks' => []],
                                ['blockName' => 'elio/condition-icon', 'attrs' => ['iconCollection' => 'uninstalled'], 'innerBlocks' => []],
                            ],
                        ],
                    ],
                ],
            ],
        ];

        $this->assertSame(['theme', 'plugin'], $this->resolver()->usedBy($report));
    }

    public function test_a_report_without_blocks_choosing_a_collection_uses_one(): void
    {
        $this->assertSame(['elio'], $this->resolver()->usedBy(['blockName' => 'elio/weather-report', 'attrs' => []]));
    }

    public function test_a_request_gets_the_registered_collections_it_names_or_the_site_one(): void
    {
        $resolver = $this->resolver('theme');

        $this->assertSame(['plugin', 'elio'], $resolver->sanitizeRequested(['plugin', 'nope', 'elio', 'plugin']));
        $this->assertSame(['theme'], $resolver->sanitizeRequested([]));
        $this->assertSame(['theme'], $resolver->sanitizeRequested('elio'));
        $this->assertSame(['theme'], $resolver->sanitizeRequested(['nope', 42]));
    }
}
