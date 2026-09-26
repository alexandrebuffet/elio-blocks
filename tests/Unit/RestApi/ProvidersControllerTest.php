<?php

namespace ElioBlocks\Tests\Unit\RestApi;

use Brain\Monkey;
use Brain\Monkey\Functions;
use ElioBlocks\Provider\ProviderRegistry;
use ElioBlocks\RestApi\Endpoints\ProvidersController;
use ElioBlocks\Settings\PluginSettings;
use PHPUnit\Framework\TestCase;
use WP_Error;
use WP_REST_Request;

/**
 * The settings page lists the providers, whatever they serve, to ask for the
 * API key of those that need one, and saves it through
 * /providers/{slug}/api-key. Both are reserved to administrators.
 */
class ProvidersControllerTest extends TestCase
{
    private ProviderRegistry $providers;

    protected function setUp(): void
    {
        parent::setUp();
        Monkey\setUp();

        Functions\when('__')->returnArg();
        Functions\when('rest_ensure_response')->alias(static fn($data) => new \WP_REST_Response($data));

        // The built-in provider, then one a third party registered on elio_blocks_init.
        $this->providers = new ProviderRegistry();
        $this->providers->register('open-meteo', ['label' => 'Open-Meteo']);
        $this->providers->register(
            'third-party',
            [
                'label'       => 'Third Party',
                'credentials' => [
                    'username' => ['label' => 'Username', 'required' => true],
                    'password' => ['label' => 'Password', 'description' => 'Of the account.', 'required' => true, 'secret' => true],
                ],
            ]
        );

        $this->options = [];
        Functions\when('get_option')->alias(fn(string $name, $default = false) => $this->options[ $name ] ?? $default);
        Functions\when('update_option')->alias(function (string $name, $value): bool {
            $this->options[ $name ] = $value;
            return true;
        });
        Functions\when('sanitize_text_field')->alias(static fn(string $value): string => trim(strip_tags($value)));
    }

    /**
     * Stored options, by name.
     *
     * @var array<string, mixed>
     */
    private array $options = [];

    protected function tearDown(): void
    {
        Monkey\tearDown();
        parent::tearDown();
    }

    private function makeController(?PluginSettings $settings = null): ProvidersController
    {
        return new ProvidersController($this->providers, $settings ?? new PluginSettings());
    }

    public function test_lists_every_provider_and_the_credentials_it_declares_without_a_secret_value(): void
    {
        $this->options[ PluginSettings::OPTION_PROVIDER_CREDENTIALS ] = [
            'third-party' => ['username' => 'me', 'password' => 's3cret'],
        ];

        $response = $this->makeController()->get_items(new WP_REST_Request());

        $this->assertSame(
            [
                ['slug' => 'open-meteo', 'label' => 'Open-Meteo', 'credentials' => []],
                [
                    'slug'        => 'third-party',
                    'label'       => 'Third Party',
                    'credentials' => [
                        [
                            'name'              => 'username',
                            'label'             => 'Username',
                            'description'       => '',
                            'required'          => true,
                            'secret'            => false,
                            'constant'          => 'ELIO_BLOCKS_THIRD_PARTY_USERNAME',
                            'isDefinedInConfig' => false,
                            'isSet'             => true,
                            'value'             => 'me',
                        ],
                        [
                            'name'              => 'password',
                            'label'             => 'Password',
                            'description'       => 'Of the account.',
                            'required'          => true,
                            'secret'            => true,
                            'constant'          => 'ELIO_BLOCKS_THIRD_PARTY_PASSWORD',
                            'isDefinedInConfig' => false,
                            'isSet'             => true,
                            'value'             => '',
                        ],
                    ],
                ],
            ],
            $response->get_data()
        );
    }

    public function test_administrators_can_list_the_providers(): void
    {
        Functions\when('current_user_can')->alias(static fn(string $cap): bool => 'manage_options' === $cap);

        $this->assertTrue($this->makeController()->get_items_permissions_check(new WP_REST_Request()));
    }

    public function test_people_who_only_edit_content_cannot_list_the_providers(): void
    {
        Functions\when('current_user_can')->alias(static fn(string $cap): bool => 'edit_posts' === $cap);

        $this->assertFalse($this->makeController()->get_items_permissions_check(new WP_REST_Request()));
    }

    public function test_saves_the_credentials_given_keeps_the_others_and_answers_the_provider(): void
    {
        $this->options[ PluginSettings::OPTION_PROVIDER_CREDENTIALS ] = [
            'open-meteo'  => ['api_key' => 'k3y'],
            'third-party' => ['username' => 'me'],
        ];

        $response = $this->makeController()->save_credentials(
            new WP_REST_Request(['slug' => 'third-party', 'credentials' => ['password' => 's3cret']])
        );

        $this->assertSame(
            [
                'open-meteo'  => ['api_key' => 'k3y'],
                'third-party' => ['username' => 'me', 'password' => 's3cret'],
            ],
            $this->options[ PluginSettings::OPTION_PROVIDER_CREDENTIALS ]
        );
        $this->assertSame('third-party', $response->get_data()['slug']);
        $this->assertTrue($response->get_data()['credentials'][1]['isSet']);
        $this->assertSame('', $response->get_data()['credentials'][1]['value']);
    }

    public function test_an_empty_value_forgets_the_saved_credential(): void
    {
        $this->options[ PluginSettings::OPTION_PROVIDER_CREDENTIALS ] = [
            'third-party' => ['username' => 'me', 'password' => 's3cret'],
        ];

        $this->makeController()->save_credentials(
            new WP_REST_Request(['slug' => 'third-party', 'credentials' => ['password' => '']])
        );

        $this->assertSame(
            ['third-party' => ['username' => 'me']],
            $this->options[ PluginSettings::OPTION_PROVIDER_CREDENTIALS ]
        );
    }

    public function test_a_secret_keeps_its_characters_but_control_ones_and_other_values_are_sanitized(): void
    {
        $this->makeController()->save_credentials(
            new WP_REST_Request(
                [
                    'slug'        => 'third-party',
                    'credentials' => ['username' => ' <b>me</b> ', 'password' => " p<a%20ss\n"],
                ]
            )
        );

        $this->assertSame(
            ['third-party' => ['username' => 'me', 'password' => 'p<a%20ss']],
            $this->options[ PluginSettings::OPTION_PROVIDER_CREDENTIALS ]
        );
    }

    public function test_refuses_a_credential_the_provider_does_not_declare(): void
    {
        $response = $this->makeController()->save_credentials(
            new WP_REST_Request(['slug' => 'third-party', 'credentials' => ['username' => 'me', 'api_key' => 'k3y']])
        );

        $this->assertInstanceOf(WP_Error::class, $response);
        $this->assertSame('elio_blocks_unknown_credential', $response->get_error_code());
        $this->assertSame(['status' => 400], $response->get_error_data());
        $this->assertArrayNotHasKey(PluginSettings::OPTION_PROVIDER_CREDENTIALS, $this->options);
    }

    public function test_refuses_the_credentials_of_a_provider_that_is_not_registered(): void
    {
        $response = $this->makeController()->save_credentials(
            new WP_REST_Request(['slug' => 'uninstalled', 'credentials' => ['api_key' => 'k3y']])
        );

        $this->assertInstanceOf(WP_Error::class, $response);
        $this->assertSame('elio_blocks_provider_not_found', $response->get_error_code());
        $this->assertSame(['status' => 404], $response->get_error_data());
        $this->assertArrayNotHasKey(PluginSettings::OPTION_PROVIDER_CREDENTIALS, $this->options);
    }
}
