<?php

namespace ElioBlocks\Interactivity\Blocks\Report;

// Exit if called directly.
if (! defined('ABSPATH')) {
    die;
}

/**
 * Date settings of the site, for the view scripts that format dates.
 *
 * The names are the ones wp_date() prints on the server (WP_Locale), so dates
 * do not change once scripts run, with what wp_maybe_decline_date() needs to
 * decline month names. The browser resolves timezones itself: no wp-date
 * script, which ships moment and its timezone database.
 *
 * Same shape as the settings of the wp-date script, plus the declension (see
 * createDateApi() in src/shared/date-format.js).
 */
final class DateSettings
{
    /**
     * Returns the date settings of the site.
     *
     * @return array{
     *   l10n: array{locale?: string, months?: list<string>, monthsGenitive?: list<string>, declineMonths?: bool, monthsShort?: list<string>, weekdays?: list<string>, weekdaysShort?: list<string>, meridiem?: array<string, string>},
     *   formats: array{date: string, time: string},
     *   timezone: array{string: string, offset: float}
     * }
     */
    public static function fromSite(): array
    {
        global $wp_locale;

        $l10n = array();

        if (is_object($wp_locale)) {
            $l10n = array(
                // wp_maybe_decline_date() reads the site locale, not the one of the user.
                'locale'         => get_locale(),
                'months'         => array_values((array) $wp_locale->month),
                'monthsGenitive' => array_values((array) $wp_locale->month_genitive),
                // The setting wp_maybe_decline_date() reads: the translation of 'off' in the core
                // translations, read as a value, not a text of the plugin to translate.
                'declineMonths'  => 'on' === get_translations_for_domain('default')->translate('off', 'decline months names: on or off'),
                'monthsShort'    => array_values((array) $wp_locale->month_abbrev),
                'weekdays'       => array_values((array) $wp_locale->weekday),
                'weekdaysShort'  => array_values((array) $wp_locale->weekday_abbrev),
                'meridiem'       => (array) $wp_locale->meridiem,
            );
        }

        return array(
            'l10n'     => $l10n,
            'formats'  => array(
                'date' => (string) get_option('date_format', 'F j, Y'),
                'time' => (string) get_option('time_format', 'g:i a'),
            ),
            'timezone' => array(
                'string' => (string) get_option('timezone_string', ''),
                'offset' => (float) get_option('gmt_offset', 0),
            ),
        );
    }
}
