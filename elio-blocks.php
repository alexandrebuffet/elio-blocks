<?php

/**
 * Elio Blocks.
 *
 * @package           ElioBlocks
 * @author            Alexandre Buffet
 * @copyright         2026 Alexandre Buffet
 * @license           GPL-2.0-or-later
 *
 * @wordpress-plugin
 * Plugin Name:       Elio Blocks
 * Version:           0.2.0
 * Plugin URI:        https://github.com/alexandrebuffet/elio-blocks
 * Description:       Easily display the current weather and forecasts for any location on your site, with blocks that feel native.
 * Author:            Alexandre Buffet
 * Author URI:        https://alexandrebuffet.fr
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Requires at least: 6.7
 * Requires PHP:      8.2
 * Text Domain:       elio-blocks
 */

namespace ElioBlocks;

use ElioBlocks\Plugin;

/**
 * Exit if called directly.
 */
if (! defined('ABSPATH')) {
    die;
}

/**
 * Plugin constants.
 */
define('ELIO_BLOCKS_VERSION', '0.2.0');
define('ELIO_BLOCKS_PLUGIN_FILE', __FILE__);
define('ELIO_BLOCKS_PLUGIN_PATH', plugin_dir_path(__FILE__));
define('ELIO_BLOCKS_PLUGIN_URL', plugin_dir_url(__FILE__));

/**
 * Minimum PHP version. The bundled dependency injection container needs PHP 8.2.
 */
define('ELIO_BLOCKS_MINIMUM_PHP_VERSION', '8.2');

/**
 * Bail out with an admin notice instead of a fatal error when the environment
 * cannot run the plugin (PHP downgraded after activation, missing build).
 */
if (
    version_compare(PHP_VERSION, ELIO_BLOCKS_MINIMUM_PHP_VERSION, '<')
    || ! file_exists(__DIR__ . '/vendor/autoload.php')
) {
    add_action(
        'admin_notices',
        static function (): void {
            if (! current_user_can('activate_plugins')) {
                return;
            }

            printf(
                '<div class="notice notice-error"><p>%s</p></div>',
                esc_html(
                    sprintf(
                        /* translators: %s: minimum PHP version. */
                        __('Elio Blocks is not running: it requires PHP %s or newer and its bundled dependencies (vendor directory).', 'elio-blocks'),
                        ELIO_BLOCKS_MINIMUM_PHP_VERSION
                    )
                )
            );
        }
    );

    return;
}

/**
 * Require the Composer autoloader.
 */
require_once __DIR__ . '/vendor/autoload.php';

/**
 * Load public API functions.
 */
require_once __DIR__ . '/functions.php';

/**
 * Bootstrap the plugin.
 */
Plugin::instance()->run();
