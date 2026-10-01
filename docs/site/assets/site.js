/**
 * The presentation site: the live demo of the hero (WordPress Playground in
 * one window, the editor and the front end of one site in two tabs), the menu
 * following the scroll and the scroll reveals.
 */

const PLAYGROUND = 'https://playground.wordpress.net';

// Both demos, the hero and the full one: the visitor is a stranger from far
// away (a name, an avatar of a flying saucer, the author of the sample post),
// and the editor opens without its welcome guide.
const DEMO_SETUP = `<?php
require '/wordpress/wp-load.php';
wp_update_user( array(
	'ID' => 1,
	'display_name' => 'Stranger',
	'nickname' => 'Stranger',
	'first_name' => 'Stranger',
) );
wp_update_post( array( 'ID' => 1000, 'post_author' => 1 ) );
update_user_meta( 1, $wpdb->get_blog_prefix() . 'persisted_preferences', array(
	'core/edit-post' => array( 'welcomeGuide' => false ),
	'core' => array( 'welcomeGuide' => false ),
	'_modified' => gmdate( 'c' ),
) );
$uploads = wp_upload_dir();
wp_mkdir_p( $uploads['basedir'] );
file_put_contents( $uploads['basedir'] . '/stranger.svg', <<<'SVG'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3fd49a"/><stop offset="1" stop-color="#2a63d9"/></linearGradient></defs><rect width="64" height="64" fill="url(#g)"/><g fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M22 30a10 10 0 0 1 20 0"/><ellipse cx="32" cy="33" rx="20" ry="6"/><path d="M25 44l-3 6M32 45v6M39 44l3 6"/></g><g fill="#fff"><circle cx="23" cy="33" r="1.8"/><circle cx="32" cy="34.5" r="1.8"/><circle cx="41" cy="33" r="1.8"/></g></svg>
SVG
);
wp_mkdir_p( WPMU_PLUGIN_DIR );
file_put_contents( WPMU_PLUGIN_DIR . '/elio-demo-stranger.php', <<<'PHP'
<?php
add_filter( 'pre_get_avatar_data', function ( $args ) {
	$args['url'] = wp_upload_dir()['baseurl'] . '/stranger.svg';
	return $args;
} );
PHP
);
`;

// The hero shows the front end without the toolbar, so the Weather block is
// in sight. A link of the editor to the site ("View Post" opens a new tab,
// where the site of the demo does not exist) asks this page for the front end
// tab instead.
const HERO_SETUP = `<?php
require '/wordpress/wp-load.php';
wp_mkdir_p( WPMU_PLUGIN_DIR );
file_put_contents( WPMU_PLUGIN_DIR . '/elio-demo-toolbar.php', "<?php add_filter( 'show_admin_bar', '__return_false' );\\n" );
file_put_contents( WPMU_PLUGIN_DIR . '/elio-demo-links.php', <<<'PHP'
<?php
add_action( 'admin_print_footer_scripts', function () {
	?>
	<script>
	document.addEventListener( 'click', ( event ) => {
		const link = event.target.closest && event.target.closest( 'a[href]' );
		if ( ! link || link.origin !== location.origin || link.pathname.includes( '/wp-admin/' ) ) {
			return;
		}
		event.preventDefault();
		window.top.postMessage( { type: 'elio-demo-view', url: link.href }, '*' );
	}, true );
	</script>
	<?php
} );
PHP
);
`;

const blueprintPromise = fetch( 'blueprint.json' )
	.then( ( response ) => response.json() )
	.catch( () => null );

const zipUrl = new URL( 'elio-blocks.zip', document.baseURI ).href;

