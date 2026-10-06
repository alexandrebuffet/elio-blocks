<?php

namespace ElioBlocks\Tests\Unit\Interactivity;

use Brain\Monkey;
use Brain\Monkey\Functions;
use ElioBlocks\Interactivity\Blocks\Report\DateSettings;
use PHPUnit\Framework\TestCase;

class DateSettingsTest extends TestCase
{
    /** @var array<string, mixed> */
    private array $options;

    protected function setUp(): void
    {
        parent::setUp();
        Monkey\setUp();

        $this->options = [
            'date_format'     => 'j F Y',
            'time_format'     => 'G\hi',
            'timezone_string' => 'Europe/Paris',
            'gmt_offset'      => '2',
        ];
        Functions\when('get_option')->alias(fn(string $name, mixed $default = false): mixed => $this->options[$name] ?? $default);
        Functions\when('get_locale')->justReturn('fr_FR');
        // French does not decline month names: the core translation of this setting stays 'off'.
        $this->coreTranslationOfDeclineMonths('off');

        // What WP_Locale holds for a French site: wp_date() takes its names from there.
        $GLOBALS['wp_locale'] = (object) [
            'month'          => ['01' => 'janvier', '02' => 'février', '12' => 'décembre'],
            'month_genitive' => ['01' => 'janvier', '02' => 'février', '12' => 'décembre'],
            'month_abbrev'   => ['janvier' => 'Jan', 'février' => 'Fév', 'décembre' => 'Déc'],
            'weekday'        => [0 => 'dimanche', 1 => 'lundi', 6 => 'samedi'],
            'weekday_abbrev' => ['dimanche' => 'dim', 'lundi' => 'lun', 'samedi' => 'sam'],
            'meridiem'       => ['am' => 'mat.', 'pm' => 'ap.m.', 'AM' => 'MAT.', 'PM' => 'AP.M.'],
        ];
    }

    protected function tearDown(): void
    {
        unset($GLOBALS['wp_locale']);
        Monkey\tearDown();
        parent::tearDown();
    }

    public function test_names_days_months_and_meridiems_like_wp_date(): void
    {
        $l10n = DateSettings::fromSite()['l10n'];

        $this->assertSame(['janvier', 'février', 'décembre'], $l10n['months']);
        $this->assertSame(['Jan', 'Fév', 'Déc'], $l10n['monthsShort']);
        $this->assertSame(['dimanche', 'lundi', 'samedi'], $l10n['weekdays']);
        $this->assertSame(['dim', 'lun', 'sam'], $l10n['weekdaysShort']);
        $this->assertSame(['am' => 'mat.', 'pm' => 'ap.m.', 'AM' => 'MAT.', 'PM' => 'AP.M.'], $l10n['meridiem']);
    }

    public function test_tells_the_browser_how_the_language_declines_month_names(): void
    {
        // What WordPress holds for a Russian site: "5 января", not "5 Январь".
        Functions\when('get_locale')->justReturn('ru_RU');
        $this->coreTranslationOfDeclineMonths('on');
        $GLOBALS['wp_locale']->month          = ['01' => 'Январь', '02' => 'Февраль', '12' => 'Декабрь'];
        $GLOBALS['wp_locale']->month_genitive = ['01' => 'января', '02' => 'февраля', '12' => 'декабря'];

        $l10n = DateSettings::fromSite()['l10n'];

        $this->assertTrue($l10n['declineMonths']);
        $this->assertSame(['января', 'февраля', 'декабря'], $l10n['monthsGenitive']);
        $this->assertSame('ru_RU', $l10n['locale'], 'wp_maybe_decline_date() has rules for some locales (Catalan).');
    }

    public function test_months_are_not_declined_in_a_language_that_does_not(): void
    {
        $l10n = DateSettings::fromSite()['l10n'];

        $this->assertFalse($l10n['declineMonths']);
        $this->assertSame('fr_FR', $l10n['locale']);
    }

    public function test_carries_the_date_formats_and_the_timezone_of_the_site(): void
    {
        $settings = DateSettings::fromSite();

        $this->assertSame(['date' => 'j F Y', 'time' => 'G\hi'], $settings['formats']);
        $this->assertSame(['string' => 'Europe/Paris', 'offset' => 2.0], $settings['timezone']);
    }

    public function test_a_site_set_to_a_utc_offset_has_no_timezone_name(): void
    {
        $this->options['timezone_string'] = '';
        $this->options['gmt_offset']      = '5.5';

        $this->assertSame(['string' => '', 'offset' => 5.5], DateSettings::fromSite()['timezone']);
    }

    /**
     * Sets what the core translations say of the setting wp_maybe_decline_date() reads.
     */
    private function coreTranslationOfDeclineMonths(string $setting): void
    {
        $translations = new class ($setting) {
            public function __construct(private string $setting)
            {
            }

            public function translate(string $text, ?string $context = null): string
            {
                return 'off' === $text && 'decline months names: on or off' === $context ? $this->setting : $text;
            }
        };

        Functions\when('get_translations_for_domain')->alias(
            fn(string $domain): object => 'default' === $domain ? $translations : new class {
                public function translate(string $text): string
                {
                    return $text;
                }
            }
        );
    }

    public function test_english_names_without_a_locale(): void
    {
        unset($GLOBALS['wp_locale']);

        $this->assertSame([], DateSettings::fromSite()['l10n'], 'The browser falls back to English names.');
    }
}
