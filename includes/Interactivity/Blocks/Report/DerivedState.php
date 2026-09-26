<?php

namespace ElioBlocks\Interactivity\Blocks\Report;

// Exit if called directly.
if (! defined('ABSPATH')) {
    die;
}

/**
 * Server-side twin of the derived state the blocks' view.js files define.
 *
 * `data-wp-text="state.humidity"` only prints a value in the server-rendered
 * HTML when `state.humidity` exists in PHP. Without it the page ships empty
 * tags that fill in after hydration: no content for crawlers, a layout shift
 * for visitors. Each getter here mirrors the one of the same name in
 * src/blocks/<block>/view.js; DerivedStateTest fails when one is missing.
 *
 * Getters read the Interactivity context of the element being processed, so
 * the same getter prints the current conditions in one place and a forecast
 * row in another.
 */
final class DerivedState
{
    public const STORE = 'elio/weather-report';

    private const NBSP = "\u{00A0}";

    private const CARDINALS = array( 'N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW' );

    /**
     * Item field read by each display type of the daily/hourly temperature blocks.
     */
    private const DAILY_TEMPERATURE_FIELDS = array(
        'min'            => 'temperature_min',
        'max'            => 'temperature_max',
        'feels-like-min' => 'temperature_feels_like_min',
        'feels-like-max' => 'temperature_feels_like_max',
    );

    private const HOURLY_TEMPERATURE_FIELDS = array(
        'temperature' => 'temperature',
        'feels-like'  => 'temperature_feels_like',
    );

    /**
     * @var \Closure(): int
     */
    private \Closure $clock;

    /**
     * Constructor.
     *
     * @param (callable(): int)|null $clock Returns the current Unix timestamp. Defaults to time().
     */
    public function __construct(?callable $clock = null)
    {
        $this->clock = null !== $clock ? $clock(...) : time(...);
    }

    /**
     * Returns the derived state getters, to merge into wp_interactivity_state().
     *
     * Text getters return strings; attribute getters may return null (no
     * attribute) or a boolean (class toggles), like data-wp-bind and
     * data-wp-class expect.
     *
     * @return array<string, \Closure(): (string|bool|null)>
     */
    public function getters(): array
    {
        $percent = fn(string $field): \Closure => fn(): string => null !== $this->item($field) ? '%' : '';
        $value   = fn(string $field): \Closure => fn(): string => $this->text($this->item($field));

        return array(
            // temperature (current conditions of the report).
            'temperature'                  => fn(): string => $this->text($this->currentTemperature()),
            'unit'                         => fn(): string => $this->temperatureUnit($this->currentTemperature()),
            'formattedTemperature'         => fn(): string => $this->text($this->currentTemperature())
                . $this->temperatureUnit($this->currentTemperature()),

            // daily-temperature / hourly-temperature.
            'dailyTemperature'             => fn(): string => $this->text($this->dailyTemperature()),
            'dailyTemperatureUnit'         => fn(): string => $this->temperatureUnit($this->dailyTemperature()),
            'hourlyTemperature'            => fn(): string => $this->text($this->hourlyTemperature()),
            'hourlyTemperatureUnit'        => fn(): string => $this->temperatureUnit($this->hourlyTemperature()),

            // Plain item values.
            'humidity'                     => $value('humidity'),
            'humidityUnit'                 => $percent('humidity'),
            'cloudCover'                   => $value('cloud_cover'),
            'cloudCoverUnit'               => $percent('cloud_cover'),
            'precipitationProbability'     => $value('precipitation_probability'),
            'precipitationProbabilityUnit' => $percent('precipitation_probability'),
            'conditionDescription'         => $value('condition_description'),
            'uvIndex'                      => fn(): string => $this->text($this->item('uv_index') ?? $this->item('uv_index_max')),

            // Values with a unit that follows the unit settings.
            'precipitation'                => $value('precipitation'),
            'precipitationUnit'            => fn(): string => $this->precipitationUnit(),
            'pressure'                     => $value('pressure'),
            'pressureUnit'                 => fn(): string => $this->pressureUnit(),
            'windSpeed'                    => fn(): string => $this->text($this->windSpeed()),
            'windSpeedUnit'                => fn(): string => $this->windSpeedUnit(),
            'windDirection'                => fn(): string => $this->windDirection(),

            // Dates.
            'datetime'                     => $value('timestamp'),
            'formattedDateTime'            => fn(): string => $this->formattedDateTime(),
            'sunEventDatetime'             => fn(): string => $this->text($this->sunEvent()),
            'formattedSunEvent'            => fn(): string => $this->formatDate(
                $this->toDate($this->sunEvent()),
                'time'
            ),

            // condition-icon: an <svg><use> pointing at the symbol of the icon (IconSprite), in a wrapper that names it.
            'hasConditionIcon'             => fn(): bool => null !== $this->iconName(),
            'isStrokeConditionIcon'        => fn(): bool => $this->isStrokeIcon(),
            'conditionIconHref'            => fn(): ?string => null !== $this->iconName()
                ? '#' . IconSprite::symbolId($this->iconName())
                : null,
            'conditionIconLabel'           => fn(): ?string => $this->iconLabel(),
            'conditionIconRole'            => fn(): ?string => null !== $this->iconLabel() ? 'img' : null,
        );
    }

