/**
 * The presentation site: the live report of the hero (Open-Meteo, straight
 * from the browser), the icon grid (icons.json), the screenshot tabs and the
 * Playground demo (blueprint.json, the WordPress.org Live Preview blueprint,
 * with the plugin zip of the site in place of the WordPress.org slug).
 */

// WMO weather codes, as ElioBlocks\Weather\Condition\WmoConditionCodes.
const WMO_CONDITIONS = {
	0: 'clear-sky',
	1: 'mainly-clear',
	2: 'partly-cloudy',
	3: 'overcast',
	45: 'fog',
	48: 'depositing-rime-fog',
	51: 'light-drizzle',
	53: 'moderate-drizzle',
	55: 'dense-drizzle',
	56: 'light-freezing-drizzle',
	57: 'dense-freezing-drizzle',
	61: 'slight-rain',
	63: 'moderate-rain',
	65: 'heavy-rain',
	66: 'light-freezing-rain',
	67: 'heavy-freezing-rain',
	71: 'slight-snowfall',
	73: 'moderate-snowfall',
	75: 'heavy-snowfall',
	77: 'snow-grains',
	80: 'slight-rain-showers',
	81: 'moderate-rain-showers',
	82: 'violent-rain-showers',
	85: 'slight-snow-showers',
	86: 'heavy-snow-showers',
	95: 'thunderstorm',
	96: 'thunderstorm-with-slight-hail',
	99: 'thunderstorm-with-heavy-hail',
};

const SCREENSHOTS = {
	1: 'The Weather block in the Block Editor, with an hourly forecast and its location settings.',
	2: 'A daily forecast on the front end.',
	3: 'Start blank and choose a layout for the Weather block.',
	4: 'Search for a location by name.',
	5: 'The General section of the settings page: units and data refresh.',
};

const iconsPromise = fetch( 'icons.json' )
	.then( ( response ) => response.json() )
	.catch( () => null );

function svgIcon( slug, className = 'icon' ) {
	const svg = document.createElementNS( 'http://www.w3.org/2000/svg', 'svg' );
	svg.setAttribute( 'class', className );
	svg.setAttribute( 'aria-hidden', 'true' );
	const use = document.createElementNS( 'http://www.w3.org/2000/svg', 'use' );
	use.setAttribute( 'href', `icons.svg#${ slug }` );
	svg.append( use );
	return svg;
}

/* Icon grid */

async function initIconGrid() {
	const grid = document.querySelector( '[data-icon-grid]' );
	const data = await iconsPromise;
	if ( ! grid || ! data ) {
		return;
	}
	const items = data.icons.map( ( { slug, label } ) => {
		const item = document.createElement( 'li' );
		item.title = label;
		item.append( svgIcon( slug ) );
		const name = document.createElement( 'span' );
		name.className = 'screen-reader-text';
		name.textContent = label;
		item.append( name );
		return item;
	} );
	grid.replaceChildren( ...items );
}

/* Live report */

function conditionIcon( mappings, condition, isDay ) {
	const dayOrNight = isDay ? 'day' : 'night';
	const mapping =
		mappings.find(
			( entry ) =>
				entry.condition === condition && entry.dayOrNight === dayOrNight
		) ?? mappings.find( ( entry ) => entry.condition === condition );
	return mapping?.iconSlug ?? 'cloud-question-mark';
}

function describe( condition ) {
	const text = condition.replace( /-/g, ' ' );
	return text.charAt( 0 ).toUpperCase() + text.slice( 1 );
}

function temperature( value ) {
	return `${ Number( value.toFixed( 1 ) ) }°C`;
}

// "2026-09-30T14:00", in the timezone of the location.
function hour( isoLocal ) {
	const hours = Number( isoLocal.slice( 11, 13 ) );
	return `${ hours % 12 || 12 } ${ hours < 12 ? 'am' : 'pm' }`;
}

