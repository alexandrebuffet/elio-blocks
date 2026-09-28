<?php

declare(strict_types=1);

namespace ElioBlocks\Provider;

// Exit if called directly.
if (! defined('ABSPATH')) {
    die;
}

/**
 * Registry of the providers, indexed by slug.
 *
 * Locked after build(), like the registries of what they serve: third parties
 * register on elio_blocks_init.
 */
final class ProviderRegistry
{
    /**
     * Arguments a provider is registered with, and their defaults.
     */
    private const DEFAULT_ARGS = array(
        'label'       => '',
        'credentials' => array(),
        'attribution' => null,
    );

    /**
     * Arguments an attribution is declared with, and their defaults.
     */
    private const DEFAULT_ATTRIBUTION_ARGS = array(
        'text'        => '',
        'url'         => '',
        'license'     => '',
        'license_url' => '',
    );

    /**
     * Arguments a credential is declared with, and their defaults.
     */
    private const DEFAULT_CREDENTIAL_ARGS = array(
        'label'       => '',
        'description' => '',
        'required'    => false,
        'secret'      => false,
    );

    /**
     * Registered providers, indexed by slug.
     *
     * @var array<string, Provider>
     */
    private array $providers = array();

    /**
     * Whether the registry has been locked.
     *
     * @var bool
     */
    private bool $built = false;

    /**
     * Registers a provider.
     *
     * As the core registries do (WP_Block_Type_Registry), an invalid
     * registration is refused with a _doing_it_wrong() notice, never an
     * exception: a third-party plugin getting it wrong must not take the
     * site down during init.
     *
     * A credential is only described: plain text, no markup nor callback. The
     * settings page draws its field, escaped, and saves only what is declared.
     * So is an attribution: plain text and http(s) URLs, printed escaped.
     *
     * @param string               $slug Unique identifier: lowercase letters, digits and hyphens. It
     *                                   names the constants of its credentials (ELIO_BLOCKS_{SLUG}_{NAME}).
     * @param array<string, mixed> $args {
     *     @type string $label       Name shown to people. Required.
     *     @type array  $credentials What identifies the site to it, by name (lowercase letters, digits
     *                               and underscores), each an array of:
     *                               'label' (string, required), 'description' (string, plain text),
     *                               'required' (bool, default false: the provider answers without it),
     *                               'secret' (bool, default false: typed hidden, never sent back to the
     *                               browser). Default none.
     *     @type array  $attribution The credit its license asks for wherever its data is shown, an array
     *                               of: 'text' (string, plain text, required), 'url' (string, http(s) URL
     *                               the text links to), 'license' (string, name of the license of the
     *                               data), 'license_url' (string, http(s) URL of that license). Default
     *                               none.
     * }
     * @return bool True if the provider was registered, false otherwise.
     */
    public function register(string $slug, array $args): bool
    {
        if ($this->built) {
            return $this->refuse(
                sprintf('Cannot register provider "%s": the provider registry is already built.', $slug)
            );
        }

        if (1 !== preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/', $slug)) {
            return $this->refuse(
                sprintf('Provider slug "%s" must be lowercase letters, digits and hyphens.', $slug)
            );
        }

        if (isset($this->providers[ $slug ])) {
            return $this->refuse(sprintf('A provider with slug "%s" is already registered.', $slug));
        }

        $unknown = array_diff(array_keys($args), array_keys(self::DEFAULT_ARGS));
        if (array() !== $unknown) {
            return $this->refuse(
                sprintf('Provider "%s" has unknown arguments: %s.', $slug, implode(', ', $unknown))
            );
        }

        $args = array_merge(self::DEFAULT_ARGS, $args);

        if (! is_string($args['label']) || '' === trim($args['label'])) {
            return $this->refuse(sprintf('Provider "%s" needs a label.', $slug));
        }

        if (! is_array($args['credentials'])) {
            return $this->refuse(sprintf('The credentials of provider "%s" must be an array.', $slug));
        }

        $credentials = array();
        foreach ($args['credentials'] as $name => $credentialArgs) {
            $credential = $this->makeCredential($slug, $name, $credentialArgs);
            if (is_string($credential)) {
                return $this->refuse($credential);
            }
            $credentials[ $credential->name ] = $credential;
        }

        $attribution = null;
        if (null !== $args['attribution']) {
            $attribution = $this->makeAttribution($slug, $args['attribution']);
            if (is_string($attribution)) {
                return $this->refuse($attribution);
            }
        }

        $this->providers[ $slug ] = new Provider($slug, $args['label'], $credentials, $attribution);

        return true;
    }

