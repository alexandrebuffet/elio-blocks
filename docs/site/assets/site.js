/**
 * The presentation site: the live demo of the hero (WordPress Playground in
 * two windows, the editor and the front end of one site), the screenshot
 * tabs, the condition icons (icons.json) and the scroll reveals.
 */

const PLAYGROUND = 'https://playground.wordpress.net';

const SCREENSHOTS = {
	1: {
		url: 'my-site.test/wp-admin/post.php',
		caption:
			'The Weather block in the Block Editor, with an hourly forecast and its location settings.',
	},
	2: {
		url: 'my-site.test/weather-in-paris',
		caption: 'A daily forecast on the front end.',
	},
	3: {
		url: 'my-site.test/wp-admin/post-new.php',
		caption: 'Start blank and choose a layout for the Weather block.',
	},
	4: {
		url: 'my-site.test/wp-admin/post-new.php',
		caption: 'Search for a location by name.',
	},
	5: {
		url: 'my-site.test/wp-admin/admin.php?page=elio-blocks-settings',
		caption:
			'The General section of the settings page: units and data refresh.',
	},
};

// The windows of the hero show the editor without its welcome guide, and
// the front end without the toolbar, so the Weather block is in sight.
const DEMO_SETUP = `<?php
require '/wordpress/wp-load.php';
update_user_meta( 1, $wpdb->get_blog_prefix() . 'persisted_preferences', array(
	'core/edit-post' => array( 'welcomeGuide' => false ),
	'core' => array( 'welcomeGuide' => false ),
	'_modified' => gmdate( 'c' ),
) );
wp_mkdir_p( WPMU_PLUGIN_DIR );
file_put_contents( WPMU_PLUGIN_DIR . '/elio-demo.php', "<?php add_filter( 'show_admin_bar', '__return_false' );\\n" );
`;

const iconsPromise = fetch( 'icons.json' )
	.then( ( response ) => response.json() )
	.catch( () => null );

const blueprintPromise = fetch( 'blueprint.json' )
	.then( ( response ) => response.json() )
	.catch( () => null );

const zipUrl = new URL( 'elio-blocks.zip', document.baseURI ).href;

function svgIcon( slug ) {
	const svg = document.createElementNS( 'http://www.w3.org/2000/svg', 'svg' );
	svg.setAttribute( 'class', 'icon' );
	svg.setAttribute( 'aria-hidden', 'true' );
	const use = document.createElementNS( 'http://www.w3.org/2000/svg', 'use' );
	use.setAttribute( 'href', `icons.svg#${ slug }` );
	svg.append( use );
	return svg;
}

/* The full demo, in a new tab */

async function initPlaygroundLinks() {
	const blueprint = await blueprintPromise;
	if ( ! blueprint ) {
		return;
	}
	// Until the plugin is on WordPress.org, Playground installs the zip the
	// deploy workflow puts next to this page (GitHub Pages allows CORS).
	const { plugins, ...rest } = blueprint;
	const url = `${ PLAYGROUND }/#${ encodeURIComponent(
		JSON.stringify( {
			...rest,
			steps: [
				{
					step: 'installPlugin',
					pluginData: { resource: 'url', url: zipUrl },
				},
				...( rest.steps ?? [] ),
			],
		} )
	) }`;
	document
		.querySelectorAll( '[data-playground-link]' )
		.forEach( ( link ) => ( link.href = url ) );
}

/* The live demo of the hero */

// An iframe laid out at a desktop width, scaled down to its window.
function fitScreen( screen ) {
	const width = Number( screen.dataset.width );
	const resize = () => {
		screen.style.setProperty( '--screen-width', `${ width }px` );
		screen.style.setProperty(
			'--screen-scale',
			String( screen.clientWidth / width )
		);
	};
	resize();
	new window.ResizeObserver( resize ).observe( screen );
}

function liveFrame( screen, title ) {
	const iframe = document.createElement( 'iframe' );
	iframe.title = title;
	iframe.className = 'browser__frame';
	iframe.addEventListener( 'load', () => iframe.classList.add( 'is-ready' ) );
	screen.append( iframe );
	return iframe;
}

function canStartByItself() {
	return (
		window.matchMedia( '(min-width: 861px)' ).matches &&
		! navigator.connection?.saveData &&
		! window.matchMedia( '(prefers-reduced-data: reduce)' ).matches
	);
}

