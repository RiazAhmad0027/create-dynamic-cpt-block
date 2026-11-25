=== Dynamic CPT Block ===
Contributors: riazahmad2211
Tags: gutenberg, custom-post-types, portfolio, blocks, filtering
Requires at least: 6.3
Tested up to: 7.1
Stable tag: 1.0.0
License: GPL-2.0-or-later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

A dynamic Gutenberg block for displaying custom post types with search, category filtering, sorting, and pagination.

== Description ==

Dynamic CPT Block is a Gutenberg block that displays published posts from a selected public custom post type in a responsive grid layout.

It provides frontend search, category filtering, sorting, and pagination controls, with configurable display options in the Gutenberg editor.

== Features ==

* Display posts from public custom post types.
* Configure posts per page and grid columns.
* Show or hide featured images and excerpts.
* Enable or disable search.
* Filter items by WordPress categories.
* Sort by newest, oldest, title A–Z, and title Z–A.
* Responsive desktop, tablet, and mobile grid.
* Server-side pagination.
* Keyboard-accessible controls and visible focus indicators.

== Installation ==

1. Upload the dynamic-cpt-block folder to /wp-content/plugins/.
2. Activate the plugin through the Plugins menu in WordPress.
3. Open a page or post in the Gutenberg editor.
4. Insert the Dynamic CPT Block.
5. Configure the post type and display settings.

== Usage ==

Select Dynamic CPT Block in the Gutenberg editor and configure its available settings. The selected custom post type must be public and contain published posts. The category filter is available when the selected post type supports the standard WordPress category taxonomy.

== Frequently Asked Questions ==

= Which post types can I display? =

You can display public custom post types that are publicly queryable and contain published posts.

= Why is the category filter unavailable? =

The selected post type must support the standard WordPress category taxonomy.

= Does the plugin support search and pagination? =

Yes. Visitors can search published items, sort results, and navigate paginated results.

== Changelog ==

= 1.0.0 =
* Initial release with dynamic post type selection, search, category filtering, sorting, pagination, responsive layout, and configurable display options.

== License ==

GPL-2.0-or-later.
https://www.gnu.org/licenses/gpl-2.0.html
