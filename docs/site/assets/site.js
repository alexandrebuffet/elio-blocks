/**
 * The presentation site: the live demo of the hero (WordPress Playground in
 * one window, the editor and the front end of one site in two tabs), the rain
 * on the window of the front end band, the menu following the scroll and the
 * scroll reveals.
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
// in sight.
const HERO_SETUP = `<?php
require '/wordpress/wp-load.php';
wp_mkdir_p( WPMU_PLUGIN_DIR );
file_put_contents( WPMU_PLUGIN_DIR . '/elio-demo-toolbar.php', "<?php add_filter( 'show_admin_bar', '__return_false' );\\n" );
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
	const snackbar = live.querySelector( '[data-live-snackbar]' );
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
		// The notice has said its piece once the visitor uses the demo.
		if ( changed && live.classList.contains( 'is-live' ) ) {
			snackbar.classList.add( 'is-dismissed' );
		}
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
			await client.runPHP( playground, { code: HERO_SETUP } );
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
		// Once the page itself is shown.
		const idle = window.requestIdleCallback ?? window.setTimeout;
		if ( document.readyState === 'complete' ) {
			idle( start );
		} else {
			window.addEventListener( 'load', () => idle( start ) );
		}
	}
}

/* Rain on the window of the front end band */

// A canvas as wide as the band, in CSS pixels, at a density the page can draw
// every frame.
function sizeCanvas( canvas ) {
	const ratio = Math.min( window.devicePixelRatio || 1, 1.5 );
	const width = canvas.clientWidth;
	const height = canvas.clientHeight;
	const layer = ( target = document.createElement( 'canvas' ) ) => {
		target.width = Math.round( width * ratio );
		target.height = Math.round( height * ratio );
		const context = target.getContext( '2d' );
		context.setTransform( ratio, 0, 0, ratio, 0, 0 );
		return { canvas: target, context };
	};
	return { width, height, ratio, layer };
}

// Frosted glass evens out the scene behind it: the shadows lifted and the
// highlights held back, the colors saturated, once, on the few pixels of the
// small copy.
function frost( canvas ) {
	const context = canvas.getContext( '2d' );
	const image = context.getImageData( 0, 0, canvas.width, canvas.height );
	const { data } = image;
	const lift = Array.from(
		{ length: 256 },
		( _, value ) =>
			255 * Math.pow( value / 255, 0.7 ) * ( 1 - 0.2 * ( value / 255 ) )
	);
	for ( let i = 0; i < data.length; i += 4 ) {
		const red = lift[ data[ i ] ];
		const green = lift[ data[ i + 1 ] ];
		const blue = lift[ data[ i + 2 ] ];
		const luma = 0.2126 * red + 0.7152 * green + 0.0722 * blue;
		data[ i ] = luma + ( red - luma ) * 1.9;
		data[ i + 1 ] = luma + ( green - luma ) * 1.9;
		data[ i + 2 ] = luma + ( blue - luma ) * 1.9;
	}
	context.putImageData( image, 0, 0 );
}

// The photo covering the band, blurred by drawing it small then large, frosted,
// and veiled with the color of the band so the text stays readable.
function glassLayer( size, photo, veil, blur, alpha ) {
	const small = document.createElement( 'canvas' );
	small.width = Math.max( 1, Math.round( size.width / blur ) );
	small.height = Math.max( 1, Math.round( size.height / blur ) );
	const scale = Math.max(
		small.width / photo.naturalWidth,
		small.height / photo.naturalHeight
	);
	small
		.getContext( '2d', { willReadFrequently: true } )
		.drawImage(
			photo,
			( small.width - photo.naturalWidth * scale ) / 2,
			( small.height - photo.naturalHeight * scale ) / 2,
			photo.naturalWidth * scale,
			photo.naturalHeight * scale
		);
	frost( small );
	const { canvas, context } = size.layer();
	context.imageSmoothingQuality = 'high';
	context.drawImage( small, 0, 0, size.width, size.height );
	context.globalAlpha = alpha;
	context.fillStyle = veil;
	context.fillRect( 0, 0, size.width, size.height );
	return canvas;
}

