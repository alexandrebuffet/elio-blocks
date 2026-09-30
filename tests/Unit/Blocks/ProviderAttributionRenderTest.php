<?php

namespace ElioBlocks\Tests\Unit\Blocks;

use Brain\Monkey;
use Brain\Monkey\Functions;
use ElioBlocks\Tests\Support\WordPressCore;
use PHPUnit\Framework\TestCase;

/**
 * The provider-attribution block credits the provider of its report, as the
 * license of its data asks: at the bottom of each report (Block Hooks).
 */
class ProviderAttributionRenderTest extends TestCase
{
    use RendersBlocks;

    private const OPEN_METEO = [
        'name'        => 'Open-Meteo',
        'url'         => 'https://open-meteo.com/',
        'license'     => 'CC BY 4.0',
        'license_url' => 'https://creativecommons.org/licenses/by/4.0/',
    ];

    /** @var list<string> Providers the block asked the credit of. */
    private array $askedProviders = [];

    protected function setUp(): void
    {
        parent::setUp();
        Monkey\setUp();

        $this->stubRenderFunctions();
        WordPressCore::stubKses();
        Functions\when('get_block_wrapper_attributes')->justReturn('class="wp-block-elio-provider-attribution"');
    }

    protected function tearDown(): void
    {
        Monkey\tearDown();
        parent::tearDown();
    }

    /**
     * Stubs the credit of every provider.
     *
     * @param array{name: string, url: string, license: string, license_url: string}|null $attribution Credit.
     */
    private function stubAttribution(?array $attribution): void
    {
        Functions\when('elio_blocks_get_weather_forecast_attribution')->alias(
            function (string $provider) use ($attribution): ?array {
                $this->askedProviders[] = $provider;

                return $attribution;
            }
        );
    }

    public function test_links_the_name_of_the_provider_and_its_license_in_one_sentence(): void
    {
        $this->stubAttribution(self::OPEN_METEO);

        $html = $this->renderBlock('provider-attribution', [], ['elio/reportProvider' => 'open-meteo']);

        $this->assertSame(['open-meteo'], $this->askedProviders);
        // Each link names where it leads; the sentence says what it is. No new tab.
        $this->assertSame(
            '<p class="wp-block-elio-provider-attribution">Weather data by '
            . '<a class="wp-block-elio-provider-attribution__provider-link" href="https://open-meteo.com/">Open-Meteo</a>'
            . ', licensed under '
            . '<a class="wp-block-elio-provider-attribution__license-link" href="https://creativecommons.org/licenses/by/4.0/" rel="license">CC BY 4.0</a></p>',
            trim($html)
        );
    }

    public function test_a_report_without_provider_credits_the_site_default_one(): void
    {
        $this->stubAttribution(self::OPEN_METEO);

        $this->renderBlock('provider-attribution');

        $this->assertSame([''], $this->askedProviders);
    }

    public function test_names_a_license_without_page_unlinked(): void
    {
        $this->stubAttribution(['license_url' => ''] + self::OPEN_METEO);

        $html = $this->renderBlock('provider-attribution');

        $this->assertStringContainsString('</a>, licensed under CC BY 4.0</p>', $html);
        $this->assertStringNotContainsString('__license-link', $html);
    }

    public function test_credits_a_provider_without_license_by_its_name_alone(): void
    {
        $this->stubAttribution(['name' => 'Acme <Weather>', 'url' => 'https://acme.test/', 'license' => '', 'license_url' => '']);

        $html = $this->renderBlock('provider-attribution', [], ['elio/reportProvider' => 'acme']);

        $this->assertStringContainsString(
            'Weather data by <a class="wp-block-elio-provider-attribution__provider-link" href="https://acme.test/">Acme &lt;Weather&gt;</a></p>',
            $html
        );
        $this->assertStringNotContainsString('licensed', $html);
    }

    public function test_prints_nothing_for_a_provider_that_asks_for_no_credit(): void
    {
        $this->stubAttribution(null);

        $this->assertSame('', trim($this->renderBlock('provider-attribution', [], ['elio/reportProvider' => 'silent'])));
    }
}