function coordinates( latitude, longitude ) {
	const part = ( value, positive, negative ) => {
		const absolute = Math.abs( value );
		let degrees = Math.floor( absolute );
		let minutes = Math.round( ( absolute - degrees ) * 60 );
		if ( minutes === 60 ) {
			degrees += 1;
			minutes = 0;
		}
		return `${ degrees }°${ String( minutes ).padStart( 2, '0' ) }′${
			value >= 0 ? positive : negative
		}`;
	};
	return `${ part( latitude, 'N', 'S' ) }\u2002${ part( longitude, 'E', 'W' ) }`;
}

// Open-Meteo answers a 503 now and then: one more try after a second.
async function fetchForecast( url, signal ) {
	const response = await fetch( url, { signal } );
	if ( response.status < 500 ) {
		return response;
	}
	await new Promise( ( resolve ) => setTimeout( resolve, 1000 ) );
	return fetch( url, { signal } );
}

let reportRequest = null;

async function showWeather( button ) {
	const report = document.querySelector( '.report' );
	const field = ( name ) =>
		document.querySelector( `[data-weather="${ name }"]` );
	const status = document.querySelector( '[data-weather-status]' );
	const { city, lat, lon } = button.dataset;

	document.querySelectorAll( '.city' ).forEach( ( other ) => {
		other.setAttribute( 'aria-pressed', String( other === button ) );
	} );

	reportRequest?.abort();
	const controller = new AbortController();
	reportRequest = controller;
	report.classList.add( 'is-loading' );

	const query = new URLSearchParams( {
		latitude: lat,
		longitude: lon,
		current: 'temperature_2m,weather_code,is_day',
		hourly: 'temperature_2m,weather_code,is_day',
		forecast_hours: '5',
		timezone: 'auto',
	} );

	try {
		const [ response, icons ] = await Promise.all( [
			fetchForecast(
				`https://api.open-meteo.com/v1/forecast?${ query }`,
				controller.signal
			),
			iconsPromise,
		] );
		if ( ! response.ok || ! icons ) {
			throw new Error( 'Weather unavailable' );
		}
		const data = await response.json();
		const mappings = icons.conditionMappings;
		const { current, hourly } = data;
		const condition = WMO_CONDITIONS[ current.weather_code ] ?? 'overcast';

		field( 'location' ).textContent = city;
		field( 'coordinates' ).textContent = coordinates(
			Number( lat ),
			Number( lon )
		);
		field( 'temperature' ).textContent = String(
			Number( current.temperature_2m.toFixed( 1 ) )
		);
		field( 'icon' ).setAttribute(
			'href',
			`icons.svg#${ conditionIcon( mappings, condition, current.is_day ) }`
		);
		field( 'description' ).textContent = describe( condition );
		report.dataset.sky = current.is_day ? 'day' : 'night';
		status.textContent = `${ city }: ${ temperature(
			current.temperature_2m
		) }, ${ describe( condition ).toLowerCase() }.`;

		const rows = [
			{
				label: 'Now',
				code: current.weather_code,
				isDay: current.is_day,
				value: current.temperature_2m,
			},
			...hourly.time.slice( 1, 5 ).map( ( time, index ) => ( {
				label: hour( time ),
				code: hourly.weather_code[ index + 1 ],
				isDay: hourly.is_day[ index + 1 ],
				value: hourly.temperature_2m[ index + 1 ],
			} ) ),
		];
		field( 'hours' ).replaceChildren(
			...rows.map( ( row ) => {
				const item = document.createElement( 'li' );
				const label = document.createElement( 'span' );
				label.textContent = row.label;
				const value = document.createElement( 'span' );
				value.textContent = temperature( row.value );
				item.append(
					label,
					svgIcon(
						conditionIcon(
							mappings,
							WMO_CONDITIONS[ row.code ] ?? 'overcast',
							row.isDay
						)
					),
					value
				);
				return item;
			} )
		);
	} catch ( error ) {
		if ( error.name === 'AbortError' ) {
			return;
		}
		// The sample report stays; only the name follows the button.
		field( 'location' ).textContent = city;
	}
	report.classList.remove( 'is-loading' );
}

function initReport() {
	const buttons = document.querySelectorAll( '.city' );
	buttons.forEach( ( button ) => {
		button.addEventListener( 'click', () => showWeather( button ) );
	} );
	if ( buttons[ 0 ] ) {
		showWeather( buttons[ 0 ] );
	}
}

