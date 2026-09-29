<?php

namespace ElioBlocks\Weather\Condition\Icons;

use ElioBlocks\Weather\Condition\WmoConditionCodes;

// Exit if called directly.
if (! defined('ABSPATH')) {
    die;
}

/**
 * Registry of condition icon collections and their icons.
 *
 * Shaped like the Icons API of WordPress 7.1 (WP_Icon_Collections_Registry,
 * WP_Icons_Registry): a collection is registered by slug, then its icons by
 * qualified name ("collection/icon"); an invalid registration is refused with
 * a _doing_it_wrong() notice and false, never an exception. The plugin keeps
 * its own registry for WordPress 6.7, and for what the core one has no place
 * for: the conditions an icon represents (WMO condition and time of day), its
 * style (fill or stroke), a sanitizer that keeps stroked drawings, and a lock
 * once init is over.
 *
 * Icons are printed as they are (server-rendered HTML, REST API, innerHTML in
 * the browser) and collections are an extension point: whatever leaves the
 * registry is sanitized here, the one place every consumer goes through,
 * the first time an icon is served (collections are registered on every
 * request, a page shows a handful of icons).
 */
final class ConditionIconsRegistry
{
    /**
     * Collection the plugin ships and falls back to.
     */
    public const DEFAULT_COLLECTION = 'elio';

    /**
     * Slug of a collection, unqualified name of an icon: the pattern of the core Icons API.
     */
    private const SLUG_PATTERN = '/^[a-z0-9]([a-z0-9_-]*[a-z0-9])?$/';

    private const TIMES_OF_DAY = array( 'day', 'night', 'all' );

    private const STYLES = array( 'fill', 'stroke' );

    private const COLLECTION_KEYS = array( 'label', 'description', 'stroke_width' );

    /**
     * Stroke width of a collection that declares none: the one Tabler, Lucide and Feather draw with.
     */
    public const DEFAULT_STROKE_WIDTH = 2.0;

    private const ICON_KEYS = array( 'label', 'content', 'file_path', 'style', 'conditions' );

    /**
     * SVG elements an icon is made of. Nothing that runs scripts, loads a resource
     * or embeds HTML (script, style, a, image, use, foreignObject…).
     */
    private const SVG_ELEMENTS = array(
        'svg', 'g', 'defs', 'title', 'desc', 'path', 'circle', 'ellipse', 'line', 'polyline',
        'polygon', 'rect', 'lineargradient', 'radialgradient', 'stop', 'clippath', 'mask',
    );

    /**
     * Attributes allowed on those elements: geometry and paint. No event handler, no href, no style.
     */
    private const SVG_ATTRIBUTES = array(
        'xmlns', 'viewbox', 'width', 'height', 'preserveaspectratio', 'id', 'class', 'role', 'aria-hidden',
        'aria-label', 'focusable', 'd', 'x', 'y', 'x1', 'y1', 'x2', 'y2', 'cx', 'cy', 'r', 'rx', 'ry', 'fx', 'fy',
        'points', 'transform', 'opacity', 'fill', 'fill-opacity', 'fill-rule', 'stroke', 'stroke-width',
        'stroke-linecap', 'stroke-linejoin', 'stroke-miterlimit', 'stroke-dasharray', 'stroke-dashoffset',
        'stroke-opacity', 'clip-path', 'clip-rule', 'mask', 'offset', 'stop-color', 'stop-opacity',
        'gradientunits', 'gradienttransform', 'spreadmethod', 'clippathunits', 'maskunits', 'vector-effect',
    );

    /**
     * @var array<string, array{slug: string, label: string, description: string, stroke_width: float}>
     */
    private array $collections = array();

    /**
     * Registered icons by qualified name. `content` is null until a file_path icon is served.
     *
     * @var array<string, array{name: string, collection: string, label: string, content: string|null, file_path: string|null, style: string, conditions: list<array{0: string, 1: string}>}>
     */
    private array $icons = array();

    /**
     * Name of the icon representing a condition: collection → condition → time of day.
     *
     * @var array<string, array<string, array<string, string>>>
     */
    private array $conditionIndex = array();

    /**
     * Icons whose content has been read and sanitized.
     *
     * @var array<string, true>
     */
    private array $sanitized = array();

    private bool $built = false;

