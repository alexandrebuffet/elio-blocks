# Contributing to Elio Blocks

Thanks for helping! Bug reports, fixes and ideas are all welcome.

## Before you start

- **Support questions** go to the [WordPress.org support forum](https://wordpress.org/support/plugin/elio-blocks/).
- **Security issues** are never reported in a public issue: see the [security policy](SECURITY.md).
- **Translations** are made on [translate.wordpress.org](https://translate.wordpress.org/projects/wp-plugins/elio-blocks/), not in pull requests.
- For a new feature or a large change, open an issue first so we can agree on the approach.

## Branches

- `develop` is where the work happens: **open your pull request against `develop`** (the default branch).
- `main` is the version released on WordPress.org. It only receives `develop` when a version is released.

## Setup

Requirements: Node.js 22 (see `.nvmrc`), PHP 8.2 or higher, Composer, and a local WordPress site (6.7 or higher) of your choice.

```bash
npm ci
composer install
npm start
```

Then put the plugin folder in `wp-content/plugins/elio-blocks` of your site and activate it. `npm start` rebuilds the blocks on each change.

## Checks

The CI runs these on every pull request, and they must pass:

```bash
npm run lint:js
npm run lint:css
npm run test:js
composer phpcs
composer phpstan
composer test
```

Plugin Check also runs on the built package.

## Code and commits

- Follow the WordPress coding standards for JavaScript and CSS, and PSR-12 for PHP. Indent with tabs.
- Keep strings translatable with the `elio-blocks` text domain.
- Add or update tests for what you change.
- Write commit messages as [Conventional Commits](https://www.conventionalcommits.org/): `fix(temperature): round negative values`.

## License

By contributing, you agree that your contributions are licensed under the [GPL-2.0-or-later](../LICENSE), the license of the plugin.
