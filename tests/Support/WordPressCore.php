<?php

namespace ElioBlocks\Tests\Support;

use Brain\Monkey\Functions;

/**
 * Loads self-contained parts of WordPress core into unit tests.
 *
 * Some behaviours are only worth testing against the real thing: what wp_kses()
 * strips from an SVG, what the HTML API prints. Both live in files that do not
 * need WordPress to be booted. They are looked up next to the plugin (Bedrock
 * layout) or where WP_CORE_DIR points; tests skip themselves when core is absent.
 */
final class WordPressCore
{
    private const HTML_API = ['attribute-token', 'span', 'text-replacement', 'decoder', 'tag-processor'];

    public static function includesDir(): ?string
    {
        // WP_CORE_DIR wins when set, even if wrong: `WP_CORE_DIR=none composer test` runs without core.
        $dir = false !== getenv('WP_CORE_DIR')
            ? rtrim((string) getenv('WP_CORE_DIR'), '/') . '/wp-includes/'
            : dirname(__DIR__, 5) . '/wp/wp-includes/';

        return is_readable($dir . 'kses.php') ? $dir : null;
    }

    /**
     * Loads WP_HTML_Tag_Processor, wp_kses() and friends when core is around.
     *
     * Called once from tests/bootstrap.php, before any test: for a whole run these
     * functions are either the real ones or absent. Loading them mid-run would
     * clash with a stub Brain Monkey created earlier ("cannot redeclare"), and
     * once real they cannot be stubbed (Patchwork: "defined too early").
     */
    public static function load(): void
    {
        $dir = self::includesDir();

        if (null === $dir || self::isLoaded()) {
            return;
        }

        foreach (self::HTML_API as $file) {
            require_once $dir . "html-api/class-wp-html-{$file}.php";
        }

        require_once $dir . 'kses.php';
    }

    /**
     * Checks whether the real functions are there. Not function_exists('wp_kses'): a function
     * Brain Monkey stubbed in one test still exists, unmocked, in the next ones.
     */
    public static function isLoaded(): bool
    {
        return class_exists('WP_HTML_Tag_Processor', false);
    }

    /** Stubs the WordPress functions the HTML API and kses call along the way, defined elsewhere in core. */
    public static function stubDependencies(): void
    {
        Functions\when('did_action')->justReturn(1);
        Functions\when('wp_allowed_protocols')->justReturn(['http', 'https']);
        Functions\when('wp_check_invalid_utf8')->returnArg();
        Functions\when('wp_has_noncharacters')->justReturn(false);
        // set_attribute() of a URL attribute (href, src…); the real one keeps "#fragment" as is.
        Functions\when('esc_url')->returnArg();
    }

    /**
     * Provides wp_kses() for tests that get icons out of the registry, which sanitizes them with it:
     * the real one when core is loaded, a pass-through otherwise.
     */
    public static function stubKses(): void
    {
        self::stubDependencies();

        if (! self::isLoaded()) {
            Functions\when('wp_kses')->returnArg();
        }
    }
}
