---
version: alpha
name: Elio Blocks
description: >-
  Weather blocks for the WordPress Block Editor. The brand is a sunset sky
  shot on film: warm light, golden blacks, one touch of blue, flat color over
  the photo and film grain over everything, Instrument Serif for display and
  Geist for the rest. The blocks themselves have no look of their own: they
  take the theme's.
colors:
  primary: "#CC6400"
  primary-strong: "#B35000"
  paper: "#FDF9F2"
  paper-2: "#F6EFE3"
  ink: "#1A1611"
  ink-2: "#5E5446"
  line: "rgba(26, 22, 17, 0.14)"
  line-strong: "rgba(26, 22, 17, 0.4)"
  ember: "#E0602A"
  amber: "#F0A044"
  gold: "#F7D49A"
  cream: "#FFF1D6"
  rust: "#8F3515"
  sky: "#B7CDD6"
  sky-2: "#93A8C6"
  night: "#14110D"
  on-night: "#EEE7DB"
  on-night-2: "rgba(238, 231, 219, 0.7)"
  logo-gold: "#DDAB07"
  logo-red: "#DE2900"
  logo-flat: "#E0820C"
  paper-dark: "#14110D"
  paper-2-dark: "#1D1914"
  ink-dark: "#EEE7DB"
  ink-2-dark: "#A39C91"
  primary-dark: "#F0A044"
  primary-strong-dark: "#E0602A"
typography:
  display-xl:
    fontFamily: Instrument Serif
    fontSize: 9.5rem
    fontWeight: 400
    lineHeight: 0.95
    letterSpacing: -0.02em
  display-lg:
    fontFamily: Instrument Serif
    fontSize: 8rem
    fontWeight: 400
    lineHeight: 0.88
    letterSpacing: -0.02em
  display-md:
    fontFamily: Instrument Serif
    fontSize: 5rem
    fontWeight: 400
    lineHeight: 0.95
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Instrument Serif
    fontSize: 2.125rem
    fontWeight: 400
    lineHeight: 1.05
  headline-sm:
    fontFamily: Instrument Serif
    fontSize: 1.75rem
    fontWeight: 400
    lineHeight: 1.15
  body-lg:
    fontFamily: Geist
    fontSize: 1.25rem
    fontWeight: 400
    lineHeight: 1.5
  body-md:
    fontFamily: Geist
    fontSize: 1.0625rem
    fontWeight: 400
    lineHeight: 1.6
  body-sm:
    fontFamily: Geist
    fontSize: 0.9375rem
    fontWeight: 400
    lineHeight: 1.6
  caption:
    fontFamily: Geist
    fontSize: 0.8125rem
    fontWeight: 400
    lineHeight: 1.6
  label-md:
    fontFamily: Geist
    fontSize: 1.0625rem
    fontWeight: 500
    lineHeight: 1
  label-sm:
    fontFamily: Geist
    fontSize: 0.9375rem
    fontWeight: 500
    lineHeight: 1
  label-caps:
    fontFamily: Geist
    fontSize: 0.8125rem
    fontWeight: 500
    lineHeight: 1.6
    letterSpacing: 0.04em
  code:
    fontFamily: Geist Mono
    fontSize: 0.875em
    fontWeight: 450
    lineHeight: 1.6
  wordmark-elio:
    fontFamily: Geologica
    fontSize: 22.4px
    fontWeight: 700
    lineHeight: 1
    letterSpacing: -0.01em
    fontVariation: "'CRSV' 0, 'SHRP' 0"
  wordmark-blocks:
    fontFamily: Geologica
    fontSize: 22.4px
    fontWeight: 300
    lineHeight: 1
    letterSpacing: -0.01em
    fontVariation: "'CRSV' 0, 'SHRP' 0"
rounded:
  none: 0px
  control: 6px
  tab: 8px
  window: 10px
  logo: 20px
  full: 9999px
spacing:
  2xs: 4px
  xs: 8px
  s: 12px
  m: 16px
  l: 24px
  xl: 32px
  2xl: 48px
  3xl: 88px
  section: 160px
  gutter: 48px
  container: 1320px
  header: 68px