    /**
     * Registers a collection, a namespace for icons.
     *
     * @param string               $slug Collection slug.
     * @param array<string, mixed> $args {
     *     @type string $label       Required. Human-readable label.
     *     @type string $description Optional. Human-readable description.
     *     @type float  $stroke_width Optional. Stroke width the stroke icons are drawn with, what the condition icon block
     *                                 applies unless set on the block. Default 2.
     * }
     * @return bool True if the collection was registered, false otherwise.
     */
    public function registerCollection(string $slug, array $args): bool
    {
        if ($this->built) {
            return $this->refuse(__METHOD__, sprintf('Cannot register icon collection "%s": the icon registry is already built.', $slug));
        }

        if (! preg_match(self::SLUG_PATTERN, $slug)) {
            return $this->refuse(__METHOD__, sprintf(
                'Icon collection slug "%s" must start and end with a lowercase letter or digit and contain only lowercase letters, digits, hyphens, and underscores.',
                $slug
            ));
        }

        if (isset($this->collections[ $slug ])) {
            return $this->refuse(__METHOD__, sprintf('Icon collection "%s" is already registered.', $slug));
        }

        foreach (array_keys($args) as $key) {
            if (! in_array($key, self::COLLECTION_KEYS, true)) {
                return $this->refuse(__METHOD__, sprintf('Invalid icon collection property: "%s".', (string) $key));
            }
        }

        if (! isset($args['label']) || ! is_string($args['label'])) {
            return $this->refuse(__METHOD__, sprintf('Icon collection "%s" needs a label.', $slug));
        }

        if (isset($args['description']) && ! is_string($args['description'])) {
            return $this->refuse(__METHOD__, sprintf('Icon collection "%s" description must be a string.', $slug));
        }

        if (isset($args['stroke_width']) && ( ! is_numeric($args['stroke_width']) || (float) $args['stroke_width'] <= 0 )) {
            return $this->refuse(__METHOD__, sprintf('Icon collection "%s" stroke width must be a positive number.', $slug));
        }

        $this->collections[ $slug ] = array(
            'slug'        => $slug,
            'label'       => $args['label'],
            'description' => $args['description'] ?? '',
            'stroke_width' => isset($args['stroke_width']) ? (float) $args['stroke_width'] : self::DEFAULT_STROKE_WIDTH,
        );

        return true;
    }

    /**
     * Unregisters a collection and every icon in it.
     *
     * @param string $slug Collection slug.
     * @return bool True if the collection was unregistered, false otherwise.
     */
    public function unregisterCollection(string $slug): bool
    {
        if ($this->built) {
            return $this->refuse(__METHOD__, sprintf('Cannot unregister icon collection "%s": the icon registry is already built.', $slug));
        }

        if (! isset($this->collections[ $slug ])) {
            return $this->refuse(__METHOD__, sprintf('Icon collection "%s" is not registered.', $slug));
        }

        foreach ($this->icons as $name => $icon) {
            if ($icon['collection'] === $slug) {
                unset($this->icons[ $name ], $this->sanitized[ $name ]);
            }
        }

        unset($this->conditionIndex[ $slug ], $this->collections[ $slug ]);

        return true;
    }

    public function isCollectionRegistered(string $slug): bool
    {
        return isset($this->collections[ $slug ]);
    }

    /**
     * Retrieves a registered collection.
     *
     * @return array{slug: string, label: string, description: string, stroke_width: float}|null
     */
    public function getRegisteredCollection(string $slug): ?array
    {
        return $this->collections[ $slug ] ?? null;
    }

    /**
     * Retrieves every registered collection.
     *
     * @return list<array{slug: string, label: string, description: string, stroke_width: float}>
     */
    public function getAllRegisteredCollections(): array
    {
        return array_values($this->collections);
    }

