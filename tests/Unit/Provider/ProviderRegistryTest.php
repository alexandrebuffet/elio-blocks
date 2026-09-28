<?php

namespace ElioBlocks\Tests\Unit\Provider;

use Brain\Monkey;
use Brain\Monkey\Functions;
use ElioBlocks\Provider\Provider;
use ElioBlocks\Provider\ProviderAttribution;
use ElioBlocks\Provider\ProviderCredential;
use ElioBlocks\Provider\ProviderRegistry;
use Mockery;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

/**
 * The providers: the organizations Elio gets data from, registered once
 * whatever they serve.
 */
class ProviderRegistryTest extends TestCase
{
    private ProviderRegistry $registry;

    protected function setUp(): void
    {
        parent::setUp();
        Monkey\setUp();
        // The slugs in error messages are escaped.
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
        $this->registry->register('acme-weather', ['label' => 'Acme Weather']);

        $this->assertEquals(new Provider('acme-weather', 'Acme Weather'), $this->registry->getBySlug('acme-weather'));
        $this->assertNull($this->registry->getBySlug('unknown'));
    }

    public function test_a_provider_declares_no_credentials_unless_it_says_so(): void
    {
        $this->registry->register('open-meteo', ['label' => 'Open-Meteo']);

        $this->assertSame([], $this->registry->getBySlug('open-meteo')->credentials);
    }

    public function test_a_provider_declares_its_credentials_in_order_with_their_defaults(): void
    {
        $this->assertTrue(
            $this->registry->register(
                'acme-weather',
                [
                    'label'       => 'Acme Weather',
                    'credentials' => [
                        'username' => ['label' => 'Username', 'required' => true],
                        'password' => ['label' => 'Password', 'required' => true, 'secret' => true],
                        'contact'  => ['label' => 'Contact', 'description' => 'Who they write to.'],
                    ],
                ]
            )
        );

        $this->assertEquals(
            [
                'username' => new ProviderCredential('username', 'Username', '', true, false),
                'password' => new ProviderCredential('password', 'Password', '', true, true),
                'contact'  => new ProviderCredential('contact', 'Contact', 'Who they write to.', false, false),
            ],
            $this->registry->getBySlug('acme-weather')->credentials
        );
    }

    #[DataProvider('invalidCredentials')]
    public function test_an_invalid_credential_refuses_the_provider(mixed $credentials, string $pattern): void
    {
        $this->expectDoingItWrong($pattern);

        $this->assertFalse(
            $this->registry->register('acme-weather', ['label' => 'Acme Weather', 'credentials' => $credentials])
        );
        $this->assertNull($this->registry->getBySlug('acme-weather'));
    }

    public static function invalidCredentials(): array
    {
        return [
            'not an array'       => ['api_key', '/credentials of provider &quot;acme-weather&quot; must be an array/'],
            'list, not named'    => [[['label' => 'Key']], '/must be named with lowercase letters, digits and underscores/'],
            'hyphenated name'    => [['api-key' => ['label' => 'Key']], '/must be named with lowercase letters/'],
            'uppercase name'     => [['API_KEY' => ['label' => 'Key']], '/must be named with lowercase letters/'],
            'arguments a string' => [['api_key' => 'Key'], '/&quot;api_key&quot; of provider &quot;acme-weather&quot; must be an array/'],
            'no label'           => [['api_key' => ['secret' => true]], '/needs a label/'],
            'unknown argument'   => [['api_key' => ['label' => 'Key', 'render_callback' => 'x']], '/unknown arguments: render_callback/'],
            'required not bool'  => [['api_key' => ['label' => 'Key', 'required' => 'yes']], '/boolean required and secret/'],
            'description markup' => [['api_key' => ['label' => 'Key', 'description' => ['<b>']]], '/string description/'],
        ];
    }

    public function test_a_provider_declares_the_credit_its_license_asks_for(): void
    {
        $this->assertTrue(
            $this->registry->register(
                'acme-weather',
                [
                    'label'       => 'Acme Weather',
                    'attribution' => [
                        'text'        => 'Weather data by Acme',
                        'url'         => 'https://acme.test/',
                        'license'     => 'CC BY 4.0',
                        'license_url' => 'https://creativecommons.org/licenses/by/4.0/',
                    ],
                ]
            )
        );
        $this->registry->register('plain-weather', ['label' => 'Plain Weather', 'attribution' => ['text' => 'Data by Plain']]);
        $this->registry->register('open-weather', ['label' => 'Open Weather']);

        $this->assertEquals(
            new ProviderAttribution('Weather data by Acme', 'https://acme.test/', 'CC BY 4.0', 'https://creativecommons.org/licenses/by/4.0/'),
            $this->registry->getBySlug('acme-weather')->attribution
        );
        $this->assertEquals(new ProviderAttribution('Data by Plain'), $this->registry->getBySlug('plain-weather')->attribution);
        $this->assertNull($this->registry->getBySlug('open-weather')->attribution, 'It asks for no credit.');
    }

