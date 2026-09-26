<?php

namespace ElioBlocks\Tests\Unit\Weather;

use Brain\Monkey;
use Brain\Monkey\Functions;
use ElioBlocks\Tests\Support\WordPressCore;
use ElioBlocks\Weather\Condition\Icons\ConditionIconsRegistry;
use Mockery;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

/**
 * Collections and icons are registered the way the Icons API of WordPress 7.1
 * registers them (a collection, then icons named "collection/icon"), with
 * what the plugin adds: the conditions an icon represents and its style.
 */
class ConditionIconsRegistryTest extends TestCase
{
    private const SUN  = '<svg viewBox="0 0 24 24"><path d="M1 1"></path></svg>';
    private const MOON = '<svg viewBox="0 0 24 24"><path d="M2 2"></path></svg>';

    private ConditionIconsRegistry $registry;

    protected function setUp(): void
    {
        parent::setUp();
        Monkey\setUp();
        Functions\stubEscapeFunctions();
        WordPressCore::stubKses();

        $this->registry = new ConditionIconsRegistry();
    }

    protected function tearDown(): void
    {
        Monkey\tearDown();
        parent::tearDown();
    }

    private function registerElio(): void
    {
        $this->assertTrue($this->registry->registerCollection('elio', ['label' => 'Elio']));
    }

    /**
     * Registers an icon, with the sun as content unless $args gives one.
     *
     * @param list<array{0: string, 1: string}> $conditions
     * @param array<string, mixed>               $args
     */
    private function registerIcon(string $name, array $conditions = [], array $args = []): bool
    {
        return $this->registry->registerIcon($name, $args + ['content' => self::SUN, 'conditions' => $conditions]);
    }

    // esc_html() (stubbed with ENT_QUOTES) turns the quotes of a message into &quot;: patterns write them as ".
    private function expectNotice(string $pattern): void
    {
        Functions\expect('_doing_it_wrong')->once()->with(Mockery::type('string'), Mockery::pattern(str_replace('"', '&quot;', $pattern)), '0.1.0');
    }

    private function requireKses(): void
    {
        if (! WordPressCore::isLoaded()) {
            $this->markTestSkipped('wp_kses() needs WordPress core next to the plugin (or WP_CORE_DIR).');
        }
    }

    // --- Collections ---

    public function test_registers_a_collection_with_its_label_and_description(): void
    {
        $this->assertTrue($this->registry->registerCollection('pixel-art', ['label' => 'Pixel art', 'description' => 'Tiny icons.']));

        $this->assertTrue($this->registry->isCollectionRegistered('pixel-art'));
        $this->assertSame(
            ['slug' => 'pixel-art', 'label' => 'Pixel art', 'description' => 'Tiny icons.'],
            $this->registry->getRegisteredCollection('pixel-art')
        );
        $this->assertNull($this->registry->getRegisteredCollection('nope'));
    }

    public function test_lists_the_collections_in_registration_order(): void
    {
        $this->registerElio();
        $this->registry->registerCollection('pixel-art', ['label' => 'Pixel art']);

        $this->assertSame(['elio', 'pixel-art'], array_column($this->registry->getAllRegisteredCollections(), 'slug'));
        $this->assertSame('', $this->registry->getAllRegisteredCollections()[0]['description']);
    }

    public function test_a_collection_needs_a_label(): void
    {
        $this->expectNotice('/needs a label/');

        $this->assertFalse($this->registry->registerCollection('pixel-art', []));
        $this->assertFalse($this->registry->isCollectionRegistered('pixel-art'));
    }

    public function test_a_collection_with_an_unknown_property_is_refused(): void
    {
        $this->expectNotice('/Invalid icon collection property: "icons"/');

        $this->assertFalse($this->registry->registerCollection('pixel-art', ['label' => 'Pixel art', 'icons' => []]));
    }

    public function test_a_collection_slug_already_registered_is_refused_and_the_first_one_kept(): void
    {
        $this->registerElio();
        $this->expectNotice('/"elio" is already registered/');

        $this->assertFalse($this->registry->registerCollection('elio', ['label' => 'Mine']));
        $this->assertSame('Elio', $this->registry->getRegisteredCollection('elio')['label']);
    }

    #[DataProvider('invalidSlugs')]
    public function test_a_collection_slug_must_follow_the_core_pattern(string $slug): void
    {
        $this->expectNotice('/lowercase letters, digits, hyphens, and underscores/');

        $this->assertFalse($this->registry->registerCollection($slug, ['label' => 'x']));
    }

