<?php

require_once dirname(__DIR__) . '/vendor/autoload.php';

if (! defined('ABSPATH')) {
	define('ABSPATH', '/');
}

require_once __DIR__ . '/Stub/wordpress.php';

// Real wp_kses() and HTML API when WordPress core is around (tests needing them skip otherwise).
\ElioBlocks\Tests\Support\WordPressCore::load();
