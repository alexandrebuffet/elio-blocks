/**
 * The documentation of Elio Blocks, served under /docs/ of the presentation
 * site (deploy-site.yml). Pages written by hand in docs/, the reference pages
 * in docs/reference/ written by scripts/build-docs.mjs from the code.
 */
import { themes } from 'prism-react-renderer';

const GITHUB = 'https://github.com/alexandrebuffet/elio-blocks';
const SITE = 'https://alexandrebuffet.github.io/elio-blocks/';

export default {
	title: 'Elio Blocks',
	tagline: 'Weather blocks for the WordPress Block Editor.',
	favicon: `${ SITE }favicon.svg`,
	url: 'https://alexandrebuffet.github.io',
	baseUrl: '/elio-blocks/docs/',
	trailingSlash: false,
	onBrokenLinks: 'throw',
	onBrokenAnchors: 'throw',
	// The logos of docs/brand, served next to the pages.
	staticDirectories: [ '../brand' ],
	presets: [
		[
			'classic',
			{
				docs: {
					routeBasePath: '/',
					sidebarPath: './sidebars.js',
					editUrl: `${ GITHUB }/edit/develop/docs/handbook/`,
				},
				blog: false,
				theme: {
					customCss: './src/css/custom.css',
				},
			},
		],
	],
	themeConfig: {
		colorMode: {
			respectPrefersColorScheme: true,
		},
		navbar: {
			logo: {
				alt: 'Elio Blocks',
				src: 'elio-blocks-logo.svg',
				srcDark: 'elio-blocks-logo-light.svg',
			},
			items: [
				{ href: SITE, label: 'Site', position: 'right' },
				{ href: GITHUB, label: 'GitHub', position: 'right' },
			],
		},
		footer: {
			copyright:
				'Elio Blocks is free software, released under the GPL v2 or later. Weather data by Open-Meteo, licensed under CC BY 4.0.',
		},
		// Their colors only: the code blocks take the paper of the page (custom.css).
		prism: {
			theme: themes.github,
			darkTheme: themes.palenight,
			additionalLanguages: [ 'php' ],
		},
	},
};