    public static function invalidSlugs(): array
    {
        return [
            'uppercase'      => ['Elio'],
            'space'          => ['my icons'],
            'leading hyphen' => ['-elio'],
            'trailing dash'  => ['elio-'],
            'slash'          => ['my/icons'],
            'empty'          => [''],
        ];
    }

    public function test_underscores_and_digits_are_allowed_in_a_slug(): void
    {
        $this->assertTrue($this->registry->registerCollection('icons_v2', ['label' => 'v2']));
    }

    // --- Icons ---

    public function test_registers_an_icon_in_its_collection(): void
    {
        $this->registerElio();

        $this->assertTrue($this->registerIcon('elio/sun', [['clear-sky', 'day']], ['label' => 'Sun', 'style' => 'stroke']));

        $this->assertTrue($this->registry->isIconRegistered('elio/sun'));
        $this->assertSame(
            [
                'name'       => 'elio/sun',
                'collection' => 'elio',
                'label'      => 'Sun',
                'content'    => self::SUN,
                'style'      => 'stroke',
                'conditions' => [['clear-sky', 'day']],
            ],
            $this->registry->getRegisteredIcon('elio/sun')
        );
    }

    public function test_an_icon_defaults_to_the_fill_style_no_label_and_no_condition(): void
    {
        $this->registerElio();
        $this->registry->registerIcon('elio/sun', ['content' => self::SUN]);

        $icon = $this->registry->getRegisteredIcon('elio/sun');

        $this->assertSame(['fill', '', []], [$icon['style'], $icon['label'], $icon['conditions']]);
    }

    public function test_the_collection_must_be_registered_before_its_icons(): void
    {
        $this->expectNotice('/Icon collection "elio" is not registered/');

        $this->assertFalse($this->registerIcon('elio/sun'));
        $this->assertFalse($this->registry->isIconRegistered('elio/sun'));
    }

    #[DataProvider('invalidIconNames')]
    public function test_an_icon_name_must_be_a_qualified_name_following_the_core_pattern(string $name): void
    {
        $this->registerElio();
        $this->expectNotice('/must be "collection\/icon-name"/');

        $this->assertFalse($this->registerIcon($name));
    }

    public static function invalidIconNames(): array
    {
        return [
            'unqualified'   => ['sun'],
            'uppercase'     => ['elio/Sun'],
            'empty icon'    => ['elio/'],
            'two slashes'   => ['elio/sun/day'],
            'trailing dash' => ['elio/sun-'],
        ];
    }

    public function test_an_icon_name_already_registered_is_refused_and_the_first_icon_kept(): void
    {
        $this->registerElio();
        $this->registerIcon('elio/sun');
        $this->expectNotice('/Icon "elio\/sun" is already registered/');

        $this->assertFalse($this->registerIcon('elio/sun', [], ['content' => self::MOON]));
        $this->assertSame(self::SUN, $this->registry->getRegisteredIcon('elio/sun')['content']);
    }

    public function test_an_icon_needs_exactly_one_of_content_and_file_path(): void
    {
        $this->registerElio();
        Functions\expect('_doing_it_wrong')->twice()->with(Mockery::type('string'), Mockery::pattern('/either &quot;content&quot; or &quot;file_path&quot;/'), '0.1.0');

        $this->assertFalse($this->registry->registerIcon('elio/sun', []));
        $this->assertFalse($this->registry->registerIcon('elio/sun', ['content' => self::SUN, 'file_path' => '/tmp/sun.svg']));
    }

    public function test_an_icon_with_an_unknown_property_is_refused(): void
    {
        $this->registerElio();
        $this->expectNotice('/Invalid icon property: "type"/');

        $this->assertFalse($this->registerIcon('elio/sun', [], ['type' => 'svg']));
    }

    public function test_an_icon_with_an_unknown_style_is_refused(): void
    {
        $this->registerElio();
        $this->expectNotice('/invalid style "outline"/');

        $this->assertFalse($this->registerIcon('elio/sun', [], ['style' => 'outline']));
    }

    // --- Conditions ---

    public function test_a_day_or_night_icon_wins_over_the_one_for_all_day(): void
    {
        $this->registerElio();
        $this->registerIcon('elio/star', [['clear-sky', 'all']]);
        $this->registerIcon('elio/moon', [['clear-sky', 'night']]);

        $this->assertSame('elio/moon', $this->registry->getIconForCondition('elio', 'clear-sky', 'night')['name']);
        $this->assertSame('elio/star', $this->registry->getIconForCondition('elio', 'clear-sky', 'day')['name']);
    }

    public function test_no_icon_for_an_unmapped_condition_or_an_unknown_collection(): void
    {
        $this->registerElio();
        $this->registerIcon('elio/sun', [['clear-sky', 'day']]);

        $this->assertNull($this->registry->getIconForCondition('elio', 'fog', 'day'));
        $this->assertNull($this->registry->getIconForCondition('pixel-art', 'clear-sky', 'day'));
    }

