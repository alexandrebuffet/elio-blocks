<?php

declare(strict_types=1);

namespace ElioBlocks\Provider;

if (! defined('ABSPATH')) {
    die;
}

/**
 * A value a provider needs to identify the site: an API key, an account name
 * and its password, a contact address. The settings page asks for it, in the
 * card of its provider, and the provider gets it when it fetches data.
 */
final class ProviderCredential
{
    /**
     * Constructor.
     *
     * @param string $name        Identifier, unique within its provider: lowercase letters, digits and
     *                            underscores. It names the constant ELIO_BLOCKS_{SLUG}_{NAME}.
     * @param string $label       Name shown to people.
     * @param string $description What it is for, shown under the field (plain text). Empty for none.
     * @param bool   $required    Whether the provider cannot answer without it.
     * @param bool   $secret      Whether it is typed hidden and never sent back to the browser.
     */
    public function __construct(
        public readonly string $name,
        public readonly string $label,
        public readonly string $description = '',
        public readonly bool $required = false,
        public readonly bool $secret = false,
    ) {
    }
}