    /**
     * Registers an icon in a registered collection.
     *
     * @param string               $name Qualified name, "collection/icon-name".
     * @param array<string, mixed> $args {
     *     @type string $content    SVG markup. Required unless file_path is given.
     *     @type string $file_path  Absolute path of an .svg file, read when the icon is first served.
     *     @type string $label      Optional. Human-readable label.
     *     @type string $style      Optional. 'fill' (default) or 'stroke'.
     *     @type array  $conditions Optional. Conditions the icon represents: [WMO condition slug, 'day'|'night'|'all'] pairs.
     * }
     * @return bool True if the icon was registered, false otherwise.
     */
    public function registerIcon(string $name, array $args): bool
    {
        if ($this->built) {
            return $this->refuse(__METHOD__, sprintf('Cannot register icon "%s": the icon registry is already built.', $name));
        }

        $parts = explode('/', $name, 2);

        if (2 !== count($parts) || ! preg_match(self::SLUG_PATTERN, $parts[0]) || ! preg_match(self::SLUG_PATTERN, $parts[1])) {
            return $this->refuse(__METHOD__, sprintf(
                'Icon name "%s" must be "collection/icon-name", each part starting and ending with a lowercase letter or digit and made of lowercase letters, digits, hyphens, and underscores.',
                $name
            ));
        }

        $collection = $parts[0];

        if (! isset($this->collections[ $collection ])) {
            return $this->refuse(__METHOD__, sprintf('Icon collection "%s" is not registered.', $collection));
        }

        if (isset($this->icons[ $name ])) {
            return $this->refuse(__METHOD__, sprintf('Icon "%s" is already registered.', $name));
        }

        foreach (array_keys($args) as $key) {
            if (! in_array($key, self::ICON_KEYS, true)) {
                return $this->refuse(__METHOD__, sprintf('Invalid icon property: "%s".', (string) $key));
            }
        }

        $hasContent = isset($args['content']);
        $hasFile    = isset($args['file_path']);

        if ($hasContent === $hasFile) {
            return $this->refuse(__METHOD__, sprintf('Icon "%s" must provide either "content" or "file_path".', $name));
        }

        if (( $hasContent && ! is_string($args['content']) ) || ( $hasFile && ! is_string($args['file_path']) )) {
            return $this->refuse(__METHOD__, sprintf('Icon "%s" content and file_path must be strings.', $name));
        }

        if (isset($args['label']) && ! is_string($args['label'])) {
            return $this->refuse(__METHOD__, sprintf('Icon "%s" label must be a string.', $name));
        }

        $style = $args['style'] ?? 'fill';

        if (! in_array($style, self::STYLES, true)) {
            return $this->refuse(__METHOD__, sprintf('Icon "%s" has an invalid style "%s". Expected: fill, stroke.', $name, (string) $style));
        }

        $conditions = $args['conditions'] ?? array();

        if (! is_array($conditions)) {
            return $this->refuse(__METHOD__, sprintf('Icon "%s" conditions must be a list of [condition, time_of_day] pairs.', $name));
        }

        $validConditions = WmoConditionCodes::getSlugs();
        $claimed         = array();
        $pairs           = array();

        foreach ($conditions as $index => $pair) {
            if (! is_array($pair) || ! isset($pair[0], $pair[1]) || ! is_string($pair[0]) || ! is_string($pair[1])) {
                return $this->refuse(__METHOD__, sprintf('Condition #%d of icon "%s" must be a [condition, time_of_day] pair.', (int) $index, $name));
            }

            [$condition, $timeOfDay] = $pair;

            if (! in_array($condition, $validConditions, true)) {
                return $this->refuse(__METHOD__, sprintf('Condition #%d of icon "%s" has an invalid condition "%s".', (int) $index, $name, $condition));
            }

            if (! in_array($timeOfDay, self::TIMES_OF_DAY, true)) {
                return $this->refuse(__METHOD__, sprintf(
                    'Condition #%d of icon "%s" has an invalid time of day "%s". Expected: day, night, all.',
                    (int) $index,
                    $name,
                    $timeOfDay
                ));
            }

            $owner = $this->conditionIndex[ $collection ][ $condition ][ $timeOfDay ] ?? $claimed[ $condition . '/' . $timeOfDay ] ?? null;

            if (null !== $owner) {
                return $this->refuse(__METHOD__, sprintf(
                    'Condition %s/%s of icon "%s" is already represented by icon "%s" in collection "%s".',
                    $condition,
                    $timeOfDay,
                    $name,
                    $owner,
                    $collection
                ));
            }

            $claimed[ $condition . '/' . $timeOfDay ] = $name;
            $pairs[]                                  = array( $condition, $timeOfDay );
        }

        $this->icons[ $name ] = array(
            'name'       => $name,
            'collection' => $collection,
            'label'      => $args['label'] ?? '',
            'content'    => $args['content'] ?? null,
            'file_path'  => $args['file_path'] ?? null,
            'style'      => $style,
            'conditions' => $pairs,
        );

        foreach ($pairs as [$condition, $timeOfDay]) {
            $this->conditionIndex[ $collection ][ $condition ][ $timeOfDay ] = $name;
        }

        return true;
    }

    /**
     * Unregisters an icon.
     *
     * @param string $name Qualified icon name.
     * @return bool True if the icon was unregistered, false otherwise.
     */
    public function unregisterIcon(string $name): bool
    {
        if ($this->built) {
            return $this->refuse(__METHOD__, sprintf('Cannot unregister icon "%s": the icon registry is already built.', $name));
        }

        if (! isset($this->icons[ $name ])) {
            return $this->refuse(__METHOD__, sprintf('Icon "%s" is not registered.', $name));
        }

        $icon = $this->icons[ $name ];

        foreach ($icon['conditions'] as [$condition, $timeOfDay]) {
            unset($this->conditionIndex[ $icon['collection'] ][ $condition ][ $timeOfDay ]);
        }

        unset($this->icons[ $name ], $this->sanitized[ $name ]);

        return true;
    }

    public function isIconRegistered(string $name): bool
    {
        return isset($this->icons[ $name ]);
    }