components:
  page:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
  page-dark:
    backgroundColor: "{colors.paper-dark}"
    textColor: "{colors.ink-dark}"
    typography: "{typography.body-md}"
  text-muted:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink-2}"
  text-muted-dark:
    backgroundColor: "{colors.paper-dark}"
    textColor: "{colors.ink-2-dark}"
  divider:
    backgroundColor: "{colors.line}"
    height: 1px
  divider-hover:
    backgroundColor: "{colors.line-strong}"
    height: 2px
  display-title:
    textColor: "{colors.ink}"
    typography: "{typography.display-md}"
  display-emphasis:
    textColor: "{colors.primary}"
    typography: "{typography.display-md}"
  display-emphasis-dark:
    textColor: "{colors.primary-dark}"
    typography: "{typography.display-md}"
  lead:
    textColor: "{colors.ink-2}"
    typography: "{typography.body-lg}"
  eyebrow:
    textColor: "{colors.ink-2}"
    typography: "{typography.body-sm}"
  eyebrow-rule:
    backgroundColor: "{colors.primary}"
    width: 28px
    height: 1px
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    typography: "{typography.label-md}"
    rounded: "{rounded.none}"
    height: 52px
    padding: 24px
  button-primary-hover:
    backgroundColor: "{colors.ember}"
    textColor: "{colors.night}"
  button-hover-halo:
    backgroundColor: "{colors.cream}"
    textColor: "{colors.night}"
    size: 256px
  button-secondary:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.label-md}"
    rounded: "{rounded.none}"
    height: 52px
    padding: 24px
  button-small:
    typography: "{typography.label-sm}"
    rounded: "{rounded.none}"
    height: 40px
    padding: 16px
  button-light:
    backgroundColor: "{colors.on-night}"
    textColor: "{colors.night}"
    typography: "{typography.label-md}"
    rounded: "{rounded.none}"
    height: 52px
    padding: 24px
  button-secondary-light:
    backgroundColor: "{colors.night}"
    textColor: "{colors.on-night}"
    typography: "{typography.label-md}"
    rounded: "{rounded.none}"
    height: 52px
    padding: 24px
  nav-link:
    textColor: "{colors.ink}"
    typography: "{typography.label-sm}"
  nav-link-current-underline:
    backgroundColor: "{colors.primary-strong}"
    height: 2px
  feature-card:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink-2}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.none}"
    padding: 32px
  feature-title:
    textColor: "{colors.ink}"
    typography: "{typography.headline-md}"
  feature-icon:
    textColor: "{colors.primary}"
    size: 48px
  block-count:
    backgroundColor: "{colors.amber}"
    textColor: "{colors.night}"
    typography: "{typography.display-xl}"
    rounded: "{rounded.none}"
    padding: 32px
  band:
    backgroundColor: "{colors.ember}"
    textColor: "{colors.ink}"
    padding: 160px
  band-light:
    backgroundColor: "{colors.gold}"
    textColor: "{colors.ink}"
  band-sky:
    backgroundColor: "{colors.sky}"
    textColor: "{colors.ink}"
  band-sky-2:
    backgroundColor: "{colors.sky-2}"
    textColor: "{colors.ink}"
  faq-question:
    textColor: "{colors.ink}"
    typography: "{typography.headline-sm}"
    padding: 24px
  faq-question-hover:
    textColor: "{colors.primary-strong}"
  faq-question-hover-dark:
    textColor: "{colors.primary-strong-dark}"
  closing:
    backgroundColor: "{colors.night}"
    textColor: "{colors.on-night}"
    typography: "{typography.display-xl}"
    padding: 160px
  closing-sun-rim:
    backgroundColor: "{colors.rust}"
    size: 640px
  footer:
    backgroundColor: "{colors.night}"
    textColor: "{colors.on-night-2}"
    typography: "{typography.body-sm}"
    padding: 88px
  footer-title:
    backgroundColor: "{colors.night}"
    textColor: "{colors.on-night}"
    typography: "{typography.label-caps}"
  code:
    textColor: "{colors.ink}"
    typography: "{typography.code}"
  code-block:
    textColor: "{colors.ink}"
    typography: "{typography.code}"
    padding: 16px
  demo-window:
    backgroundColor: "{colors.paper-2}"
    textColor: "{colors.ink}"
    rounded: "{rounded.window}"
  demo-window-dark:
    backgroundColor: "{colors.paper-2-dark}"
    textColor: "{colors.ink-dark}"
    rounded: "{rounded.window}"
  demo-tab:
    typography: "{typography.caption}"
    rounded: "{rounded.tab}"
    height: 36px
  demo-loader:
    backgroundColor: "{colors.paper-2}"
    textColor: "{colors.ink-2}"
  logo-tile:
    backgroundColor: "{colors.logo-flat}"
    rounded: "{rounded.logo}"
    size: 128px
  logo-gradient-start:
    backgroundColor: "{colors.logo-gold}"
  logo-gradient-end:
    backgroundColor: "{colors.logo-red}"
  wordmark:
    textColor: "{colors.ink}"
    typography: "{typography.wordmark-elio}"
    height: 17.5px
  wordmark-light:
    textColor: "{colors.on-night}"
    typography: "{typography.wordmark-elio}"
    height: 17.5px
  condition-icon:
    size: 24px
