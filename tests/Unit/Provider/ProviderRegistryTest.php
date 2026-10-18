<?php

namespace ElioBlocks\Tests\Unit\Provider;

use Brain\Monkey;
use Brain\Monkey\Functions;
use ElioBlocks\Provider\Provider;
use ElioBlocks\Provider\ProviderAttribution;
use ElioBlocks\Provider\ProviderCredential;
use ElioBlocks\Provider\ProviderRegistry;
use ElioBlocks\Tests\Stub\StubWeatherForecastAdapter;
use ElioBlocks\WeatherForecast\WeatherForecastAdapterInterface;
use Mockery;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

class ProviderRegistryTest extends TestCase
{
    private ProviderRegistry $registry;

    protected function setUp(): void
    {
        parent::setUp();
        Monkey\setUp();
        Functions\stubEscapeFunctions();

        $this->registry = new ProviderRegistry();
    }

    protected function tearDown(): void
    {
        Monkey\tearDown();
        parent::tearDown();
    }

    public function test_a_provider_is_known_by_its_slug(): void
    {
        $provider = new Provider('acme-weather', 'Acme Weather');

        $this->assertTrue($this->registry->register($provider));
        $this->assertSame($provider, $this->registry->getBySlug('acme-weather'));
        $this->assertNull($this->registry->getBySlug('unknown'));
    }

    public function test_a_provider_declaring_credentials_and_its_attribution_is_registered(): void
    {
        $this->assertTrue(
            $this->registry->register(
                new Provider(
                    'acme-weather',
                    'Acme Weather',
                    [
                        new ProviderCredential('username', 'Username', '', true),
                        new ProviderCredential('password', 'Password', '', true, true),
                    ],
                    new ProviderAttribution('https://acme.test/', 'CC BY 4.0', 'https://creativecommons.org/licenses/by/4.0/')
                )
            )
        );
        $this->assertTrue($this->registry->register(new Provider('plain-weather', 'Plain Weather', [], new ProviderAttribution('https://plain.test/'))));
    }

    #[DataProvider('invalidCredentials')]
    public function test_an_invalid_credential_refuses_the_provider(array $credentials, string $pattern): void
    {
        $this->expectDoingItWrong($pattern);

        $this->assertFalse($this->registry->register(new Provider('acme-weather', 'Acme Weather', $credentials)));
        $this->assertNull($this->registry->getBySlug('acme-weather'));
    }

    public static function invalidCredentials(): array
    {
        return [
            'declared as an array' => [['api_key' => ['label' => 'Key']], '/&quot;api_key&quot; of provider &quot;acme-weather&quot; must be a ProviderCredential/'],
            'hyphenated name'      => [[new ProviderCredential('api-key', 'Key')], '/must be named with lowercase letters, digits and underscores/'],
            'uppercase name'       => [[new ProviderCredential('API_KEY', 'Key')], '/must be named with lowercase letters/'],
            'no label'             => [[new ProviderCredential('api_key', ' ')], '/needs a label/'],
        ];
    }

    #[DataProvider('invalidAttributions')]
    public function test_an_invalid_attribution_refuses_the_provider(ProviderAttribution $attribution, string $pattern): void
    {
        $this->expectDoingItWrong($pattern);

        $this->assertFalse($this->registry->register(new Provider('acme-weather', 'Acme Weather', [], $attribution)));
        $this->assertNull($this->registry->getBySlug('acme-weather'));
    }

    public static function invalidAttributions(): array
    {
        return [
            'no site'            => [new ProviderAttribution('', 'CC BY 4.0'), '/needs the url of its site/'],
            'script URL'         => [new ProviderAttribution('javascript:alert(1)'), '/url of the attribution .* must be an http\(s\) URL/'],
            'relative URL'       => [new ProviderAttribution('/credits'), '/url of the attribution/'],
            'license URL no URL' => [new ProviderAttribution('https://acme.test/', 'CC BY 4.0', 'CC BY 4.0'), '/license_url of the attribution/'],
        ];
    }

    public function test_lists_the_providers_in_the_order_they_were_registered(): void
    {
        $this->registry->register(new Provider('open-meteo', 'Open-Meteo'));
        $this->registry->register(new Provider('acme-weather', 'Acme Weather'));

        $this->assertSame(
            ['open-meteo', 'acme-weather'],
            array_map(static fn(Provider $provider): string => $provider->slug, $this->registry->getAll())
        );
    }

    public function test_lists_the_providers_that_serve_a_domain(): void
    {
        $this->registry->register(new Provider('open-meteo', 'Open-Meteo', [], null, [new StubWeatherForecastAdapter()]));
        $this->registry->register(new Provider('air-only', 'Air Only', [], null, [new \stdClass()]));
        $this->registry->register(new Provider('acme-weather', 'Acme Weather', [], null, [new StubWeatherForecastAdapter()]));

        $this->assertSame(
            ['open-meteo', 'acme-weather'],
            array_map(
                static fn(Provider $provider): string => $provider->slug,
                $this->registry->getServing(WeatherForecastAdapterInterface::class)
            )
        );
    }

    public function test_a_slug_is_registered_once_and_the_first_provider_kept(): void
    {
        $this->registry->register(new Provider('open-meteo', 'Open-Meteo'));
        $this->expectDoingItWrong('/&quot;open-meteo&quot; is already registered/');

        $this->assertFalse($this->registry->register(new Provider('open-meteo', 'Another Open-Meteo')));
        $this->assertSame('Open-Meteo', $this->registry->getBySlug('open-meteo')?->label);
    }

    #[DataProvider('invalidSlugs')]
    public function test_a_slug_is_lowercase_letters_digits_and_hyphens(string $slug): void
    {
        $this->expectDoingItWrong('/must be lowercase letters, digits and hyphens/');

        $this->assertFalse($this->registry->register(new Provider($slug, 'Acme Weather')));
        $this->assertSame([], $this->registry->getAll());
    }

    public static function invalidSlugs(): array
    {
        return [
            'empty'      => [''],
            'uppercase'  => ['Acme'],
            'underscore' => ['acme_weather'],
            'space'      => ['acme weather'],
        ];
    }

    public function test_a_provider_has_a_label(): void
    {
        $this->expectDoingItWrong('/needs a label/');

        $this->assertFalse($this->registry->register(new Provider('acme-weather', ' ')));
        $this->assertNull($this->registry->getBySlug('acme-weather'));
    }

    public function test_nothing_is_registered_once_the_registry_is_built(): void
    {
        $this->assertFalse($this->registry->isBuilt());
        $this->registry->build();
        $this->assertTrue($this->registry->isBuilt());

        $this->expectDoingItWrong('/already built/');

        $this->assertFalse($this->registry->register(new Provider('too-late', 'Too late')));
        $this->assertNull($this->registry->getBySlug('too-late'));
    }

    private function expectDoingItWrong(string $pattern): void
    {
        Functions\expect('_doing_it_wrong')->once()->with(
            'ElioBlocks\Provider\ProviderRegistry::register',
            Mockery::pattern($pattern),
            '0.1.0'
        );
    }
}
