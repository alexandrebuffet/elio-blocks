<?php

namespace ElioBlocks\RestApi\Endpoints;

use WP_REST_Controller;
use WP_REST_Request;
use WP_REST_Response;
use ElioBlocks\Provider\Provider;
use ElioBlocks\Provider\ProviderCredential;
use ElioBlocks\Provider\ProviderRegistry;
use ElioBlocks\Settings\PluginSettings;

if (!defined('ABSPATH')) {
    die;
}

/**
 * Handles /elio/v1/providers requests: every provider, whatever it serves,
 * and the credentials it declares.
 *
 * The settings page reads the list to draw a card per provider that declares
 * credentials, and saves them here; both are reserved to administrators. The
 * providers a block may pick are listed per domain (/weather-forecast/providers).
 */
class ProvidersController extends WP_REST_Controller
{
    protected $namespace = 'elio/v1';
    protected $rest_base = 'providers';

    /**
     * Longest value a credential may be saved with: longer than any key or
     * password a provider issues, short enough to keep the option small.
     */
    private const MAX_CREDENTIAL_LENGTH = 1024;

    public function __construct(
        private ProviderRegistry $providers,
        private PluginSettings $settings,
    ) {
    }

    public function register_routes(): void
    {
        register_rest_route(
            $this->namespace,
            '/' . $this->rest_base,
            [
                [
                    'methods'             => 'GET',
                    'callback'            => [$this, 'get_items'],
                    'permission_callback' => [$this, 'get_items_permissions_check'],
                ],
            ]
        );

        register_rest_route(
            $this->namespace,
            '/' . $this->rest_base . '/(?P<slug>[a-z0-9-]+)/credentials',
            [
                [
                    'methods'             => 'POST',
                    'callback'            => [$this, 'save_credentials'],
                    'permission_callback' => static fn() => current_user_can('manage_options'),
                    'args'                => [
                        'slug'        => [
                            'type'     => 'string',
                            'required' => true,
                        ],
                        'credentials' => [
                            'description'          => __('Values by credential name. An empty value forgets the saved one.', 'elio-blocks'),
                            'type'                 => 'object',
                            'required'             => true,
                            'additionalProperties' => [
                                'type'      => 'string',
                                'maxLength' => self::MAX_CREDENTIAL_LENGTH,
                            ],
                        ],
                    ],
                ],
            ]
        );
    }

    /**
     * Checks whether the request may list the providers.
     *
     * @param WP_REST_Request $request Full details about the request.
     * @return bool
     */
    public function get_items_permissions_check($request)
    {
        return current_user_can('manage_options');
    }

    /**
     * Lists the registered providers, with the credentials they declare.
     *
     * @param WP_REST_Request $request Full details about the request.
     * @return WP_REST_Response
     */
    public function get_items($request): WP_REST_Response
    {
        return rest_ensure_response(
            array_map(
                fn(Provider $provider): array => $this->prepareProvider($provider),
                $this->providers->getAll()
            )
        );
    }

    /**
     * Saves credentials of a provider: only the ones it declares.
     *
     * @param WP_REST_Request $request Full details about the request.
     * @return WP_REST_Response|\WP_Error The provider, as listed, once saved.
     */
    public function save_credentials(WP_REST_Request $request): WP_REST_Response|\WP_Error
    {
        $provider = $this->providers->getBySlug((string) $request->get_param('slug'));

        if (null === $provider) {
            return new \WP_Error(
                'elio_blocks_provider_not_found',
                __('Unknown provider.', 'elio-blocks'),
                ['status' => 404]
            );
        }

        $values = (array) $request->get_param('credentials');

        $unknown = array_diff(array_keys($values), array_keys($provider->credentials));
        if (array() !== $unknown) {
            return new \WP_Error(
                'elio_blocks_unknown_credential',
                __('This provider has no such credential.', 'elio-blocks'),
                ['status' => 400]
            );
        }

        $sanitized = [];
        foreach ($values as $name => $value) {
            $sanitized[ $name ] = $this->sanitizeCredential($provider->credentials[ $name ], (string) $value);
        }

        $this->settings->setProviderCredentials($provider->slug, $sanitized);

        return rest_ensure_response($this->prepareProvider($provider));
    }

    /**
     * Prepares a provider as the settings page reads it. A secret value never leaves
     * the server: the page only learns whether it is set.
     *
     * @return array<string, mixed>
     */
    private function prepareProvider(Provider $provider): array
    {
        $credentials = [];

        foreach ($provider->credentials as $name => $credential) {
            $value             = $this->settings->getProviderCredential($provider->slug, $name);
            $isDefinedInConfig = $this->settings->isProviderCredentialDefinedInConfig($provider->slug, $name);

            $credentials[] = [
                'name'              => $name,
                'label'             => $credential->label,
                'description'       => $credential->description,
                'required'          => $credential->required,
                'secret'            => $credential->secret,
                'constant'          => PluginSettings::getProviderCredentialConstant($provider->slug, $name),
                'isDefinedInConfig' => $isDefinedInConfig,
                'isSet'             => null !== $value,
                'value'             => $credential->secret || $isDefinedInConfig ? '' : (string) $value,
            ];
        }

        return [
            'slug'        => $provider->slug,
            'label'       => $provider->label,
            'credentials' => $credentials,
        ];
    }

    /**
     * Sanitizes a credential as typed: trimmed. A secret keeps its characters (a
     * password may hold "<" or "%"), bar control characters.
     */
    private function sanitizeCredential(ProviderCredential $credential, string $value): string
    {
        return $credential->secret
            ? trim((string) preg_replace('/[\x00-\x1F\x7F]/', '', $value))
            : sanitize_text_field($value);
    }
}