    /**
     * Retrieves an icon, its content sanitized (and read from its file) the first time.
     *
     * @param string $name Qualified icon name.
     * @return array{name: string, collection: string, label: string, content: string, style: string, conditions: list<array{0: string, 1: string}>}|null
     *   Null when the icon is not registered, or when its content is no SVG.
     */
    public function getRegisteredIcon(string $name): ?array
    {
        if (! isset($this->icons[ $name ])) {
            return null;
        }

        if (! isset($this->sanitized[ $name ])) {
            $content = $this->icons[ $name ]['content'] ?? $this->readFile($name, (string) $this->icons[ $name ]['file_path']);

            $this->icons[ $name ]['content'] = null !== $content ? self::sanitizeSvg($content) : '';
            $this->sanitized[ $name ]        = true;
        }

        $icon    = $this->icons[ $name ];
        $content = $icon['content'];

        if (null === $content || '' === $content) {
            return null;
        }

        return array(
            'name'       => $icon['name'],
            'collection' => $icon['collection'],
            'label'      => $icon['label'],
            'content'    => $content,
            'style'      => $icon['style'],
            'conditions' => $icon['conditions'],
        );
    }

    /**
     * Retrieves the icon of a collection representing a condition at a time of day.
     *
     * A day/night-specific mapping wins over an 'all' one.
     *
     * @param string $collection Collection slug.
     * @param string $condition  WMO condition slug (e.g. 'clear-sky').
     * @param string $timeOfDay  'day' or 'night'.
     * @return array{name: string, collection: string, label: string, content: string, style: string, conditions: list<array{0: string, 1: string}>}|null
     */
    public function getIconForCondition(string $collection, string $condition, string $timeOfDay): ?array
    {
        $name = $this->conditionIndex[ $collection ][ $condition ][ $timeOfDay ]
            ?? $this->conditionIndex[ $collection ][ $condition ]['all']
            ?? null;

        return null !== $name ? $this->getRegisteredIcon($name) : null;
    }

    /**
     * Locks the registry. No further registrations are allowed after this.
     */
    public function build(): void
    {
        $this->built = true;
    }

    public function isBuilt(): bool
    {
        return $this->built;
    }

    /**
     * Refuses a registration the way core registries do.
     */
    private function refuse(string $method, string $message): bool
    {
        _doing_it_wrong(esc_html($method), esc_html($message), '0.1.0');

        return false;
    }

    /**
     * Reads the content of a file_path icon; null, with a warning, when the file cannot be read.
     */
    private function readFile(string $name, string $path): ?string
    {
        $content = str_ends_with($path, '.svg') && is_readable($path)
            ? file_get_contents($path) // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
            : false;

        if (false === $content) {
            wp_trigger_error(__METHOD__, esc_html(sprintf('Icon "%s": file "%s" is missing or unreadable.', $name, $path)));

            return null;
        }

        return $content;
    }

    /**
     * SVG attributes with a canonical camelCase spelling, keyed by the lowercase name
     * wp_kses() serializes them as (its HTML tokenizer lowercases attribute names, the
     * way an HTML parser does for foreign content; a browser then restores them when it
     * parses the markup as SVG, but a raw string comparison — or an SVG built outside an
     * HTML parser, e.g. via the DOM API — would otherwise see the wrong attribute name).
     */
    private const SVG_CAMEL_CASE_ATTRIBUTES = array(
        'viewbox'              => 'viewBox',
        'preserveaspectratio'  => 'preserveAspectRatio',
        'gradientunits'        => 'gradientUnits',
        'gradienttransform'    => 'gradientTransform',
        'spreadmethod'         => 'spreadMethod',
        'clippathunits'        => 'clipPathUnits',
        'maskunits'            => 'maskUnits',
    );

    /**
     * Keeps what an icon is made of, drops everything else.
     *
     * Empty when the content is not an SVG: wp_kses() removes tags it does not know,
     * not their text, so non-SVG markup would otherwise be served as bare text.
     *
     * @param string $svg SVG markup from a collection.
     */
    private static function sanitizeSvg(string $svg): string
    {
        // wp_kses() removes tags, not their text: take scripts and styles out whole.
        $svg = (string) preg_replace('#<(script|style)\b[^>]*>.*?</\1\s*>#is', '', $svg);

        $svg = trim(
            wp_kses($svg, array_fill_keys(self::SVG_ELEMENTS, array_fill_keys(self::SVG_ATTRIBUTES, true)))
        );

        if (! preg_match('/^<svg[\s>]/i', $svg)) {
            return '';
        }

        foreach (self::SVG_CAMEL_CASE_ATTRIBUTES as $lower => $camelCase) {
            $svg = (string) preg_replace('/\b' . $lower . '(?=\s*=)/i', $camelCase, $svg);
        }

        return $svg;
    }
}
