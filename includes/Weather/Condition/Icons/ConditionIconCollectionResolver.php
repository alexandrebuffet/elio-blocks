<?php

namespace ElioBlocks\Weather\Condition\Icons;

use ElioBlocks\Settings\PluginSettings;

// Exit if called directly.
if (! defined('ABSPATH')) {
    die;
}

/**
 * Which icon collection a block shows.
 *
 * A condition-icon block may pick a collection, its report block may, the site
 * has one; the plugin one is the last resort. A collection that is not
 * registered (its plugin deactivated) counts as not chosen: the attribute
 * stays in the post, reactivating the plugin brings the icons back.
 */
final class ConditionIconCollectionResolver
{
    public function __construct(
        private ConditionIconsRegistry $registry,
        private PluginSettings $settings,
    ) {
    }

    /**
     * Resolves the first registered collection among the candidates (the
     * block's, its report's…), else the site one, else the plugin one.
     *
     * @param string|null ...$candidates Collection slugs, most specific first; null or '' for none.
     */
    public function resolve(?string ...$candidates): string
    {
        $candidates[] = $this->settings->getConditionIconCollection();

        foreach ($candidates as $slug) {
            if (is_string($slug) && '' !== $slug && $this->registry->isCollectionRegistered($slug)) {
                return $slug;
            }
        }

        return ConditionIconsRegistry::DEFAULT_COLLECTION;
    }

    /**
     * Returns the collections a report block and the condition-icon blocks
     * inside it show, the report's first, without duplicates.
     *
     * @param array<string, mixed> $parsedReport Parsed report block (blockName, attrs, innerBlocks).
     * @return list<string>
     */
    public function usedBy(array $parsedReport): array
    {
        $report = $this->resolve($this->attribute($parsedReport, 'iconCollection'));
        $used   = array( $report => true );

        $this->collect($parsedReport['innerBlocks'] ?? null, $report, $used);

        return array_keys($used);
    }

    /**
     * Returns the registered collections among the ones a request names, without
     * duplicates; the site collection when it names none, falling back to the
     * plugin default when the site one is not registered.
     *
     * @param mixed $slugs Value of the icon_collections request parameter.
     * @return list<string>
     */
    public function sanitizeRequested(mixed $slugs): array
    {
        $known = array();

        foreach (is_array($slugs) ? $slugs : array() as $slug) {
            if (is_string($slug) && $this->registry->isCollectionRegistered($slug)) {
                $known[ $slug ] = true;
            }
        }

        return empty($known) ? array( $this->resolve() ) : array_keys($known);
    }

    /**
     * Collects the collections the condition-icon blocks among the blocks show,
     * inner blocks included.
     *
     * @param mixed               $blocks Parsed inner blocks.
     * @param array<string, true> $used   Collections found so far, by slug.
     */
    private function collect(mixed $blocks, string $report, array &$used): void
    {
        if (! is_array($blocks)) {
            return;
        }

        foreach ($blocks as $block) {
            if (! is_array($block)) {
                continue;
            }

            if ('elio/condition-icon' === ( $block['blockName'] ?? '' )) {
                $used[ $this->resolve($this->attribute($block, 'iconCollection'), $report) ] = true;
            }

            $this->collect($block['innerBlocks'] ?? null, $report, $used);
        }
    }

    /**
     * Returns an attribute of a parsed block, null when it is not a string.
     *
     * @param array<string, mixed> $block Parsed block.
     */
    private function attribute(array $block, string $name): ?string
    {
        $value = $block['attrs'][ $name ] ?? null;

        return is_string($value) ? $value : null;
    }
}
