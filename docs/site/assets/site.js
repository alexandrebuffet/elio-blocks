/**
 * The presentation site: the live demo of the hero (WordPress Playground in
 * one window, the editor and the front end of one site in two tabs), the
 * condition icon studio (icons.json) and the scroll reveals.
 */

const PLAYGROUND = 'https://playground.wordpress.net';

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

const phone = window.matchMedia( '(max-width: 599px)' );

function svgIcon( slug ) {
	const svg = document.createElementNS( 'http://www.w3.org/2000/svg', 'svg' );
	svg.setAttribute( 'class', 'icon' );
	svg.setAttribute( 'aria-hidden', 'true' );
	const use = document.createElementNS( 'http://www.w3.org/2000/svg', 'use' );
	use.setAttribute( 'href', `icons.svg#${ slug }` );
	svg.append( use );
	return svg;
}

function pressOne( buttons, pressed ) {
	buttons.forEach( ( button ) =>
		button.setAttribute( 'aria-pressed', String( button === pressed ) )
	);
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
			reloadTab = ( name ) => {
				if ( name === 'front' ) {
					front.src = `${ siteUrl }/?p=1000&t=${ Date.now() }`;
				} else {
					playground.goTo( blueprint.landingPage );
				}
			};
			reload.disabled = false;
			reload.addEventListener( 'click', () => {
				reload.classList.remove( 'is-spinning' );
				// Reading the layout restarts the animation.
				void reload.offsetWidth;
				reload.classList.add( 'is-spinning' );
				reloadTab( live.dataset.tab );
			} );
			live.classList.remove( 'is-starting' );
			live.classList.add( 'is-live' );
			status.textContent = 'A real WordPress, running in your browser.';
		} catch {
			live.classList.remove( 'is-starting' );
			status.textContent = 'The live demo could not start here.';
			openLink.hidden = false;
		}
	};

	startButton.addEventListener( 'click', start );
	if ( phone.matches ) {
		// A phone gets the demo on its whole screen, in a new tab.
		status.textContent = 'The editor and the front end, live.';
		openLink.hidden = false;
	} else if (
		navigator.connection?.saveData ||
		window.matchMedia( '(prefers-reduced-data: reduce)' ).matches
	) {
		startButton.hidden = false;
	} else {
		// Once the page itself is shown.
		const idle = window.requestIdleCallback ?? window.setTimeout;
		if ( document.readyState === 'complete' ) {
			idle( start );
		} else {
			window.addEventListener( 'load', () => idle( start ) );
		}
	}
}

/* The condition icon studio, a tiny block editor */

function describe( condition ) {
	const text = condition.replace( /-/g, ' ' );
	return text.charAt( 0 ).toUpperCase() + text.slice( 1 );
}

// A plausible temperature for each condition, day and night.
function temperatureOf( condition, isNight ) {
	const temperatures = [
		[ /thunder/, 22 ],
		[ /freezing|snow/, -2 ],
		[ /showers/, 15 ],
		[ /rain|drizzle/, 12 ],
		[ /fog/, 8 ],
		[ /overcast/, 16 ],
		[ /partly/, 20 ],
		[ /clear/, 24 ],
	];
	const [ , value ] = temperatures.find( ( [ pattern ] ) =>
		pattern.test( condition )
	) ?? [ null, 18 ];
	return isNight ? value - 7 : value;
}

async function initStudio() {
	const studio = document.querySelector( '[data-studio]' );
	const data = await iconsPromise;
	if ( ! studio || ! data ) {
		return;
	}
	const icon = studio.querySelector( '[data-studio-icon]' );
	const temperature = studio.querySelector( '[data-studio-temperature]' );
	const name = studio.querySelector( '[data-studio-condition]' );
	const strip = studio.querySelector( '[data-studio-strip]' );

	// One condition per icon, with its day and night icons.
	const conditions = new Map();
	data.conditionMappings.forEach( ( { condition, dayOrNight, iconSlug } ) => {
		const icons = conditions.get( condition ) ?? { condition };
		if ( dayOrNight === 'all' ) {
			icons.day = iconSlug;
			icons.night = iconSlug;
		} else {
			icons[ dayOrNight ] = iconSlug;
		}
		conditions.set( condition, icons );
	} );
	const seen = new Set();
	const choices = [ ...conditions.values() ].filter( ( { day } ) =>
		seen.has( day ) ? false : seen.add( day )
	);

	let current = choices[ 0 ];
	const isNight = () => studio.dataset.sky === 'night';
	const render = () => {
		const slug = isNight() ? current.night : current.day;
		icon.setAttribute( 'href', `icons.svg#${ slug }` );
		temperature.textContent = String(
			temperatureOf( current.condition, isNight() )
		);
		name.textContent = describe( current.condition );
		buttons.forEach( ( { button, choice } ) =>
			button
				.querySelector( 'use' )
				.setAttribute(
					'href',
					`icons.svg#${ isNight() ? choice.night : choice.day }`
				)
		);
	};

	const buttons = choices.map( ( choice ) => {
		const button = document.createElement( 'button' );
		button.type = 'button';
		button.className = 'studio__choice';
		button.setAttribute( 'aria-label', describe( choice.condition ) );
		button.setAttribute( 'aria-pressed', String( choice === current ) );
		button.append( svgIcon( choice.day ) );
		button.addEventListener( 'click', () => {
			current = choice;
			pressOne(
				buttons.map( ( item ) => item.button ),
				button
			);
			studio.classList.remove( 'is-switching' );
			// Reading the layout restarts the animation.
			void studio.offsetWidth;
			studio.classList.add( 'is-switching' );
			render();
		} );
		return { button, choice };
	} );
	strip.replaceChildren( ...buttons.map( ( { button } ) => button ) );

	const stroke = studio.querySelector( '[data-studio-stroke]' );
	const strokeValue = studio.querySelector( '[data-studio-stroke-value]' );
	stroke.addEventListener( 'input', () => {
		studio.style.setProperty( '--icon-stroke', stroke.value );
		strokeValue.textContent = stroke.value;
	} );
	studio
		.querySelectorAll( 'input[name="studio-color"]' )
		.forEach( ( input ) =>
			input.addEventListener( 'change', () => {
				studio.dataset.color = input.value;
			} )
		);
	const times = [ ...studio.querySelectorAll( '[data-studio-time]' ) ];
	times.forEach( ( button ) =>
		button.addEventListener( 'click', () => {
			studio.dataset.sky = button.dataset.studioTime;
			pressOne( times, button );
			render();
		} )
	);
	render();
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
initStudio();