    public function test_a_condition_and_time_of_day_is_represented_by_one_icon_per_collection(): void
    {
        $this->registerElio();
        $this->registerIcon('elio/sun', [['clear-sky', 'day']]);
        $this->expectNotice('/clear-sky\/day .*already represented by icon "elio\/sun"/');

        $this->assertFalse($this->registerIcon('elio/sun-high', [['mainly-clear', 'day'], ['clear-sky', 'day']]));
        $this->assertFalse($this->registry->isIconRegistered('elio/sun-high'), 'An icon is registered whole or not at all.');
        $this->assertNull($this->registry->getIconForCondition('elio', 'mainly-clear', 'day'));
    }

    public function test_the_same_condition_may_be_represented_in_another_collection(): void
    {
        $this->registerElio();
        $this->registry->registerCollection('pixel-art', ['label' => 'Pixel art']);
        $this->registerIcon('elio/sun', [['clear-sky', 'day']]);

        $this->assertTrue($this->registerIcon('pixel-art/sun', [['clear-sky', 'day']]));
        $this->assertSame('pixel-art/sun', $this->registry->getIconForCondition('pixel-art', 'clear-sky', 'day')['name']);
    }

    public function test_a_condition_that_is_not_a_wmo_condition_is_refused(): void
    {
        $this->registerElio();
        $this->expectNotice('/invalid condition "sharknado"/');

        $this->assertFalse($this->registerIcon('elio/sun', [['sharknado', 'day']]));
    }

    public function test_a_time_of_day_other_than_day_night_all_is_refused(): void
    {
        $this->registerElio();
        $this->expectNotice('/invalid time of day "dusk"/');

        $this->assertFalse($this->registerIcon('elio/sun', [['clear-sky', 'dusk']]));
    }

    public function test_a_condition_that_is_not_a_pair_is_refused(): void
    {
        $this->registerElio();
        $this->expectNotice('/must be a \[condition, time_of_day\] pair/');

        $this->assertFalse($this->registerIcon('elio/sun', [['clear-sky']]));
    }

    // --- Unregistering ---

    public function test_unregistering_an_icon_frees_its_conditions(): void
    {
        $this->registerElio();
        $this->registerIcon('elio/sun', [['clear-sky', 'day']]);

        $this->assertTrue($this->registry->unregisterIcon('elio/sun'));

        $this->assertFalse($this->registry->isIconRegistered('elio/sun'));
        $this->assertNull($this->registry->getIconForCondition('elio', 'clear-sky', 'day'));
        $this->assertTrue($this->registerIcon('elio/sun-high', [['clear-sky', 'day']]));
    }

    public function test_unregistering_a_collection_unregisters_its_icons(): void
    {
        $this->registerElio();
        $this->registry->registerCollection('pixel-art', ['label' => 'Pixel art']);
        $this->registerIcon('elio/sun', [['clear-sky', 'day']]);
        $this->registerIcon('pixel-art/sun', [['clear-sky', 'day']]);

        $this->assertTrue($this->registry->unregisterCollection('pixel-art'));

        $this->assertFalse($this->registry->isCollectionRegistered('pixel-art'));
        $this->assertFalse($this->registry->isIconRegistered('pixel-art/sun'));
        $this->assertTrue($this->registry->isIconRegistered('elio/sun'));
    }

    public function test_unregistering_what_is_not_registered_is_refused_with_a_notice(): void
    {
        Functions\expect('_doing_it_wrong')->twice()->with(Mockery::type('string'), Mockery::pattern('/is not registered/'), '0.1.0');

        $this->assertFalse($this->registry->unregisterCollection('nope'));
        $this->assertFalse($this->registry->unregisterIcon('nope/nope'));
    }

    // --- Lock ---

    public function test_registration_is_closed_once_the_registry_is_built(): void
    {
        $this->registerElio();
        $this->registry->build();
        Functions\expect('_doing_it_wrong')->times(3)->with(Mockery::type('string'), Mockery::pattern('/already built/'), '0.1.0');

        $this->assertTrue($this->registry->isBuilt());
        $this->assertFalse($this->registry->registerCollection('late', ['label' => 'Late']));
        $this->assertFalse($this->registerIcon('elio/late'));
        $this->assertFalse($this->registry->unregisterCollection('elio'));
        $this->assertTrue($this->registry->isCollectionRegistered('elio'));
    }

    // --- Content ---

