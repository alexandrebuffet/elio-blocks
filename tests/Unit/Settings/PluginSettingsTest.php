<?php

namespace ElioBlocks\Tests\Unit\Settings;

use Brain\Monkey;
use Brain\Monkey\Functions;
use ElioBlocks\Provider\Provider;
use ElioBlocks\Provider\ProviderCredential;
use ElioBlocks\Settings\PluginSettings;
use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;
use PHPUnit\Framework\TestCase;

class PluginSettingsTest extends TestCase
{
    // Counts Brain Monkey expectations (update_option called once with…) as assertions.
    use MockeryPHPUnitIntegration;

    protected function setUp(): void
    {
        parent::setUp();
        Monkey\setUp();
    }

    protected function tearDown(): void
    {
        Monkey\tearDown();
        parent::tearDown();
    }

    public function test_unit_overrides_gather_every_domain_with_empty_string_meaning_follow_the_preset(): void
    {
        $stored = array(
            PluginSettings::OPTION_WIND_UNIT     => 'ms',
            PluginSettings::OPTION_PRESSURE_UNIT => 'inhg',
        );
        Functions\when('get_option')->alias(static fn(string $name, $default = false) => $stored[ $name ] ?? $default);

        $this->assertSame(
            array(
                'temperature'   => '',
                'wind'          => 'ms',
                'precipitation' => '',
                'pressure'      => 'inhg',
                'distance'      => '',
            ),
            (new PluginSettings())->getUnitOverrides()
        );
    }

    public function test_a_provider_credential_comes_from_the_stored_credentials(): void
    {
        $stored = array( PluginSettings::OPTION_PROVIDER_CREDENTIALS => array( 'acme' => array( 'api_key' => 'from-db' ) ) );
        Functions\when('get_option')->alias(static fn(string $name, $default = false) => $stored[ $name ] ?? $default);

        $this->assertSame('from-db', (new PluginSettings())->getProviderCredential('acme', 'api_key'));
        $this->assertNull((new PluginSettings())->getProviderCredential('acme', 'password'));
        $this->assertNull((new PluginSettings())->getProviderCredential('unknown', 'api_key'));
    }

    public function test_a_provider_credential_constant_wins_over_the_stored_value(): void
    {
        define('ELIO_BLOCKS_MY_PROVIDER_API_KEY', 'from-wp-config');
        $stored = array( PluginSettings::OPTION_PROVIDER_CREDENTIALS => array( 'my-provider' => array( 'api_key' => 'from-db' ) ) );
        Functions\when('get_option')->alias(static fn(string $name, $default = false) => $stored[ $name ] ?? $default);

        $this->assertSame('ELIO_BLOCKS_MY_PROVIDER_API_KEY', PluginSettings::getProviderCredentialConstant('my-provider', 'api_key'));
        $this->assertTrue((new PluginSettings())->isProviderCredentialDefinedInConfig('my-provider', 'api_key'));
        $this->assertSame('from-wp-config', (new PluginSettings())->getProviderCredential('my-provider', 'api_key'));
    }

    public function test_the_credentials_of_a_provider_are_the_ones_it_declares_that_are_set(): void
    {
        $stored = array(
            PluginSettings::OPTION_PROVIDER_CREDENTIALS => array(
                'acme'  => array( 'username' => 'me', 'password' => '', 'leftover' => 'x' ),
                'other' => array( 'api_key' => 'n0t-y0urs' ),
            ),
        );
        Functions\when('get_option')->alias(static fn(string $name, $default = false) => $stored[ $name ] ?? $default);

        $provider = new Provider(
            'acme',
            'Acme',
            array(
                'username' => new ProviderCredential('username', 'Username'),
                'password' => new ProviderCredential('password', 'Password', '', true, true),
                'api_key'  => new ProviderCredential('api_key', 'API Key'),
            )
        );

        $this->assertSame(array( 'username' => 'me' ), (new PluginSettings())->getProviderCredentials($provider));
    }

    public function test_saving_credentials_keeps_the_others_and_forgets_the_emptied_ones(): void
    {
        $stored = array(
            PluginSettings::OPTION_PROVIDER_CREDENTIALS => array(
                'a' => array( 'api_key' => 'key-a' ),
                'b' => array( 'username' => 'me', 'password' => 'old' ),
            ),
        );
        Functions\when('get_option')->alias(static fn(string $name, $default = false) => $stored[ $name ] ?? $default);
        Functions\expect('update_option')
            ->once()
            ->with(
                PluginSettings::OPTION_PROVIDER_CREDENTIALS,
                array(
                    'a' => array( 'api_key' => 'key-a' ),
                    'b' => array( 'password' => 'new' ),
                ),
                false
            )
            ->andReturn(true);

        (new PluginSettings())->setProviderCredentials('b', array( 'username' => '', 'password' => 'new' ));
    }

    public function test_a_provider_left_without_credentials_is_dropped_from_the_option(): void
    {
        $stored = array( PluginSettings::OPTION_PROVIDER_CREDENTIALS => array( 'a' => array( 'api_key' => 'key-a' ) ) );
        Functions\when('get_option')->alias(static fn(string $name, $default = false) => $stored[ $name ] ?? $default);
        Functions\expect('update_option')
            ->once()
            ->with(PluginSettings::OPTION_PROVIDER_CREDENTIALS, array(), false)
            ->andReturn(true);

        (new PluginSettings())->setProviderCredentials('a', array( 'api_key' => '' ));
    }

    public function test_condition_icon_collection_falls_back_to_elio_when_unset(): void
    {
        $stored = array();
        Functions\when('get_option')->alias(static fn(string $name, $default = false) => $stored[ $name ] ?? $default);

        $this->assertSame('elio', (new PluginSettings())->getConditionIconCollection());
    }

    public function test_condition_icon_collection_comes_from_the_stored_option(): void
    {
        $stored = array( PluginSettings::OPTION_CONDITION_ICON_COLLECTION => 'my-theme' );
        Functions\when('get_option')->alias(static fn(string $name, $default = false) => $stored[ $name ] ?? $default);

        $this->assertSame('my-theme', (new PluginSettings())->getConditionIconCollection());
        $this->assertContains(PluginSettings::OPTION_CONDITION_ICON_COLLECTION, PluginSettings::optionNames());
    }
}
