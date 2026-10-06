<?php

namespace ElioBlocks\Tests\Unit\RestApi;

use Brain\Monkey;
use Brain\Monkey\Functions;
use ElioBlocks\RestApi\Endpoints\ConditionIconCollectionsController;
use ElioBlocks\Settings\PluginSettings;
use ElioBlocks\Tests\Support\WordPressCore;
use ElioBlocks\Weather\Condition\Icons\ConditionIconsRegistry;
use ElioBlocks\Weather\Condition\WmoConditionCodes;
use PHPUnit\Framework\TestCase;
use WP_Error;
use WP_REST_Request;

/**
 * /condition-icon-collections lists the collections of the registry once it is
 * locked, for the pickers of the editor and the settings page: what each one
 * looks like (a preview) and how much of the weather it covers.
 */
class ConditionIconCollectionsControllerTest extends TestCase
{
    private const SUN = '<svg viewBox="0 0 24 24"><path d="M1 1"></path></svg>';

    private ConditionIconsRegistry $registry;

    protected function setUp(): void
    {
        parent::setUp();
        Monkey\setUp();

        Functions\when('__')->returnArg();
        Functions\stubEscapeFunctions();
        Functions\when('rest_ensure_response')->alias(static fn($data) => new \WP_REST_Response($data));
        WordPressCore::stubKses();

        $this->registry = new ConditionIconsRegistry();
        $this->registry->registerCollection('elio', ['label' => 'Elio', 'description' => 'Shipped.', 'stroke_width' => 1.5]);
        foreach (WmoConditionCodes::getSlugs() as $condition) {
            $this->registry->registerIcon('elio/' . $condition, ['content' => self::SUN, 'style' => 'stroke', 'conditions' => [[$condition, 'all']]]);
        }
        $this->registry->registerCollection('sparse', ['label' => 'Sparse']);
        $this->registry->registerIcon('sparse/sun', ['content' => self::SUN, 'conditions' => [['clear-sky', 'day'], ['partly-cloudy', 'all']]]);
        $this->registry->registerIcon('sparse/moon', ['content' => self::SUN, 'conditions' => [['clear-sky', 'night']]]);
    }

    protected function tearDown(): void
    {
        Monkey\tearDown();
        parent::tearDown();
    }

    private function get(string $siteCollection = 'elio'): mixed
    {
        $settings = $this->createMock(PluginSettings::class);
        $settings->method('getConditionIconCollection')->willReturn($siteCollection);

        return (new ConditionIconCollectionsController($this->registry, $settings))->get_items(new WP_REST_Request());
    }

    public function test_answers_503_until_the_registry_is_locked(): void
    {
        $response = $this->get();

        $this->assertInstanceOf(WP_Error::class, $response);
        $this->assertSame('elio_blocks_icons_not_ready', $response->get_error_code());
        $this->assertSame(['status' => 503], $response->get_error_data());
    }

    public function test_lists_every_collection_as_the_core_icon_collections_endpoint_does(): void
    {
        $this->registry->build();

        $data = $this->get()->get_data();

        $this->assertSame(['elio', 'sparse'], array_column($data, 'slug'));
        $this->assertSame(['Elio', 'Sparse'], array_column($data, 'label'));
        $this->assertSame(['Shipped.', ''], array_column($data, 'description'));
        $this->assertSame([1.5, 2.0], array_column($data, 'stroke_width'), 'The stroke width the icons are drawn with, two when the collection says nothing.');
    }

    public function test_flags_the_collection_of_the_site(): void
    {
        $this->registry->build();

        $this->assertSame([true, false], array_column($this->get('elio')->get_data(), 'is_default'));
        $this->assertSame([false, true], array_column($this->get('sparse')->get_data(), 'is_default'));
        $this->assertSame([true, false], array_column($this->get('uninstalled')->get_data(), 'is_default'), 'The plugin one when the site one is gone.');
    }

    public function test_counts_the_conditions_covered_day_and_night(): void
    {
        $this->registry->build();
        $total = count(WmoConditionCodes::getSlugs());

        [$elio, $sparse] = $this->get()->get_data();

        $this->assertSame(['covered' => $total, 'total' => $total], $elio['coverage']);
        // clear-sky has a day and a night icon, partly-cloudy an 'all' one.
        $this->assertSame(['covered' => 2, 'total' => $total], $sparse['coverage']);
    }

    public function test_previews_six_conditions_with_a_hole_where_the_collection_has_no_icon(): void
    {
        $this->registry->build();

        [$elio, $sparse] = $this->get()->get_data();

        $this->assertSame(
            ['elio/clear-sky', 'elio/partly-cloudy', 'elio/clear-sky', 'elio/moderate-rain', 'elio/moderate-snowfall', 'elio/thunderstorm'],
            array_column($elio['preview'], 'name')
        );
        $this->assertSame(['content' => self::SUN, 'style' => 'stroke'], array_intersect_key($elio['preview'][0], ['content' => 1, 'style' => 1]));
        $this->assertSame(['sparse/sun', 'sparse/sun', 'sparse/moon', null, null, null], array_map(static fn(?array $icon): ?string => $icon['name'] ?? null, $sparse['preview']));
    }

    public function test_describes_its_items(): void
    {
        $schema = (new ConditionIconCollectionsController($this->registry, $this->createMock(PluginSettings::class)))->get_item_schema();

        $this->assertSame('condition-icon-collection', $schema['title']);
        $this->assertSame(['slug', 'label', 'description', 'is_default', 'stroke_width', 'coverage', 'preview'], array_keys($schema['properties']));
    }
}