const phone = window.matchMedia( '(max-width: 599px)' );

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
				{ step: 'runPHP', code: DEMO_SETUP },
			],
		} )
	) }`;
	document
		.querySelectorAll( '[data-playground-link]' )
		.forEach( ( link ) => ( link.href = url ) );
}

/* The live demo of the hero */

// A page laid out at a desktop or tablet width, scaled down to its window
// (never up: a wider window gets a wider page).
function fitScreen( screen ) {
	const resize = () => {
		if ( ! screen.clientWidth ) {
			return;
		}
		const width = Math.max(
			Number( screen.dataset.width ),
			screen.clientWidth
		);
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

function initLiveDemo() {
	const live = document.querySelector( '[data-live]' );
	if ( ! live ) {
		return;
	}
	const editorScreen = live.querySelector( '[data-live-screen="editor"]' );
	const frontScreen = live.querySelector( '[data-live-screen="front"]' );
	const reload = live.querySelector( '[data-live-reload]' );
	const url = live.querySelector( '[data-live-url]' );
	const status = live.querySelector( '[data-live-status]' );
	const startButton = live.querySelector( '[data-live-start]' );
	const openLink = live.querySelector( '[data-live-open]' );
	const tabs = [ ...live.querySelectorAll( '[data-live-tab]' ) ];
	[ editorScreen, frontScreen ].forEach( fitScreen );

	// Set once WordPress runs: what the reload button and the tabs reload.
	let reloadTab = null;

	// Tabs, as the WAI-ARIA tabs pattern: arrows move between them.
	const selectTab = ( tab ) => {
		const name = tab.dataset.liveTab;
		const changed = live.dataset.tab !== name;
		live.dataset.tab = name;
		tabs.forEach( ( item ) => {
			item.setAttribute( 'aria-selected', String( item === tab ) );
			item.tabIndex = item === tab ? 0 : -1;
		} );
		const screen = name === 'front' ? frontScreen : editorScreen;
		url.textContent = screen.dataset.url;
		// The front end shows what the editor saved.
		if ( changed && name === 'front' && reloadTab ) {
			reloadTab( 'front' );
		}
	};
	tabs.forEach( ( tab, index ) => {
		tab.addEventListener( 'click', () => selectTab( tab ) );
		tab.addEventListener( 'keydown', ( event ) => {
			const next = {
				ArrowRight: index + 1,
				ArrowLeft: index - 1,
				Home: 0,
				End: tabs.length - 1,
			}[ event.key ];
			if ( next === undefined ) {
				return;
			}
			event.preventDefault();
			const target = tabs[ ( next + tabs.length ) % tabs.length ];
			target.focus();
			selectTab( target );
		} );
	} );

	// How far the demo is, for the sun of the loader.
	const progress = ( value ) =>
		live.style.setProperty( '--progress', String( value ) );
	const prepare = () => {
		live.classList.add( 'is-starting' );
		status.textContent = 'Starting WordPress…';
		progress( 0.1 );
	};

	let started = false;
	const start = async () => {
		if ( started ) {
			return;
		}
		started = true;
		startButton.hidden = true;
		prepare();
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
			progress( 0.3 );
			const editor = liveFrame(
				editorScreen,
				'Live demo of the post editor, with the Weather block'
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
			progress( 0.6 );
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
			await client.runPHP( playground, { code: HERO_SETUP } );
			progress( 0.85 );
			await playground.goTo( blueprint.landingPage );
			const siteUrl = ( await playground.absoluteUrl ).replace(
				/\/$/,
				''
			);
			const front = liveFrame(
				frontScreen,
				'Live demo of the post on the front end'
			);
			// The page the front end tab shows: the post, or what a link of
			// the editor opened.
			let frontUrl = new URL( `${ siteUrl }/?p=1000` );
			front.src = frontUrl.href;
			reloadTab = ( name ) => {
				if ( name === 'front' ) {
					frontUrl.searchParams.set( 't', String( Date.now() ) );
					front.src = frontUrl.href;
				} else {
					playground.goTo( blueprint.landingPage );
				}
			};
			window.addEventListener( 'message', ( event ) => {
				if (
					event.origin !== PLAYGROUND ||
					event.data?.type !== 'elio-demo-view' ||
					! String( event.data.url ).startsWith( `${ siteUrl }/` )
				) {
					return;
				}
				frontUrl = new URL( event.data.url );
				selectTab(
					tabs.find( ( tab ) => tab.dataset.liveTab === 'front' )
				);
			} );
			reload.disabled = false;
			reload.addEventListener( 'click', () => {
				reload.classList.remove( 'is-spinning' );
				// Reading the layout restarts the animation.
				void reload.offsetWidth;
				reload.classList.add( 'is-spinning' );
				reloadTab( live.dataset.tab );
			} );
			progress( 1 );
			live.classList.remove( 'is-starting' );
			live.classList.add( 'is-live' );
			status.textContent =
				'WordPress is ready. Edit the post, save it, then open “Weather on your site”.';
		} catch {
			live.classList.remove( 'is-starting' );
			status.textContent = 'The live demo could not start here.';
			openLink.hidden = false;
		}
	};

	startButton.addEventListener( 'click', start );
	if ( phone.matches ) {
		// A phone gets the demo on its whole screen, in a new tab.
		status.textContent = 'Try the editor and your site, live.';
		openLink.hidden = false;
	} else if (
		navigator.connection?.saveData ||
		window.matchMedia( '(prefers-reduced-data: reduce)' ).matches
	) {
		startButton.hidden = false;
	} else {
		// The loader from the first paint, WordPress once the page is shown.
		prepare();
		const idle = window.requestIdleCallback ?? window.setTimeout;
		if ( document.readyState === 'complete' ) {
			idle( start );
		} else {
			window.addEventListener( 'load', () => idle( start ) );
		}
	}
}

/* The menu link of the section on screen */

function initNav() {
	const links = [ ...document.querySelectorAll( '.site-nav a[href^="#"]' ) ];
	const targets = links.map( ( link ) =>
		document.querySelector( link.getAttribute( 'href' ) )
	);
	if ( ! ( 'IntersectionObserver' in window ) || targets.includes( null ) ) {
		return;
	}
	const onScreen = new Set();
	// The section across a line at 40% of the height of the window.
	const observer = new window.IntersectionObserver(
		( entries ) => {
			entries.forEach( ( entry ) =>
				onScreen[ entry.isIntersecting ? 'add' : 'delete' ](
					entry.target
				)
			);
			links.forEach( ( link, index ) =>
				onScreen.has( targets[ index ] )
					? link.setAttribute( 'aria-current', 'true' )
					: link.removeAttribute( 'aria-current' )
			);
		},
		{ rootMargin: '-40% 0px -60% 0px' }
	);
	targets.forEach( ( target ) => observer.observe( target ) );
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
initNav();
initPlaygroundLinks();
initLiveDemo();