// The shading of a drop, drawn once: a darker rim, the light from above
// caught at its top and focused at its bottom.
function dropShade() {
	const canvas = document.createElement( 'canvas' );
	canvas.width = canvas.height = 64;
	const context = canvas.getContext( '2d' );
	const rim = context.createRadialGradient( 32, 30, 16, 32, 32, 32 );
	rim.addColorStop( 0, 'rgb(0 0 0 / 0%)' );
	rim.addColorStop( 0.7, 'rgb(0 0 0 / 10%)' );
	rim.addColorStop( 0.92, 'rgb(0 0 0 / 40%)' );
	rim.addColorStop( 1, 'rgb(0 0 0 / 60%)' );
	context.fillStyle = rim;
	context.fillRect( 0, 0, 64, 64 );
	const light = context.createRadialGradient( 22, 18, 0, 22, 18, 8 );
	light.addColorStop( 0, 'rgb(255 255 255 / 85%)' );
	light.addColorStop( 1, 'rgb(255 255 255 / 0%)' );
	context.fillStyle = light;
	context.fillRect( 0, 0, 64, 64 );
	const caustic = context.createRadialGradient( 32, 54, 0, 32, 54, 14 );
	caustic.addColorStop( 0, 'rgb(255 255 255 / 35%)' );
	caustic.addColorStop( 1, 'rgb(255 255 255 / 0%)' );
	context.fillStyle = caustic;
	context.fillRect( 0, 0, 64, 64 );
	context.globalCompositeOperation = 'destination-in';
	context.beginPath();
	context.arc( 32, 32, 32, 0, Math.PI * 2 );
	context.fill();
	return canvas;
}