    /**
     * Returns the qualified name of the icon of the item in context, in the
     * collection of the block (context.iconCollection).
     */
    private function iconName(): ?string
    {
        $collection = $this->context()['iconCollection'] ?? null;
        $names      = $this->item('condition_icons');
        $name       = is_string($collection) && is_array($names) ? ( $names[ $collection ] ?? null ) : null;

        return is_string($name) && '' !== $name ? $name : null;
    }

    /**
     * Determines whether the icon of the item in context is drawn with strokes.
     */
    private function isStrokeIcon(): bool
    {
        $name = $this->iconName();

        return null !== $name && 'stroke' === ( $this->context()['query']['data']['icons'][ $name ]['style'] ?? 'fill' );
    }

    /**
     * Returns the accessible name of the icon: the condition, unless the block
     * is decorative or shows no icon.
     */
    private function iconLabel(): ?string
    {
        $description = $this->text($this->item('condition_description'));

        return empty($this->context()['isDecorative']) && null !== $this->iconName() && '' !== $description
            ? $description
            : null;
    }

    /**
     * Returns the Interactivity context of the element being processed.
     *
     * @return array<string, mixed>
     */
    private function context(): array
    {
        return wp_interactivity_get_context(self::STORE);
    }

    /**
     * Returns a field of the weather item in context: the current conditions, or a forecast row.
     */
    private function item(string $field): mixed
    {
        $item = $this->context()['item'] ?? null;

        return is_array($item) ? ( $item[ $field ] ?? null ) : null;
    }

    /**
     * Prints a value like the browser does with String(): 12.0 reads "12".
     */
    private function text(mixed $value): string
    {
        return is_scalar($value) ? (string) $value : '';
    }

    private function currentTemperature(): mixed
    {
        $context = $this->context();
        $current = $context['query']['data']['current'] ?? null;
        $field   = 'feels-like' === ( $context['displayType'] ?? '' ) ? 'temperature_feels_like' : 'temperature';

        return is_array($current) ? ( $current[ $field ] ?? null ) : null;
    }

    private function dailyTemperature(): mixed
    {
        $displayType = $this->context()['displayType'] ?? 'min';

        return $this->item(self::DAILY_TEMPERATURE_FIELDS[ $displayType ] ?? 'temperature_min');
    }

    private function hourlyTemperature(): mixed
    {
        $displayType = $this->context()['displayType'] ?? 'temperature';

        return $this->item(self::HOURLY_TEMPERATURE_FIELDS[ $displayType ] ?? 'temperature');
    }

    /**
     * Returns the unit the values of a domain were converted to: the per-domain override, else the
     * preset of the unit system.
     */
    private function targetUnit(string $domain, string $metric, string $imperial): string
    {
        $context  = $this->context();
        $override = $context['unitSettings'][ $domain ] ?? '';

        if (is_string($override) && '' !== $override) {
            return $override;
        }

        return 'imperial' === ( $context['units'] ?? 'metric' ) ? $imperial : $metric;
    }

    private function temperatureUnit(mixed $temperature): string
    {
        $context = $this->context();

        if (null === $temperature || ! ( $context['showUnit'] ?? true )) {
            return '';
        }

        if ('degree-symbol' === ( $context['unitFormat'] ?? '' )) {
            return '°';
        }

        return 'fahrenheit' === $this->targetUnit('temperature', 'celsius', 'fahrenheit') ? '°F' : '°C';
    }

