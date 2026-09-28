<?php

declare(strict_types=1);

namespace ElioBlocks\Provider;

if (! defined('ABSPATH')) {
    die;
}

/**
 * The credit a provider asks for wherever its data is shown, as its license
 * requires (Open-Meteo: a link to its site and to CC BY 4.0). The
 * provider-attribution block prints it at the bottom of each report: its own
 * sentence, the label of the provider linked to its site.
 */
final class ProviderAttribution
{
    /**
     * Constructor.
     *
     * @param string $url        Site of the provider, which its label links to.
     * @param string $license    Name of the license of its data (e.g. 'CC BY 4.0'). Empty for none.
     * @param string $licenseUrl Page of that license. Empty for none.
     */
    public function __construct(
        public readonly string $url,
        public readonly string $license = '',
        public readonly string $licenseUrl = '',
    ) {
    }
}
