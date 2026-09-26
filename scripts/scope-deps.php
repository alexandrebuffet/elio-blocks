<?php

declare(strict_types=1);

/**
 * Generates vendor-prefixed/ from vendor/ using PHP-Scoper.
 *
 * Usage: composer scope-deps
 *
 * Steps:
 *   1. Deletes vendor-prefixed/ to start clean.
 *   2. Runs php-scoper add-prefix → scopes the 5 packages to vendor-prefixed/.
 *   3. Writes vendor-prefixed/composer.json with the prefixed autoload mappings.
 *      vendor-dir is set to "." so the autoloader lands at vendor-prefixed/autoload.php.
 *   4. Runs composer dump-autoload --working-dir=vendor-prefixed.
 */

$root      = dirname( __DIR__ );
$outputDir = $root . '/vendor-prefixed';
$scoper    = $root . '/vendor/bin/php-scoper';

// 1. Clean output directory.
if ( is_dir( $outputDir ) ) {
	shell_exec( 'rm -rf ' . escapeshellarg( $outputDir ) );
}

/*
 * Main Composer autoload loads vendor-prefixed/autoload.php; PHP-Scoper itself
 * bootstrap pulls vendor/autoload.php, so the file must exist before scoper runs.
 */
if ( ! is_dir( $outputDir ) ) {
	mkdir( $outputDir, 0775, true );
}
file_put_contents( $outputDir . '/autoload.php', "<?php\n" );

// 2. Run PHP-Scoper.
echo "Scoping vendor dependencies...\n";
passthru( escapeshellarg( $scoper ) . ' add-prefix --force --quiet', $code );
if ( 0 !== $code ) {
	fwrite( STDERR, "php-scoper failed (exit {$code})\n" );
	exit( $code );
}

// 3. Write composer.json for the scoped packages.
//    PSR-4 mappings are the original package namespaces prepended with ElioBlocks\Vendor\.
//    vendor-dir "." makes composer place autoload.php directly in vendor-prefixed/.
$composerJson = [
	'autoload' => [
		'psr-4' => [
			'ElioBlocks\\Vendor\\Psr\\Container\\'                              => 'psr/container/src/',
			'ElioBlocks\\Vendor\\Symfony\\Component\\DependencyInjection\\'     => 'symfony/dependency-injection/',
			'ElioBlocks\\Vendor\\Symfony\\Contracts\\Service\\'                 => 'symfony/service-contracts/',
			'ElioBlocks\\Vendor\\Symfony\\Component\\VarExporter\\'             => 'symfony/var-exporter/',
		],
		'files'  => [
			'symfony/deprecation-contracts/function.php',
		],
		'exclude-from-classmap' => [
			'/Tests/',
			'/Test/',
		],
	],
	'config'   => [
		'vendor-dir' => '.',
	],
];

file_put_contents(
	$outputDir . '/composer.json',
	json_encode( $composerJson, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES ) . PHP_EOL
);

// 4. Generate the autoloader.
echo "Generating autoloader...\n";
passthru(
	sprintf(
		'composer dump-autoload --working-dir=%s --classmap-authoritative --quiet --no-interaction',
		escapeshellarg( $outputDir )
	),
	$code
);

if ( 0 === $code ) {
	echo "vendor-prefixed/ updated successfully.\n";
}

exit( $code );