---

# Elio Blocks

This file is the design system of Elio Blocks, in the
[DESIGN.md format](https://github.com/google-labs-code/design.md). The tokens
above are the values; the sections below say where they go. The tokens have
the names of the custom properties of `docs/site/assets/site.css` (`paper` is
`--paper`, `space.l` is `--space-l`), except `primary` (`--accent`) and
`primary-strong` (`--accent-2`). A `-dark` token is the value of the token
without the suffix in the dark color scheme.

## Overview

Two surfaces, two rules.

**The blocks have no look of their own.** Elio Blocks is built the way
WordPress builds its own blocks, and it shows the weather in the colors, fonts
and spacing of the theme: `theme.json`, global styles and block supports
decide. What the plugin ships is behavior, not style: icons in `currentColor`,
tabular numerals on every value (`.elio-tabular-nums`), a 24px default size
for condition icons that any theme rule replaces, and the 0.75em centered
credit of the provider attribution, a default of its `style` attribute that
shows in its Typography panel. The settings page is a WordPress admin page:
`@wordpress/components`, DataViews and the tokens of `@wordpress/theme`
(`--wpds-*`), nothing else.

**The brand is a sunset on film.** The logo, the presentation site
(`docs/site/`), the WordPress.org banner and icon and the video share one
identity, taken from a film photo of a sunset sky
(`docs/site/assets/images/`, the WordPress.org banner): clouds lit amber and
ember, the golden black of their shadows, a patch of pale blue sky. It is warm
and saturated in both color schemes, a little 70s, calm. Flat blocks of color
sit over the photo, film grain covers everything, and things move the way
light does: they drift, breathe and rise.

The voice of the titles is a plain statement, then a turn of weather wit in
italic: "Weather, *with blocks.*", "Questions, *clear skies.*", "Let the
*sunshine* in." The copy says one thing: it is all native WordPress.

## Colors

The palette is the photo: four lights (gold, amber, ember, rust), two cream
whites, golden blacks, and the blue of the sky.

- **Primary (#CC6400), the accent.** A burnt orange for what the eye must
  find: the italic half of a title, icons, the rule of an eyebrow, the bar of
  a code block, the progress bar of the demo. At 3.7:1 on paper, large text
  and graphics only.
- **Primary strong (#B35000).** The accent for small text: 4.9:1 on paper.
  The underline of the current section in the menu, a hovered FAQ question.
- **Paper (#FDF9F2) and paper 2 (#F6EFE3).** The warm white of the page, and
  the layer above it (the demo window, its loading screen). Never pure white:
  only the WordPress pages inside the demo window are `#FFFFFF`, in both
  color schemes.
- **Ink (#1A1611) and ink 2 (#5E5446).** The golden black of the shadows of
  the photo for text, and a warm grey for secondary text (7.1:1 on paper).
  Ink is also the name in the logo.
- **Line (ink at 14%) and line strong (ink at 40%).** Hairlines: the frame of
  a feature card, the rules of the FAQ, a hovered menu link.
- **Ember (#E0602A), amber (#F0A044), gold (#F7D49A), cream (#FFF1D6), rust
  (#8F3515).** The light of the sunset, used as light: gradients and glows,
  never a text color. Amber to ember fills the count of blocks; ember, amber
  and gold light a hovered button under a halo of cream; cream, gold, amber,
  ember and rust are the closing sun from its center to its rim.
- **Sky (#B7CDD6) and sky 2 (#93A8C6).** The only blue, and only as two broad
  soft patches of light drifting in the front-end band. Never a button, a
  link or a UI state.
- **Night (#14110D) and on night (#EEE7DB).** The closing section and the
  footer, in both color schemes. On night 2 (on night at 70%) for the text of
  the footer.
- **Logo gold (#DDAB07) to logo red (#DE2900).** The gradient of the logo
  tile only, over logo flat (#E0820C). See Logo.

**Dark color scheme** (`prefers-color-scheme: dark`): paper becomes night,
paper 2 `#1D1914`, ink `#EEE7DB`, ink 2 `#A39C91`, primary amber and primary
strong ember. It stays as saturated as the light one: the golden black of the
photo, not a grey. The front-end band, the count of blocks, the closing and
the footer do not change.

**Title light.** A highlighted word of a display title shimmers, a gradient
moving through it like light through clouds: `#CC5A00`, `#D09400`, `#CC6400`
in the light scheme; amber, gold and `#E8703A` in the dark one and on night.
It goes down to 2.5:1 where it is gold, by choice, at display sizes only. With
`forced-colors`, it is plain `CanvasText`.

**Contrast** (WCAG 2.2 AA, measured):

| Text | Ground | Ratio | Use |
| --- | --- | --- | --- |
| ink | paper | 17.2:1 | all text |
| ink 2 | paper | 7.1:1 | secondary text |
| primary strong | paper | 4.9:1 | small text in accent |
| primary | paper | 3.7:1 | large text, icons, rules only |
| ink | ember | 5.0:1 | text of the front-end band (ember is its darkest stop) |
| night | ember | 5.3:1 | the count of blocks, a hovered button |
| on night 2 | night | 7.9:1 | footer text |
| ink 2 dark | paper dark | 6.9:1 | secondary text, dark scheme |
| primary dark | paper dark | 8.8:1 | accent, dark scheme |

## Typography

Two typefaces and a mono, all under the SIL Open Font License, self-hosted
in `docs/site/assets/fonts/` (woff2, `font-display: swap`).

- **Instrument Serif 400**, roman and italic, for display and headlines only,
  never below `--text-xl`. Titles are tight (line height 0.88 to 0.95,
  tracking −0.02em) and balanced (`text-wrap: balance`). The `<em>` of a
  title is the italic, in primary.
- **Geist** (variable) for everything else: body 400, buttons, menu and tabs
  500, the titles of the footer columns 500 in capitals tracked 0.04em, the
  `+` of the FAQ 300.
- **Geist Mono 450** for code only, at 0.875em of the text around it.
- **Geologica** exists only inside the logo, outlined. It is never loaded as a
  web font nor used for live text. See Logo.

One fluid scale, from phone to desktop. The tokens give the desktop size:

| Token | Custom property | Size | Use |
| --- | --- | --- | --- |
| `caption`, `label-caps` | `--text-xs` | 13px | footer titles, legal line, browser chrome |
| `body-sm`, `label-sm` | `--text-s` | 15px | card text, eyebrow, menu, small buttons |
| `body-md`, `label-md` | `--text-m` | 17px | body, buttons |
| `body-lg` | `--text-l` | `clamp(1.0625rem, 0.3vw + 1rem, 1.25rem)` | lead |
| `headline-sm` | `--text-xl` | `clamp(1.375rem, 0.6vw + 1.2rem, 1.75rem)` | FAQ questions |
| `headline-md` | `--text-2xl` | `clamp(1.625rem, 1vw + 1.3rem, 2.125rem)` | card and step titles, the "blocks" of the count |
| `display-md` | `--text-3xl` | `clamp(2.75rem, 5.5vw, 5rem)` | section titles |
| `display-lg` | `--text-4xl` | `clamp(3.25rem, 8vw, 8rem)` | the hero title |
| `display-xl` | `--text-5xl` | `clamp(3.75rem, 9.5vw, 9.5rem)` | the closing title, the count of blocks (line height 0.8, tracking −0.03em) |

Measures: a lead 34em at most, an FAQ answer 40em, the text of the footer
32ch. Leads are `text-wrap: pretty`. Numbers that change or line up are
`tabular-nums`.

## Layout

A fluid page in one container: 1320px at most, a gutter of
`clamp(16px, 4vw, 48px)` on each side, no horizontal scroll at any width.

One spacing scale on a 4px grid: 4, 8, 12, 16, 24, 32, 48, then two fluid
steps, `--space-3xl` (`clamp(48px, 6vw, 88px)`) between a header and its
content and `--space-section` (`clamp(80px, 11vw, 160px)`) above and below a
section. Every size comes from `--text-*` and `--space-*`, never a one-off
value; the drawn browser window of the demo alone keeps its own pixel sizes.

- **Header:** sticky, 68px, paper at 90% under a 12px backdrop blur; anchors
  land 80px below the top. The menu hides under 760px, the call to action
  stays.
- **Hero:** two columns (1.4fr / 1fr), the intro starting at the cap height
  of the title; one column under 960px. Below it, the demo window rises from
  the photo into the hero.
- **Split:** a sticky aside (0.85fr) beside its content (1.15fr); one column
  under 900px.
- **Features:** four columns, the count of blocks first, every row as tall as
  the tallest card; two columns under 1080px, one under 600px (each card its
  own height).
- **Front-end band:** three steps; one column under 860px.
- **Footer:** the brand and one line (1fr) beside three lists of links
  (1.4fr); one column under 860px, the lists in two under 420px.
- **Settings page** (plugin): the admin-ui page of WordPress, its content
  680px wide at most and centered, padded with `--wpds-dimension-padding-*`.

## Elevation & Depth

Flat. Hierarchy comes from tone, rules and light, not shadows.

- **Tone:** paper, then paper 2 above it; night for the closing and the
  footer, the end of the day.
- **Rules:** 1px lines of `line`, 2px for an underline or a focus ring.
- **Grain:** a fixed fractal-noise texture over the whole page, photos and
  flat colors alike (opacity 0.4, `mix-blend-mode: overlay`, no pointer
  events).
- **Light:** a glow of amber breathes behind the demo window where it stands
  over the paper (12s); the closing sun glows (6s) and rises with the scroll
  as the footer comes into view (a view timeline, `--sunrise` from the script
  where scroll animations are missing).
- **The one shadow** is the demo window's, a real window over the page:
  a 1px ring and `0 40px 80px -30px rgb(20 10 6 / 60%)`.

**Motion** eases on `cubic-bezier(0.2, 0.7, 0.2, 1)` (`--ease`). Sections
reveal once, 28px up over 0.9s, the columns of a grid about 0.1s apart. The title
shimmer takes 9s, the light of the band drifts over 26s and 34s, the sun of
the loader turns in 12s. Hovered, a button arrow moves 2px toward where it
leads and the sun of the logo turns 90°. With `prefers-reduced-motion:
reduce`, every animation and transition stops and every section shows.

## Shapes

Square by default: buttons, cards, the count of blocks, code, bands, radius 0.
Round only what is round or a window:

- the logo tile, 20/128 of its side (20px at 128px, 4.4px at the 28px of
  the header);
- the suns: the closing sun, the status dot of the demo, the dots of the
  window, all circles;
- the demo window (10px), its tabs (8px at the top), its buttons (6px), its
  address field (a pill).

Lines are 1px; underlines, the bar of a code block and focus rings 2px.
Icons are drawn with a 1.5px line (see Iconography).

## Components

- **Buttons.** Flat and square, 52px high (40px small), a label in Geist 500,
  an arrow that moves on hover. Primary: ink with paper text. Secondary: a
  1px ink frame, no fill. On night, light (on night with night text) and
  secondary light (an on night frame). Hovered, any button lights up like the
  closing sun: ember, amber and gold under night text (5.3:1), a halo of cream
  of 128px radius gliding halfway to the pointer (`--halo-x`, `--halo-y`). The
  light and the moving arrow say hover, not a color alone. A button leading to
  WordPress.org carries the WordPress logo (22px, 18px small) in place of the
  arrow; one opening a new tab carries ↗ and "(opens in a new tab)" in its
  label.
- **Eyebrow.** Above a section title: a 28px rule of primary, then a line in
  `--text-s` and ink 2.
- **Display title.** Instrument Serif, the statement in ink and the italic
  turn in primary, balanced.
- **Menu link.** Geist 500 `--text-s` in ink; a 2px underline 0.4em below,
  line strong on hover, primary strong for the section on screen
  (`aria-current`), the text keeping its color.
- **Feature card.** A 1px frame of line, 32px of padding, a 48px icon in
  primary, a serif title, text in ink 2.
- **Count of blocks.** The first cell of the features: a gradient from amber
  (40%) to ember, night text, the number in serif `--text-5xl`, "blocks" in
  italic below it, a note at the bottom.
- **Front-end band.** Ember, with broad patches of gold, amber, `#E8703A`
  and the two skies drifting in it; ink text, its icons in ink; three steps
  under a 1px rule of ink at 30%.
- **FAQ.** `<details>` under rules of line, the question in serif
  `--text-xl` with a `+` in primary that turns 45° when open, the answer in
  ink 2. The first question is open.
- **Closing and footer.** Night. The closing title in serif `--text-5xl` and
  a sun rising behind it. The footer: the logo and one line, three lists of
  links (titles in capitals, links underlined on hover only), then the
  licenses and the author in `--text-xs`, under rules of on night at 12%.
- **Code.** Geist Mono on a 7% tint of the text color in a 16% frame, so it
  reads on paper, ember and night alike. A block of code adds a 2px bar of
  primary on its left and scrolls sideways (`tabindex="0"`).
- **Demo window.** A browser drawn in the colors of the page (`--browser-*`):
  tabs on a darker strip, the selected one joining the toolbar with a 2px
  line of ember, the first dot ember. While WordPress starts, the screen is
  paper 2 with the Elio sun turning and a 2px progress bar of primary.
- **Focus.** A 2px ring in `currentColor`, 4px off, so it shows on paper,
  ember and night alike.

**The blocks of the plugin** follow the theme. A block stylesheet sets
layout and behavior only, and its defaults carry no specificity
(`:where()`), so a theme, `theme.json` or a block setting always wins. A
condition icon is 24px wide by default and drawn in `currentColor`; a value
and its unit touch, the unit label carrying its own space; the provider
credit is 0.75em and centered through its attributes. Editor UI is built
from `@wordpress/components`.

## Logo

The tile and the sun, then the name.

- **Tile.** A 128 square, radius 20, a linear gradient from logo gold
  (x1 74.1166, y1 2.07213) to logo red (x2 54.2119, y2 127.829), top to
  bottom with a slight lean, over logo flat. The sun: twelve rays drawn as one
  white star, stroke 5.75, from 24 to 104. Source:
  `src/icons/brand/svg/elio-logo.svg`, the editor's block collection icon and
  the WordPress.org icon. The admin menu has a monochrome version
  (`MENU_ICON`), the sun cut out of the tile, which WordPress tints.
- **Name.** "ELIO BLOCKS" in capitals of Geologica, its axes at their defaults
  (CRSV 0, SHRP 0, upright), "Elio" 700 and "Blocks" 300, tracked −0.01em,
  the space between the words 0.15em. Outlined into
  `docs/brand/elio-blocks-wordmark.svg` (`currentColor`), so no font ships
  with it.
- **Lockup.** The capitals are 56% of the height of the tile and centered on
  it; the name starts a quarter of the tile (0.26) after it. The master is
  668 × 128: `docs/brand/elio-blocks-logo.svg` (name in ink, light grounds)
  and `elio-blocks-logo-light.svg` (name in white, dark grounds). In the site
  header: a 28px tile, the name 17.5px high, 8px between them.
- **Behavior.** On hover, the sun turns 90° in its tile (0.6s).

The tile is never recolored, outlined, shadowed or set without its gradient.
The name is never typed in live text or redrawn from another typeface: a new
size is a scale of the SVG, a new version a new outline of Geologica.

## Iconography

One collection, Elio, is every icon of the plugin.

- **Drawing.** 24 × 24, strokes of 1.5 (`strokeWidth` of
  `src/icons/manifest.json`), black. Exported from Figma into
  `src/icons/svg/` as `<path>` elements only: no other element, color,
  transform or mask (the build fails on them).
- **Outputs** (`npm run build:icons`): strokes in `currentColor` for the
  condition icons of the blocks, the stroke width set by the block or the
  collection; outlined fills for the WordPress 7.1 Icons API and the Icon
  block; the block icons of the editor, which are drawn in the style of
  `@wordpress/icons` (`src/icons/block-editor/`).
- **On the site.** 24px with a 1.5px line; the icons of the cards and steps
  48px, still a 1.5px line (stroke 0.75 on the 24 grid), in primary on paper
  and in ink on the band.

## Do's and Don'ts

- Do take every size from `--text-*` and `--space-*`.
- Do keep primary for large text, icons and rules; small text in accent is
  primary strong.
- Do give a title one italic turn, in primary; keep the serif at `--text-xl`
  and above.
- Do let the theme style the blocks: defaults under `:where()`, icons in
  `currentColor`, no color nor font in a block stylesheet.
- Do pair every animation with the reduced-motion rule, and every hover with
  more than a color.
- Don't round a button or a card, and don't add a shadow anywhere but the
  demo window.
- Don't use the sky blue for UI, or pure black and white for a surface.
- Don't load Geologica for text, and don't use Chillax: its license forbids
  redistribution.
- Don't recolor the logo tile or set the name in live text.
