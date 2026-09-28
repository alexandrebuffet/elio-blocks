<?php

declare(strict_types=1);

namespace ElioBlocks\Provider;

if (! defined('ABSPATH')) {
    die;
}

/**
 * The credit a provider asks for wherever its data is shown, as its license
 * requires (Open-Meteo: "Weather data by Open-Meteo.com", CC BY 4.0). The
 * provider-attribution block prints it at the bottom of each report.
 */
final class ProviderAttribution
{
    /**
     * Constructor.
     *
     * @param string $text       Credit shown to people (plain text).
     * @param string $url        Page the credit links to. Empty for none.
     * @param string $license    Name of the license of the data (e.g. 'CC BY 4.0'). Empty for none.
     * @param string $licenseUrl Page of that license. Empty for none.
     */
    public function __construct(
        public readonly string $text,
        public readonly string $url = '',
        public readonly string $license = '',
        public readonly string $licenseUrl = '',
    ) {
    }
}