    #[DataProvider('invalidAttributions')]
    public function test_an_invalid_attribution_refuses_the_provider(mixed $attribution, string $pattern): void
    {
        $this->expectDoingItWrong($pattern);

        $this->assertFalse(
            $this->registry->register('acme-weather', ['label' => 'Acme Weather', 'attribution' => $attribution])
        );
        $this->assertNull($this->registry->getBySlug('acme-weather'));
    }

    public static function invalidAttributions(): array
    {
        return [
            'not an array'       => ['Data by Acme', '/attribution of provider &quot;acme-weather&quot; must be an array/'],
            'no text'            => [['url' => 'https://acme.test/'], '/needs a text/'],
            'blank text'         => [['text' => ' '], '/needs a text/'],
            'text markup array'  => [['text' => ['<b>Acme</b>']], '/needs a string text/'],
            'unknown argument'   => [['text' => 'Acme', 'html' => '<a>'], '/unknown arguments: html/'],
            'script URL'         => [['text' => 'Acme', 'url' => 'javascript:alert(1)'], '/url of the attribution .* must be an http\(s\) URL/'],
            'relative URL'       => [['text' => 'Acme', 'url' => '/credits'], '/url of the attribution/'],
            'license URL no URL' => [['text' => 'Acme', 'license_url' => 'CC BY 4.0'], '/license_url of the attribution/'],
        ];
    }

    public function test_lists_the_providers_in_the_order_they_were_registered(): void
    {
        $this->registry->register('open-meteo', ['label' => 'Open-Meteo']);
        $this->registry->register('acme-weather', ['label' => 'Acme Weather']);

        $this->assertSame(
            ['open-meteo', 'acme-weather'],
            array_map(static fn(Provider $provider): string => $provider->slug, $this->registry->getAll())
        );
    }

    public function test_register_returns_true_for_a_valid_provider(): void
    {
        $this->assertTrue($this->registry->register('open-meteo', ['label' => 'Open-Meteo']));
    }

    public function test_a_slug_is_registered_once_and_the_first_provider_kept(): void
    {
        $this->registry->register('open-meteo', ['label' => 'Open-Meteo']);
        $this->expectDoingItWrong('/&quot;open-meteo&quot; is already registered/');

        $this->assertFalse($this->registry->register('open-meteo', ['label' => 'Another Open-Meteo']));
        $this->assertSame('Open-Meteo', $this->registry->getBySlug('open-meteo')?->label);
    }

    /**
     * Checks that a slug is lowercase letters, digits and hyphens.
     *
     * The slug names the API key constant, ELIO_BLOCKS_{SLUG}_API_KEY, and the
     * /providers/{slug}/api-key route.
     */
    #[DataProvider('invalidSlugs')]
    public function test_a_slug_is_lowercase_letters_digits_and_hyphens(string $slug): void
    {
        $this->expectDoingItWrong('/must be lowercase letters, digits and hyphens/');

        $this->assertFalse($this->registry->register($slug, ['label' => 'Acme Weather']));
        $this->assertSame([], $this->registry->getAll());
    }

    /**
     * Provides slugs the registry refuses.
     *
     * @return array<string, array{string}>
     */
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

        $this->assertFalse($this->registry->register('acme-weather', ['label' => '']));
        $this->assertNull($this->registry->getBySlug('acme-weather'));
    }

    public function test_an_unknown_argument_is_refused_rather_than_ignored(): void
    {
        $this->expectDoingItWrong('/unknown arguments: requires_api_key/');

        $this->assertFalse(
            $this->registry->register('acme-weather', ['label' => 'Acme Weather', 'requires_api_key' => true])
        );
        $this->assertNull($this->registry->getBySlug('acme-weather'));
    }

    public function test_nothing_is_registered_once_the_registry_is_built(): void
    {
        $this->assertFalse($this->registry->isBuilt());
        $this->registry->build();
        $this->assertTrue($this->registry->isBuilt());

        $this->expectDoingItWrong('/already built/');

        $this->assertFalse($this->registry->register('too-late', ['label' => 'Too late']));
        $this->assertNull($this->registry->getBySlug('too-late'));
    }

    /**
     * Expects the registration to be refused with one _doing_it_wrong() notice.
     *
     * @param string $pattern Pattern of the (escaped) message.
     */
    private function expectDoingItWrong(string $pattern): void
    {
        Functions\expect('_doing_it_wrong')->once()->with(
            'ElioBlocks\Provider\ProviderRegistry::register',
            Mockery::pattern($pattern),
            '0.1.0'
        );
    }
}
