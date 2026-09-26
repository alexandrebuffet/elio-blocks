<?php

declare(strict_types=1);

use Isolated\Symfony\Component\Finder\Finder;

/**
 * PHP-Scoper configuration for Elio Blocks.
 *
 * Scopes the Symfony DI container and its dependencies under the
 * ElioBlocks\Vendor\ namespace to avoid conflicts with other plugins.
 *
 * Run: composer scope-deps
 */
return [
	'prefix'     => 'ElioBlocks\\Vendor',
	'output-dir' => 'vendor-prefixed',
	'finders'    => [
		Finder::create()
			->files()
			->ignoreVCS(true)
			->notName('/LICENSE|.*\\.md|.*\\.dist|Makefile|composer\\.json|composer\\.lock/')
			->exclude(['doc', 'test', 'test_old', 'tests', 'Tests'])
			->in([
				'vendor/psr/container',
				'vendor/symfony/dependency-injection',
				'vendor/symfony/deprecation-contracts',
				'vendor/symfony/service-contracts',
				'vendor/symfony/var-exporter',
			]),
	],
	'patchers'   => [
		/**
		 * Removes the prefix from the Composer classes Symfony DI references, Composer\Autoload\ClassLoader
		 * and Composer\InstalledVersions. PHP-Scoper prefixes these, but they live in vendor/autoload.php
		 * (the main Composer autoloader) and must stay un-prefixed.
		 */
		static function ( string $filePath, string $prefix, string $content ): string {
			return str_replace(
				$prefix . '\\Composer\\',
				'Composer\\',
				$content
			);
		},

		/**
		 * Recomputes the offsets of a serialization hack in
		 * Symfony\Component\DependencyInjection\Compiler\ResolveInstanceofConditionalsPass, which casts
		 * Definition → ChildDefinition by manipulating the serialized PHP string with hardcoded byte offsets
		 * based on the original class name length:
		 *
		 *   "Symfony\Component\DependencyInjection\Definition"    = 48 chars → target length '53'
		 *   insert 'Child' at offset: O:53:" (6) + namespace (38) = 44
		 *
		 * The prefix makes both names longer, so the offsets are computed from it:
		 *
		 *   "ElioBlocks\Vendor\Symfony\Component\DependencyInjection\Definition" = 66 chars → target length '71'
		 *   insert 'Child' at offset: O:71:" (6) + namespace (56) = 62
		 */
		static function ( string $filePath, string $prefix, string $content ): string {
			if ( ! str_ends_with( $filePath, 'Compiler/ResolveInstanceofConditionalsPass.php' ) ) {
				return $content;
			}

			$namespace = $prefix . '\\Symfony\\Component\\DependencyInjection\\';

			return str_replace(
				[
					"substr_replace(\$definition, '53', 2, 2)",
					"substr_replace(\$definition, 'Child', 44, 0)",
				],
				[
					sprintf( "substr_replace(\$definition, '%d', 2, 2)", strlen( $namespace . 'ChildDefinition' ) ),
					sprintf( "substr_replace(\$definition, 'Child', %d, 0)", 6 + strlen( $namespace ) ),
				],
				$content
			);
		},
	],
];