    public function test_an_icon_given_by_file_path_is_read_when_it_is_served(): void
    {
        $file = tempnam(sys_get_temp_dir(), 'elio-icon');
        rename($file, $file . '.svg');
        $file .= '.svg';
        file_put_contents($file, self::MOON);
        $this->registerElio();

        try {
            $this->assertTrue($this->registry->registerIcon('elio/moon', ['file_path' => $file]));
            $this->assertSame(self::MOON, $this->registry->getRegisteredIcon('elio/moon')['content']);
            $this->assertArrayNotHasKey('file_path', $this->registry->getRegisteredIcon('elio/moon'));
        } finally {
            unlink($file);
        }
    }

    public function test_an_icon_whose_file_is_missing_is_served_as_nothing_with_a_warning(): void
    {
        $this->registerElio();
        $this->registry->registerIcon('elio/moon', ['file_path' => '/nowhere/moon.svg']);
        Functions\expect('wp_trigger_error')->once()->with(Mockery::type('string'), Mockery::pattern('/moon\.svg/'));

        $this->assertNull($this->registry->getRegisteredIcon('elio/moon'));
    }

    public function test_the_values_quoted_in_an_error_message_are_escaped(): void
    {
        $this->registerElio();
        $this->expectNotice('/Icon name "elio\/&lt;img src=x&gt;"/');

        $this->registerIcon('elio/<img src=x>');
    }

    public function test_scripts_and_event_handlers_never_leave_the_registry(): void
    {
        $this->requireKses();
        $hostile = '<svg viewBox="0 0 24 24" onload="alert(1)"><script>alert(2)</script>'
            . '<path d="M1 1" onclick="alert(3)"></path><a href="javascript:alert(4)"><circle r="2"></circle></a>'
            . '<foreignObject><iframe src="https://evil.test"></iframe></foreignObject></svg>';
        $this->registerElio();
        $this->registerIcon('elio/sun', [['clear-sky', 'day']], ['content' => $hostile]);

        $served = [
            $this->registry->getIconForCondition('elio', 'clear-sky', 'day')['content'],
            $this->registry->getRegisteredIcon('elio/sun')['content'],
        ];

        foreach ($served as $svg) {
            foreach (['script', 'alert', 'onload', 'onclick', 'javascript', 'iframe', 'foreignObject'] as $needle) {
                $this->assertStringNotContainsStringIgnoringCase($needle, $svg);
            }
            $this->assertStringContainsString('d="M1 1"', $svg);
        }
    }

    public function test_what_icons_are_made_of_goes_through(): void
    {
        $this->requireKses();
        $svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">'
            . '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fc0" stop-opacity=".5"></stop></linearGradient><clipPath id="c"><rect x="0" y="0" width="24" height="24" rx="2"></rect></clipPath></defs>'
            . '<g clip-path="url(#c)" transform="translate(1 1)" opacity=".9"><circle cx="12" cy="12" r="4" fill="url(#g)"></circle>'
            . '<path d="M12 2v2" fill-rule="evenodd" clip-rule="evenodd"></path><line x1="1" y1="1" x2="2" y2="2"></line>'
            . '<polyline points="1,1 2,2"></polyline><polygon points="1,1 2,2 3,3"></polygon><ellipse cx="1" cy="1" rx="2" ry="1"></ellipse></g>'
            . '<title>Sun</title></svg>';
        $this->registerElio();
        $this->registerIcon('elio/sun', [], ['content' => $svg]);

        $this->assertSame(strtolower($svg), strtolower($this->registry->getRegisteredIcon('elio/sun')['content']));
    }

    public function test_content_that_is_no_svg_is_served_as_nothing(): void
    {
        $this->requireKses();
        $this->registerElio();
        $this->registerIcon('elio/sun', [], ['content' => '<p>not an icon</p>']);

        $this->assertNull($this->registry->getRegisteredIcon('elio/sun'));
    }

    public function test_sanitizing_happens_once_per_icon_and_only_for_icons_that_are_served(): void
    {
        $this->requireKses();
        $calls = 0;
        Functions\when('wp_allowed_protocols')->alias(function () use (&$calls) {
            ++$calls;
            return ['http', 'https'];
        });
        $this->registerElio();
        $this->registerIcon('elio/sun', [['clear-sky', 'day']]);
        $this->registerIcon('elio/moon');
        $this->registerIcon('elio/fog');

        $this->registry->getIconForCondition('elio', 'clear-sky', 'day');
        $afterFirst = $calls;
        $this->registry->getIconForCondition('elio', 'clear-sky', 'day');

        $this->assertGreaterThan(0, $afterFirst);
        $this->assertSame($afterFirst, $calls, 'A page with many rows asks for the same icon many times.');
    }
}