    /**
     * Makes a declared credential, or tells why it is refused.
     *
     * @param string $slug Slug of its provider.
     * @param mixed  $name Its name, as declared.
     * @param mixed  $args Its arguments, as declared.
     * @return ProviderCredential|string
     */
    private function makeCredential(string $slug, mixed $name, mixed $args): ProviderCredential|string
    {
        if (! is_string($name) || 1 !== preg_match('/^[a-z0-9]+(?:_[a-z0-9]+)*$/', $name)) {
            return sprintf(
                'Credential "%s" of provider "%s" must be named with lowercase letters, digits and underscores.',
                (string) $name,
                $slug
            );
        }

        if (! is_array($args)) {
            return sprintf('Credential "%s" of provider "%s" must be an array.', $name, $slug);
        }

        $unknown = array_diff(array_keys($args), array_keys(self::DEFAULT_CREDENTIAL_ARGS));
        if (array() !== $unknown) {
            return sprintf(
                'Credential "%s" of provider "%s" has unknown arguments: %s.',
                $name,
                $slug,
                implode(', ', $unknown)
            );
        }

        $args = array_merge(self::DEFAULT_CREDENTIAL_ARGS, $args);

        if (! is_string($args['label']) || '' === trim($args['label'])) {
            return sprintf('Credential "%s" of provider "%s" needs a label.', $name, $slug);
        }

        if (! is_string($args['description']) || ! is_bool($args['required']) || ! is_bool($args['secret'])) {
            return sprintf(
                'Credential "%s" of provider "%s" needs a string description and boolean required and secret.',
                $name,
                $slug
            );
        }

        return new ProviderCredential($name, $args['label'], $args['description'], $args['required'], $args['secret']);
    }

    /**
     * Makes a declared attribution, or tells why it is refused.
     *
     * @param string $slug Slug of its provider.
     * @param mixed  $args Its arguments, as declared.
     * @return ProviderAttribution|string
     */
    private function makeAttribution(string $slug, mixed $args): ProviderAttribution|string
    {
        if (! is_array($args)) {
            return sprintf('The attribution of provider "%s" must be an array.', $slug);
        }

        $unknown = array_diff(array_keys($args), array_keys(self::DEFAULT_ATTRIBUTION_ARGS));
        if (array() !== $unknown) {
            return sprintf(
                'The attribution of provider "%s" has unknown arguments: %s.',
                $slug,
                implode(', ', $unknown)
            );
        }

        $args = array_merge(self::DEFAULT_ATTRIBUTION_ARGS, $args);

        foreach ($args as $name => $value) {
            if (! is_string($value)) {
                return sprintf('The attribution of provider "%s" needs a string %s.', $slug, $name);
            }
        }

        if ('' === trim($args['text'])) {
            return sprintf('The attribution of provider "%s" needs a text.', $slug);
        }

        foreach (array( 'url', 'license_url' ) as $name) {
            if ('' !== $args[ $name ] && ! self::isHttpUrl($args[ $name ])) {
                return sprintf('The %s of the attribution of provider "%s" must be an http(s) URL.', $name, $slug);
            }
        }

        return new ProviderAttribution($args['text'], $args['url'], $args['license'], $args['license_url']);
    }

    /**
     * Checks whether a string is an absolute http or https URL.
     *
     * @param string $url URL to check.
     * @return bool
     */
    private static function isHttpUrl(string $url): bool
    {
        return 1 === preg_match('#^https?://#i', $url) && false !== filter_var($url, FILTER_VALIDATE_URL);
    }

    /**
     * Locks the registry. No further registrations are allowed after this.
     */
    public function build(): void
    {
        $this->built = true;
    }

    /**
     * Checks whether the registry has been locked.
     *
     * @return bool
     */
    public function isBuilt(): bool
    {
        return $this->built;
    }

    /**
     * Returns all registered providers, in registration order.
     *
     * @return list<Provider>
     */
    public function getAll(): array
    {
        return array_values($this->providers);
    }

    /**
     * Returns the provider with the given slug, or null if not found.
     *
     * @param string $slug Provider slug.
     * @return Provider|null
     */
    public function getBySlug(string $slug): ?Provider
    {
        return $this->providers[ $slug ] ?? null;
    }

    /**
     * Refuses a registration with a _doing_it_wrong() notice.
     *
     * @param string $message Why the registration is refused.
     * @return false
     */
    private function refuse(string $message): bool
    {
        _doing_it_wrong(self::class . '::register', esc_html($message), '0.1.0');

        return false;
    }
}