function initLiveDemo() {
	const live = document.querySelector( '[data-live]' );
	if ( ! live ) {
		return;
	}
	const editorScreen = live.querySelector( '[data-live-screen="editor"]' );
	const frontScreen = live.querySelector( '[data-live-screen="front"]' );
	const reload = live.querySelector( '[data-live-reload]' );
	const status = document.querySelector( '[data-live-status]' );
	const startButton = document.querySelector( '[data-live-start]' );
	[ editorScreen, frontScreen ].forEach( fitScreen );

	let started = false;
	const start = async () => {
		if ( started ) {
			return;
		}
		started = true;
		startButton.hidden = true;
		live.classList.add( 'is-starting' );
		status.textContent = 'Starting WordPress…';
		try {
			const [ client, zip, blueprint ] = await Promise.all( [
				import( `${ PLAYGROUND }/client/index.js` ),
				fetch( zipUrl ).then( ( response ) => {
					if ( ! response.ok ) {
						throw new Error( 'No plugin package' );
					}
					return response.arrayBuffer();
				} ),
				blueprintPromise,
			] );
			const editor = liveFrame(
				editorScreen,
				'Live demo: the post editor, with the Weather block'
			);
			const playground = await client.startPlaygroundWeb( {
				iframe: editor,
				remoteUrl: `${ PLAYGROUND }/remote.html`,
				blueprint: {
					preferredVersions: blueprint.preferredVersions,
					features: blueprint.features,
					siteOptions: blueprint.siteOptions,
					login: true,
				},
			} );
			await playground.isReady();
			status.textContent = 'Installing Elio Blocks…';
			// The zip is read by this page, so Playground needs no CORS for it.
			await client.installPlugin( playground, {
				pluginData: new File( [ zip ], 'elio-blocks.zip' ),
				options: { activate: true },
			} );
			for ( const step of blueprint.steps ?? [] ) {
				if ( step.step === 'runPHP' ) {
					await client.runPHP( playground, { code: step.code } );
				}
			}
			await client.runPHP( playground, { code: DEMO_SETUP } );
			await playground.goTo( blueprint.landingPage );
			const siteUrl = ( await playground.absoluteUrl ).replace(
				/\/$/,
				''
			);
			const front = liveFrame(
				frontScreen,
				'Live demo: the post on the front end'
			);
			front.src = `${ siteUrl }/?p=1000`;
			reload.disabled = false;
			reload.addEventListener( 'click', () => {
				reload.classList.remove( 'is-spinning' );
				// Reading the layout restarts the animation.
				void reload.offsetWidth;
				reload.classList.add( 'is-spinning' );
				front.src = `${ siteUrl }/?p=1000&t=${ Date.now() }`;
			} );
			live.classList.remove( 'is-starting' );
			live.classList.add( 'is-live' );
			status.textContent = 'Live: a real WordPress, in your browser.';
		} catch {
			live.classList.remove( 'is-starting' );
			status.textContent =
				'The live demo could not start here: try it in a new tab.';
		}
	};

	startButton.addEventListener( 'click', start );
	if ( canStartByItself() ) {
		// Once the page itself is shown.
		const idle = window.requestIdleCallback ?? window.setTimeout;
		if ( document.readyState === 'complete' ) {
			idle( start );
		} else {
			window.addEventListener( 'load', () => idle( start ) );
		}
	} else if ( window.matchMedia( '(min-width: 861px)' ).matches ) {
		startButton.hidden = false;
	} else {
		// A phone gets the demo on its whole screen, in a new tab.
		status.textContent = 'The editor and the front end, live.';
		document.querySelector( '[data-live-open]' ).hidden = false;
	}
}

/* Screenshots */