/* Screenshots, then the live demo, in one set of tabs */

function isPhone() {
	return window.matchMedia( '(max-width: 860px)' ).matches;
}

async function playgroundUrl() {
	const blueprint = await fetch( 'blueprint.json' ).then( ( response ) =>
		response.json()
	);
	// Until the plugin is on WordPress.org, Playground installs the zip the
	// deploy workflow puts next to this page (GitHub Pages allows CORS).
	delete blueprint.plugins;
	blueprint.steps = [
		{
			step: 'installPlugin',
			pluginData: {
				resource: 'url',
				url: new URL( 'elio-blocks.zip', document.baseURI ).href,
			},
		},
		...( blueprint.steps ?? [] ),
	];
	return `https://playground.wordpress.net/#${ encodeURIComponent(
		JSON.stringify( blueprint )
	) }`;
}

function initDemo() {
	const tabs = [ ...document.querySelectorAll( '[role="tab"]' ) ];
	const panel = document.getElementById( 'shot' );
	const image = panel?.querySelector( '.window__image' );
	const live = panel?.querySelector( '[data-playground]' );
	if ( ! image || ! live ) {
		return;
	}
	const caption = document.querySelector( '[data-shot-caption]' );
	const liveTab = tabs.find( ( tab ) => tab.dataset.shot === 'live' );
	const urlPromise = playgroundUrl().catch( () => null );

	urlPromise.then( ( url ) => {
		if ( url ) {
			document
				.querySelectorAll( '[data-playground-new-tab]' )
				.forEach( ( link ) => ( link.href = url ) );
		}
	} );

	const start = async () => {
		const url = await urlPromise;
		if ( ! url || live.querySelector( 'iframe' ) ) {
			return;
		}
		// A phone gets the whole screen.
		if ( isPhone() ) {
			window.open( url, '_blank', 'noopener' );
			return;
		}
		const iframe = document.createElement( 'iframe' );
		iframe.src = url;
		iframe.title = 'Elio Blocks in WordPress Playground';
		iframe.allow = 'clipboard-read; clipboard-write';
		live.replaceChildren( iframe );
	};

	const select = ( tab ) => {
		const number = tab.dataset.shot;
		tabs.forEach( ( other ) => {
			const selected = other === tab;
			other.setAttribute( 'aria-selected', String( selected ) );
			other.tabIndex = selected ? 0 : -1;
		} );
		panel.setAttribute( 'aria-labelledby', tab.id );

		if ( number === 'live' ) {
			live.hidden = false;
			caption.textContent =
				'A whole WordPress site, running in your browser.';
			return;
		}
		live.hidden = true;
		image.classList.add( 'is-changing' );
		const next = new window.Image();
		next.src = `assets/wporg/screenshot-${ number }.png`;
		next.decode()
			.catch( () => {} )
			.then( () => {
				image.src = next.src;
				image.alt = SCREENSHOTS[ number ];
				image.width = next.naturalWidth || image.width;
				image.height = next.naturalHeight || image.height;
				caption.textContent = SCREENSHOTS[ number ];
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

	live.querySelector( '[data-playground-start]' )?.addEventListener(
		'click',
		start
	);

	// "Try it live" links: the demo tab, started.
	document
		.querySelectorAll(
			'a[data-playground-link]:not([data-playground-new-tab])'
		)
		.forEach( ( link ) =>
			link.addEventListener( 'click', () => {
				select( liveTab );
				start();
			} )
		);
}

/* Icon settings, as in the block inspector */

function initIconControls() {
	const grid = document.querySelector( '[data-icon-grid]' );
	if ( ! grid ) {
		return;
	}
	document
		.querySelectorAll( '[data-icon-stroke]' )
		.forEach( ( input ) =>
			input.addEventListener( 'change', () =>
				grid.style.setProperty( '--icon-stroke', input.value )
			)
		);
	document.querySelectorAll( '[data-icon-color]' ).forEach( ( input ) =>
		input.addEventListener( 'change', () => {
			grid.dataset.color = input.value;
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
initIconGrid();
initIconControls();
initReport();
initDemo();
