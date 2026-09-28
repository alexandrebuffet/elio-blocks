<?php

namespace ElioBlocks\Tests\Unit\Blocks;

use Brain\Monkey;
use Brain\Monkey\Functions;
use PHPUnit\Framework\TestCase;

/**
 * The provider-attribution block credits the provider of its report, as the
 * license of its data asks: at the bottom of each report (Block Hooks).
 */
class ProviderAttributionRenderTest extends TestCase
{
    use RendersBlocks;

    private const OPEN_METEO = [
        'text'        => 'Weather data by Open-Meteo.com',
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
    }

    protected function tearDown(): void
    {
        Monkey\tearDown();
        parent::tearDown();
    }

    /**
     * Stubs the credit of every provider.
     *
     * @param array{text: string, url: string, license: string, license_url: string}|null $attribution Credit.
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

    public function test_links_the_credit_to_the_provider_and_its_license(): void
    {
        $this->stubAttribution(self::OPEN_METEO);

        $html = $this->renderBlock('provider-attribution', [], ['elio/reportProvider' => 'open-meteo']);

        $this->assertSame(['open-meteo'], $this->askedProviders);
        $this->assertStringContainsString(
            '<a class="wp-block-elio-provider-attribution__provider-link" href="https://open-meteo.com/">Weather data by Open-Meteo.com</a>',
            $html
        );
        $this->assertStringContainsString(
            '<span class="wp-block-elio-provider-attribution__license">(<a class="wp-block-elio-provider-attribution__license-link" href="https://creativecommons.org/licenses/by/4.0/" rel="license">CC BY 4.0</a>)</span>',
            $html
        );
        $this->assertMatchesRegularExpression('#^\s*<p [^>]*>.*</p>\s*$#s', $html);
    }

    public function test_a_report_without_provider_credits_the_site_default_one(): void
    {
        $this->stubAttribution(self::OPEN_METEO);

        $this->renderBlock('provider-attribution');

        $this->assertSame([''], $this->askedProviders);
    }

    public function test_prints_the_credit_alone_when_the_provider_gives_no_link_nor_license(): void
    {
        $this->stubAttribution(['text' => 'Data by <Acme>', 'url' => '', 'license' => '', 'license_url' => '']);

        $html = $this->renderBlock('provider-attribution', [], ['elio/reportProvider' => 'acme']);

        $this->assertStringContainsString('Data by &lt;Acme&gt;', $html);
        $this->assertStringNotContainsString('<a ', $html);
        $this->assertStringNotContainsString('__license', $html);
    }

    public function test_prints_nothing_for_a_provider_that_asks_for_no_credit(): void
    {
        $this->stubAttribution(null);

        $this->assertSame('', trim($this->renderBlock('provider-attribution', [], ['elio/reportProvider' => 'silent'])));
    }
}
