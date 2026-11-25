# Dynamic CPT Block

A dynamic Gutenberg block for displaying custom post types with search, category filtering, sorting, and pagination.

## Description

Dynamic CPT Block is a Gutenberg block that displays published posts from a selected public custom post type in a responsive grid layout.

It provides frontend search, category filtering, sorting, and pagination controls, with configurable display options in the Gutenberg editor.

## Features

- Display posts from public custom post types.
- Configure the number of posts displayed per page.
- Choose the number of grid columns.
- Show or hide featured images and post excerpts.
- Enable or disable search.
- Filter items by WordPress categories.
- Sort posts by newest, oldest, title A–Z, and title Z–A.
- Responsive grid for desktop, tablet, and mobile.
- Server-side pagination.
- Keyboard-accessible controls and visible focus indicators.

## Installation

1. Upload the `dynamic-cpt-block` folder to `/wp-content/plugins/`.
2. Activate the plugin through the WordPress Plugins menu.
3. Open a page or post in the Gutenberg editor.
4. Insert the Dynamic CPT Block and configure its settings.

## Development

The plugin uses `@wordpress/scripts`.

```bash
npm install --include=dev
npm run build
npm run lint:js
npm run lint:css
```

## License

GPL-2.0-or-later. See [GNU GPL v2](https://www.gnu.org/licenses/old-licenses/gpl-2.0.html).
