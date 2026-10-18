<?php

declare(strict_types=1);

namespace ElioBlocks\Provider;

// Exit if called directly.
if (! defined('ABSPATH')) {
    die;
}

/**
 * Registry of the providers, indexed by slug, and through them of what they
 * serve: each domain asks a provider for its adapter (Provider::getAdapter()).
 *
 * Locked after build(): third parties register on elio_blocks_init.
 */
final class ProviderRegistry
{
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
     * So is an attribution: http(s) URLs and a license name, printed escaped in
     * a sentence of the provider-attribution block.
     *
     * @param Provider $provider Slug (lowercase letters, digits and hyphens, naming the constants of its
     *                           credentials, ELIO_BLOCKS_{SLUG}_{NAME}), label, credentials (each named with
     *                           lowercase letters, digits and underscores, with a label), attribution (the
     *                           http(s) URL of its site, that of its license) and adapters.
     * @return bool True if the provider was registered, false otherwise.
     */
    public function register(Provider $provider): bool
    {
        $slug = $provider->slug;

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

        if ('' === trim($provider->label)) {
            return $this->refuse(sprintf('Provider "%s" needs a label.', $slug));
        }

        foreach ($provider->credentials as $name => $credential) {
            $refusal = $this->checkCredential($slug, $name, $credential);
            if (null !== $refusal) {
                return $this->refuse($refusal);
            }
        }

        if (null !== $provider->attribution) {
            $refusal = $this->checkAttribution($slug, $provider->attribution);
            if (null !== $refusal) {
                return $this->refuse($refusal);
            }
        }

        $this->providers[ $slug ] = $provider;

        return true;
    }

    /**
     * Tells why a declared credential is refused, or null when it is valid.
     *
     * @param string $slug       Slug of its provider.
     * @param string $name       Its name, as its provider holds it.
     * @param mixed  $credential The credential, as declared.
     * @return string|null
     */
    private function checkCredential(string $slug, string $name, mixed $credential): ?string
    {
        if (! $credential instanceof ProviderCredential) {
            return sprintf('Credential "%s" of provider "%s" must be a ProviderCredential.', $name, $slug);
        }

        if (1 !== preg_match('/^[a-z0-9]+(?:_[a-z0-9]+)*$/', $name)) {
            return sprintf(
                'Credential "%s" of provider "%s" must be named with lowercase letters, digits and underscores.',
                $name,
                $slug
            );
        }

        if ('' === trim($credential->label)) {
            return sprintf('Credential "%s" of provider "%s" needs a label.', $name, $slug);
        }

        return null;
    }

    /**
     * Tells why a declared attribution is refused, or null when it is valid.
     *
     * @param string              $slug        Slug of its provider.
     * @param ProviderAttribution $attribution The attribution, as declared.
     * @return string|null
     */
    private function checkAttribution(string $slug, ProviderAttribution $attribution): ?string
    {
        if ('' === $attribution->url) {
            return sprintf('The attribution of provider "%s" needs the url of its site.', $slug);
        }

        foreach (array( 'url' => $attribution->url, 'license_url' => $attribution->licenseUrl ) as $name => $url) {
            if ('' !== $url && ! self::isHttpUrl($url)) {
                return sprintf('The %s of the attribution of provider "%s" must be an http(s) URL.', $name, $slug);
            }
        }

        return null;
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
     * Returns the providers that serve a domain, in registration order.
     *
     * @param class-string $interface Interface of the adapters of the domain (WeatherForecastAdapterInterface).
     * @return list<Provider>
     */
    public function getServing(string $interface): array
    {
        return array_values(
            array_filter(
                $this->providers,
                static fn(Provider $provider): bool => null !== $provider->getAdapter($interface)
            )
        );
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