    private function precipitationUnit(): string
    {
        if (null === $this->item('precipitation')) {
            return '';
        }

        return self::NBSP . ( 'in' === $this->targetUnit('precipitation', 'mm', 'in') ? 'in' : 'mm' );
    }

    private function pressureUnit(): string
    {
        if (null === $this->item('pressure')) {
            return '';
        }

        // Both unit systems report hPa unless an override says otherwise.
        return self::NBSP . match ($this->targetUnit('pressure', 'hpa', 'hpa')) {
            'inhg'  => 'inHg',
            'mbar'  => 'mbar',
            default => 'hPa',
        };
    }

    private function windSpeed(): mixed
    {
        return $this->item('gusts' === ( $this->context()['displayType'] ?? '' ) ? 'wind_gusts' : 'wind_speed');
    }

    private function windSpeedUnit(): string
    {
        if (null === $this->windSpeed()) {
            return '';
        }

        return self::NBSP . match ($this->targetUnit('wind', 'kmh', 'mph')) {
            'mph'      => 'mph',
            'ms'       => 'm/s',
            'knots'    => 'kt',
            'beaufort' => 'Bft',
            default    => 'km/h',
        };
    }

    private function windDirection(): string
    {
        $degrees = $this->item('wind_direction');

        if (! is_numeric($degrees)) {
            return '';
        }

        if ('degrees' === ( $this->context()['format'] ?? '' )) {
            return $degrees . '°';
        }

        return self::CARDINALS[ (int) round($degrees / 45) % 8 ];
    }

    /**
     * Returns the sunrise or sunset of the item. Hourly items have none: they show the one of the day.
     */
    private function sunEvent(): mixed
    {
        $context = $this->context();
        $event   = 'sunset' === ( $context['displayType'] ?? 'sunrise' ) ? 'sunset' : 'sunrise';

        return $this->item($event) ?? $context['query']['data']['current'][ $event ] ?? null;
    }

    private function formattedDateTime(): string
    {
        $context     = $this->context();
        $date        = $this->toDate($this->item('timestamp'));
        $displayType = 'time' === ( $context['displayType'] ?? 'date' ) ? 'time' : 'date';

        if (null === $date) {
            return '';
        }

        if (! empty($context['currentAsLabel'])) {
            $timezone = $this->timezone();
            $now      = ( new \DateTimeImmutable('@' . ( $this->clock )()) )->setTimezone($timezone);
            $local    = $date->setTimezone($timezone);
            // "Now" is the row of the current hour, "Today" the row of the
            // current day, where the weather forecast is.
            $sameAs = 'time' === $displayType ? 'Y-m-d H' : 'Y-m-d';

            if ($local->format($sameAs) === $now->format($sameAs)) {
                return (string) ( $context[ 'time' === $displayType ? 'nowLabel' : 'todayLabel' ] ?? '' );
            }
        }

        return $this->formatDate($date, $displayType);
    }

    /**
     * Formats a date in the format of the block, in the timezone of the location.
     *
     * @param string $kind 'date' or 'time': picks the site format when the block sets none.
     */
    private function formatDate(?\DateTimeImmutable $date, string $kind): string
    {
        if (null === $date) {
            return '';
        }

        $format = $this->context()['format'] ?? '';

        if (! is_string($format) || '' === $format) {
            $format = (string) get_option('time' === $kind ? 'time_format' : 'date_format');
        }

        return (string) wp_date($format, $date->getTimestamp(), $this->timezone());
    }

    private function toDate(mixed $value): ?\DateTimeImmutable
    {
        if (! is_string($value) || '' === $value) {
            return null;
        }

        try {
            return new \DateTimeImmutable($value, $this->timezone());
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Returns the timezone of the weather forecast location: a time is read
     * where the weather happens. Falls back to the site timezone when the
     * provider gives none.
     */
    private function timezone(): \DateTimeZone
    {
        $name = $this->context()['query']['data']['meta']['timezone'] ?? '';

        if (is_string($name) && '' !== $name) {
            try {
                return new \DateTimeZone($name);
            } catch (\Exception $e) {
                // Unknown identifier: use the site timezone.
            }
        }

        return wp_timezone();
    }
}
