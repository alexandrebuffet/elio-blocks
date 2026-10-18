---
title: Condition icon collections
sidebar_label: Icon collections
---

The Condition Icon block shows the icon of the weather condition from a collection: the Elio icons of the plugin, or a collection registered by a theme or a plugin. Each Weather block, or the whole site, chooses its collection; a block shows no icon for a condition its collection does not represent.

## Register a collection

Register the collection, then its icons, on the [`elio_blocks_init`](../reference/hooks.md#elio_blocks_init) action:

```php
add_action( 'elio_blocks_init', function () {
	elio_blocks_register_condition_icon_collection(
		'my-theme',
		array(
			'label'        => __( 'My Theme', 'my-theme' ),
			'description'  => __( 'Weather icons drawn for My Theme.', 'my-theme' ),
			'stroke_width' => 1.5,
		)
	);

	elio_blocks_register_condition_icon(
		'my-theme/sun',
		array(
			'file_path'  => get_theme_file_path( 'icons/sun.svg' ),
			'label'      => __( 'Sun', 'my-theme' ),
			'style'      => 'stroke',
			'conditions' => array(
				array( 'clear-sky', 'day' ),
				array( 'mainly-clear', 'day' ),
			),
		)
	);
} );
```

- An icon is named `collection/icon`, and its SVG is a file (`file_path`, read when the icon is first shown) or markup (`content`).
- A `stroke` icon is drawn with the stroke width of its collection, which a Condition Icon block can change; a `fill` icon (the default) is not.
- `conditions` lists the conditions the icon represents, each a pair of a condition slug and `day`, `night` or `all`. The slugs are the ones of the WMO weather codes, in [`WmoConditionCodes`](https://github.com/alexandrebuffet/elio-blocks/blob/main/includes/Weather/Condition/WmoConditionCodes.php): `clear-sky`, `mainly-clear`, `partly-cloudy`, `overcast`, `fog`, `slight-rain`, `thunderstorm`…

The settings page previews each collection by six of its icons: clear day, clouds, clear night, rain, snow and thunderstorm.

See [`elio_blocks_register_condition_icon_collection()`](../reference/functions.md#elio_blocks_register_condition_icon_collection) and [`elio_blocks_register_condition_icon()`](../reference/functions.md#elio_blocks_register_condition_icon) for every argument.

## Icons for the rest of the site

On WordPress 7.1 and later, the Elio icons are also an icon collection of WordPress itself: the Icon block and `wp_get_icon()` can use them anywhere on the site, under the same names (`elio/sun`).