function initRain() {
	const canvas = document.querySelector( '[data-rain]' );
	if ( ! canvas || ! canvas.getContext ) {
		return;
	}
	const band = canvas.parentElement;
	const still = window.matchMedia( '(prefers-reduced-motion: reduce)' );
	const shade = dropShade();
	const photo = new window.Image();
	let size, context, glass, lens, lensPattern, mist, drops;
	let visible = false;
	let frame = 0;
	let last = 0;

	// A drop is a lens: it shows the scene behind it upside down and smaller,
	// sharp where the glass around it is fogged.
	const drawDrop = ( target, x, y, r, stretch = 1 ) => {
		const k = 4;
		lensPattern.setTransform(
			new window.DOMMatrix( [
				-1 / ( size.ratio * k ),
				0,
				0,
				-1 / ( size.ratio * k ),
				x * ( 1 + 1 / k ),
				y * ( 1 + 1 / k ),
			] )
		);
		const ry = r * stretch;
		target.fillStyle = 'rgb(0 0 0 / 22%)';
		target.beginPath();
		target.ellipse( x, y + r * 0.2, r, ry, 0, 0, Math.PI * 2 );
		target.fill();
		target.fillStyle = lensPattern;
		target.beginPath();
		target.ellipse( x, y, r, ry, 0, 0, Math.PI * 2 );
		target.fill();
		target.drawImage( shade, x - r, y - ry, r * 2, ry * 2 );
	};

	const random = ( min, max ) => min + Math.random() * ( max - min );
	// The share a random number falls in, the last taking the rest.
	const pick = ( shares ) => {
		let value = Math.random();
		const index = shares.findIndex( ( share ) => ( value -= share ) < 0 );
		return index === -1 ? shares.length : index;
	};

	// The fine mist of droplets the sliding drops wipe away.
	const mistDroplets = ( count ) => {
		mist.context.globalAlpha = 0.35;
		for ( let i = 0; i < count; i++ ) {
			drawDrop(
				mist.context,
				random( 0, size.width ),
				random( 0, size.height ),
				random( 0.6, 1.8 )
			);
		}
		mist.context.globalAlpha = 1;
	};

	const newDrop = ( y = random( 0, size.height ) ) => ( {
		x: random( 0, size.width ),
		y,
		r: [ random( 2, 5 ), random( 5, 10 ), random( 10, 18 ) ][
			pick( [ 0.6, 0.3 ] )
		],
		speed: 0,
		trail: 0,
	} );

	const build = () => {
		size = sizeCanvas( canvas );
		if ( ! size.width || ! size.height ) {
			return false;
		}
		const styles = window.getComputedStyle( band );
		const veil = styles.getPropertyValue( '--band' ).trim();
		context = size.layer( canvas ).context;
		glass = glassLayer( size, photo, veil, 24, 0.55 );
		lens = glassLayer( size, photo, veil, 3, 0.25 );
		lensPattern = context.createPattern( lens, 'no-repeat' );
		mist = size.layer();
		mistDroplets( Math.round( ( size.width * size.height ) / 1400 ) );
		const count = Math.round( ( size.width * size.height ) / 9000 );
		drops = Array.from( { length: count }, () => newDrop() );
		return true;
	};

	const step = ( time ) => {
		const delta = Math.min( 3, ( time - last ) / 16.7 || 1 );
		last = time;
		const max = Math.round( ( size.width * size.height ) / 9000 );
		if ( drops.length < max && Math.random() < 0.6 * delta ) {
			drops.push( newDrop() );
		}
		if ( Math.random() < 0.5 * delta ) {
			mistDroplets( 1 );
		}
		mist.context.globalCompositeOperation = 'destination-out';
		for ( const drop of drops ) {
			// Big enough, a drop runs down in fits and starts.
			if ( drop.r > 9 && ( drop.speed || Math.random() < 0.003 ) ) {
				drop.speed = Math.min(
					drop.r * 0.35,
					drop.speed + drop.r * 0.01 * delta
				);
				if ( Math.random() < 0.03 ) {
					drop.speed *= 0.2;
				}
				drop.y += drop.speed * delta;
				drop.x += random( -0.3, 0.3 ) * drop.speed * 0.2;
				mist.context.beginPath();
				mist.context.arc(
					drop.x,
					drop.y,
					drop.r * 0.9,
					0,
					Math.PI * 2
				);
				mist.context.fill();
				drop.trail += drop.speed * delta;
				// Leaving a bead of water behind it now and then.
				if ( drop.trail > drop.r * 2.5 && drop.r > 4 ) {
					drop.trail = random( -2, 0 ) * drop.r;
					drops.push( {
						x: drop.x + random( -1, 1 ),
						y: drop.y - drop.r * 1.2,
						r: drop.r * random( 0.2, 0.35 ),
						speed: 0,
						trail: 0,
					} );
					drop.r *= 0.985;
				}
			}
		}
		mist.context.globalCompositeOperation = 'source-over';
		// A running drop takes in the smaller ones in its way.
		for ( const drop of drops ) {
			if ( ! drop.speed || drop.gone ) {
				continue;
			}
			for ( const other of drops ) {
				if (
					other === drop ||
					other.gone ||
					other.r > drop.r ||
					Math.hypot( other.x - drop.x, other.y - drop.y ) >
						( drop.r + other.r ) * 0.8
				) {
					continue;
				}
				other.gone = true;
				drop.r = Math.min(
					24,
					Math.sqrt( drop.r * drop.r + other.r * other.r * 0.8 )
				);
			}
		}
		drops = drops.filter(
			( drop ) => ! drop.gone && drop.y - drop.r < size.height
		);
	};

	const draw = () => {
		context.clearRect( 0, 0, size.width, size.height );
		context.drawImage( glass, 0, 0, size.width, size.height );
		context.drawImage( mist.canvas, 0, 0, size.width, size.height );
		for ( const drop of drops ) {
			drawDrop(
				context,
				drop.x,
				drop.y,
				drop.r,
				1 + Math.min( 0.3, drop.speed * 0.08 )
			);
		}
	};

	const loop = ( time ) => {
		frame = 0;
		if ( ! visible || document.hidden ) {
			return;
		}
		step( time );
		draw();
		frame = window.requestAnimationFrame( loop );
	};

	const play = () => {
		if ( still.matches ) {
			draw();
		} else if ( ! frame ) {
			last = performance.now();
			frame = window.requestAnimationFrame( loop );
		}
	};

	const start = () => {
		if ( ! build() ) {
			return;
		}
		draw();
		new window.IntersectionObserver( ( [ entry ] ) => {
			visible = entry.isIntersecting;
			if ( visible ) {
				play();
			}
		} ).observe( band );
		document.addEventListener( 'visibilitychange', () => {
			if ( visible && ! document.hidden ) {
				play();
			}
		} );
		let width = size.width;
		new window.ResizeObserver( () => {
			// The height follows the text: only a new width redraws the rain.
			if ( canvas.clientWidth !== width && build() ) {
				width = size.width;
				draw();
			}
		} ).observe( band );
	};

	// The photo is loaded once the band comes near.
	new window.IntersectionObserver(
		( [ entry ], observer ) => {
			if ( ! entry.isIntersecting ) {
				return;
			}
			observer.disconnect();
			photo.addEventListener( 'load', start, { once: true } );
			photo.src = 'assets/images/clouds-1000.jpg';
		},
		{ rootMargin: '600px 0px' }
	).observe( band );
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
initRain();