function initScreens() {
	const tabs = [ ...document.querySelectorAll( '[role="tab"]' ) ];
	const panel = document.getElementById( 'shot' );
	const image = panel?.querySelector( '.stage__image' );
	if ( ! image ) {
		return;
	}
	const caption = document.querySelector( '[data-shot-caption]' );
	const address = panel.querySelector( '[data-shot-url]' );

	const select = ( tab ) => {
		const shot = SCREENSHOTS[ tab.dataset.shot ];
		tabs.forEach( ( other ) => {
			const selected = other === tab;
			other.setAttribute( 'aria-selected', String( selected ) );
			other.tabIndex = selected ? 0 : -1;
		} );
		panel.setAttribute( 'aria-labelledby', tab.id );
		image.classList.add( 'is-changing' );
		const next = new window.Image();
		next.src = `assets/wporg/screenshot-${ tab.dataset.shot }.png`;
		next.decode()
			.catch( () => {} )
			.then( () => {
				image.src = next.src;
				image.alt = shot.caption;
				image.width = next.naturalWidth || image.width;
				image.height = next.naturalHeight || image.height;
				caption.textContent = shot.caption;
				address.textContent = shot.url;
				image.classList.remove( 'is-changing' );
			} );
	};

	tabs.forEach( ( tab, index ) => {
		tab.addEventListener( 'click', () => select( tab ) );
		tab.addEventListener( 'keydown', ( event ) => {
			const targets = {
				ArrowRight: tabs[ ( index + 1 ) % tabs.length ],
				ArrowLeft: tabs[ ( index - 1 + tabs.length ) % tabs.length ],
				Home: tabs[ 0 ],
				End: tabs[ tabs.length - 1 ],
			};
			const next = targets[ event.key ];
			if ( ! next ) {
				return;
			}
			event.preventDefault();
			next.focus();
			select( next );
		} );
	} );
}

/* Condition icons, set as in the block inspector */

function describe( condition ) {
	const text = condition.replace( /-/g, ' ' );
	return text.charAt( 0 ).toUpperCase() + text.slice( 1 );
}

async function initConditions() {
	const list = document.querySelector( '[data-conditions]' );
	const data = await iconsPromise;
	if ( ! list || ! data ) {
		return;
	}
	// One tile per condition, with its day and night icons.
	const conditions = new Map();
	data.conditionMappings.forEach( ( { condition, dayOrNight, iconSlug } ) => {
		const icons = conditions.get( condition ) ?? {};
		if ( dayOrNight === 'all' ) {
			icons.day = iconSlug;
			icons.night = iconSlug;
		} else {
			icons[ dayOrNight ] = iconSlug;
		}
		conditions.set( condition, icons );
	} );
	const uses = [];
	list.replaceChildren(
		...[ ...conditions ].map( ( [ condition, icons ] ) => {
			const item = document.createElement( 'li' );
			const icon = svgIcon( icons.day );
			uses.push( { use: icon.firstChild, icons } );
			const name = document.createElement( 'span' );
			name.textContent = describe( condition );
			item.append( icon, name );
			return item;
		} )
	);

	document
		.querySelectorAll( '[data-icon-time]' )
		.forEach( ( input ) =>
			input.addEventListener( 'change', () =>
				uses.forEach( ( { use, icons } ) =>
					use.setAttribute(
						'href',
						`icons.svg#${ icons[ input.value ] ?? icons.day }`
					)
				)
			)
		);
	document
		.querySelectorAll( '[data-icon-stroke]' )
		.forEach( ( input ) =>
			input.addEventListener( 'change', () =>
				list.style.setProperty( '--icon-stroke', input.value )
			)
		);
	document.querySelectorAll( '[data-icon-color]' ).forEach( ( input ) =>
		input.addEventListener( 'change', () => {
			list.dataset.color = input.value;
		} )
	);
}

/* Reveal on scroll, and the figures counting up */

function countUp( element ) {
	const target = Number( element.textContent );
	const duration = 1200;
	const started = performance.now();
	const tick = ( now ) => {
		const progress = Math.min( 1, ( now - started ) / duration );
		const eased = 1 - Math.pow( 1 - progress, 3 );
		element.textContent = String( Math.round( target * eased ) );
		if ( progress < 1 ) {
			window.requestAnimationFrame( tick );
		}
	};
	window.requestAnimationFrame( tick );
}

function initReveal() {
	const elements = document.querySelectorAll( '.reveal' );
	const still = window.matchMedia( '(prefers-reduced-motion: reduce)' );
	if ( ! ( 'IntersectionObserver' in window ) || still.matches ) {
		elements.forEach( ( element ) =>
			element.classList.add( 'is-visible' )
		);
		return;
	}
	const observer = new window.IntersectionObserver(
		( entries ) => {
			entries.forEach( ( entry ) => {
				if ( ! entry.isIntersecting ) {
					return;
				}
				entry.target.classList.add( 'is-visible' );
				entry.target
					.querySelectorAll( '[data-count]' )
					.forEach( countUp );
				observer.unobserve( entry.target );
			} );
		},
		{ rootMargin: '0px 0px -10% 0px' }
	);
	elements.forEach( ( element ) => observer.observe( element ) );
}

initReveal();
initPlaygroundLinks();
initLiveDemo();
initScreens();
initConditions();
