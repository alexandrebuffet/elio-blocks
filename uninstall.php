<?php
/**
 * Runs when the plugin is deleted from the Plugins screen.
 *
 * @package ElioBlocks
 */

use ElioBlocks\Plugin\Uninstaller;
use ElioBlocks\Settings\PluginSettings;
use ElioBlocks\WordPress\Cache\TransientCache;

if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	die;
}

if ( ! file_exists( __DIR__ . '/vendor/autoload.php' ) ) {
	return;
}

require_once __DIR__ . '/vendor/autoload.php';

$elio_blocks_cleanup = static function (): void {
	$settings = new PluginSettings();

	( new Uninstaller( $settings, new TransientCache( TransientCache::PREFIX, $settings ) ) )->cleanup();
};

if ( is_multisite() ) {
	foreach ( get_sites( array( 'fields' => 'ids', 'number' => 0 ) ) as $elio_blocks_site_id ) {
		switch_to_blog( (int) $elio_blocks_site_id );
		$elio_blocks_cleanup();
		restore_current_blog();
	}
} else {
	$elio_blocks_cleanup();
}
