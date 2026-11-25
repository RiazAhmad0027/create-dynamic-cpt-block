<?php
/**
 * Plugin Name: Dynamic CPT Block
 * Description: A dynamic Gutenberg block for displaying custom post types.
 * Version: 1.0.0
 * Requires at least: 6.3
 * Author: Riaz Ahmad
 * License: GPL-2.0-or-later
 * Text Domain: dynamic-cpt-block
 * Domain Path: /languages
 */
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

require_once plugin_dir_path( __FILE__ ) . 'includes/rest-api.php';

/**
 * Render the portfolio block on the frontend.
 *
 * @param array $attributes Block attributes.
 * @return string Rendered block HTML.
 */
function dcpb_render_portfolio_block( $attributes ) {

	$post_type = isset( $attributes['postType'] )
		? sanitize_key( $attributes['postType'] )
		: 'portfolio';

	$posts_per_page = isset( $attributes['postsPerPage'] )
		? absint( $attributes['postsPerPage'] )
		: 6;

	$columns = isset( $attributes['columns'] )
		? absint( $attributes['columns'] )
		: 3;

	$show_image          = isset( $attributes['showImage'] ) ? (bool) $attributes['showImage'] : true;
	$show_excerpt        = isset( $attributes['showExcerpt'] ) ? (bool) $attributes['showExcerpt'] : true;
	$show_sort           = isset( $attributes['showSort'] ) ? (bool) $attributes['showSort'] : true;
	$show_search         = isset( $attributes['showSearch'] ) ? (bool) $attributes['showSearch'] : true;
	$show_category_filter = isset( $attributes['showCategoryFilter'] ) ? (bool) $attributes['showCategoryFilter'] : true;

	$posts_per_page = min( 20, max( 1, $posts_per_page ) );
	$columns        = min( 4, max( 1, $columns ) );

	$post_type_object = get_post_type_object( $post_type );

	// Validate the requested post type.
	if (
		! $post_type_object ||
		! $post_type_object->public ||
		! $post_type_object->publicly_queryable
	) {
		return '';
	}

	$has_category_taxonomy = is_object_in_taxonomy( $post_type, 'category' );

	$portfolio_categories = $has_category_taxonomy
		? get_terms(
			array(
				'taxonomy'   => 'category',
				'hide_empty' => true,
			)
		)
		: array();

	wp_enqueue_script( 'dcpb-frontend' );

	ob_start();
	?>

	<div <?php
		echo get_block_wrapper_attributes( // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- WordPress core escapes the wrapper attributes.
			array(
				'data-items-per-page' => $posts_per_page,
				'data-post-type'      => $post_type,
				'data-api-url'        => rest_url( 'dcpb/v1/posts' ),
				'data-show-image'     => $show_image ? 'true' : 'false',
				'data-show-excerpt'   => $show_excerpt ? 'true' : 'false',
			)
		);
	?>>

		<div class="dcpb-portfolio-filters">

			<?php if ( $show_search ) : ?>
				<input
					type="search"
					class="dcpb-search-input"
					placeholder="<?php echo esc_attr__( 'Search items...', 'dynamic-cpt-block' ); ?>"
					aria-label="<?php echo esc_attr__( 'Search items', 'dynamic-cpt-block' ); ?>"
				/>
			<?php endif; ?>

			<?php if ( $show_category_filter && $has_category_taxonomy ) : ?>
				<select
					class="dcpb-category-filter"
					aria-label="<?php echo esc_attr__( 'Filter items by category', 'dynamic-cpt-block' ); ?>"
				>
					<option value="">
						<?php echo esc_html__( 'All Categories', 'dynamic-cpt-block' ); ?>
					</option>

					<?php if ( ! is_wp_error( $portfolio_categories ) ) : ?>
						<?php foreach ( $portfolio_categories as $category ) : ?>
							<option value="<?php echo esc_attr( $category->term_id ); ?>">
								<?php echo esc_html( $category->name ); ?>
							</option>
						<?php endforeach; ?>
					<?php endif; ?>
				</select>
			<?php endif; ?>

			<?php if ( $show_sort ) : ?>
				<select
					class="dcpb-sort-select"
					aria-label="<?php echo esc_attr__( 'Sort items', 'dynamic-cpt-block' ); ?>"
				>
					<option value="newest">
						<?php echo esc_html__( 'Newest First', 'dynamic-cpt-block' ); ?>
					</option>
					<option value="oldest">
						<?php echo esc_html__( 'Oldest First', 'dynamic-cpt-block' ); ?>
					</option>
					<option value="title-asc">
						<?php echo esc_html__( 'Title A–Z', 'dynamic-cpt-block' ); ?>
					</option>
					<option value="title-desc">
						<?php echo esc_html__( 'Title Z–A', 'dynamic-cpt-block' ); ?>
					</option>
				</select>
			<?php endif; ?>

		</div>

		<div
			class="dcpb-portfolio-grid"
			style="--dcpb-columns: <?php echo esc_attr( $columns ); ?>;"
			aria-live="polite"
		></div>

		<p
			class="dcpb-no-results"
			role="status"
			aria-live="polite"
			aria-atomic="true"
			hidden
		>
			<?php echo esc_html__( 'No matching items found.', 'dynamic-cpt-block' ); ?>
		</p>

		<nav
			class="dcpb-pagination"
			aria-label="<?php echo esc_attr__( 'Items pagination', 'dynamic-cpt-block' ); ?>"
		>
			<button type="button" class="dcpb-prev-page" disabled>
				<?php echo esc_html__( 'Previous', 'dynamic-cpt-block' ); ?>
			</button>

			<span class="dcpb-page-info" aria-live="polite">
				<?php echo esc_html__( 'Page 1', 'dynamic-cpt-block' ); ?>
			</span>

			<button type="button" class="dcpb-next-page">
				<?php echo esc_html__( 'Next', 'dynamic-cpt-block' ); ?>
			</button>
		</nav>

	</div>

	<?php

	return ob_get_clean();
}

/**
 * Register the frontend JavaScript and Gutenberg block.
 */
function dcpb_register_blocks() {

	$frontend_script_path = plugin_dir_path( __FILE__ ) . 'assets/js/frontend.js';

	$frontend_script_version = file_exists( $frontend_script_path )
		? (string) filemtime( $frontend_script_path )
		: '1.0.0';

	wp_register_script(
		'dcpb-frontend',
		plugin_dir_url( __FILE__ ) . 'assets/js/frontend.js',
		array( 'wp-i18n' ),
		$frontend_script_version,
		true
	);
	wp_set_script_translations(
		'dcpb-frontend',
		'dynamic-cpt-block',
		plugin_dir_path( __FILE__ ) . 'languages'
	);

	$block_path = plugin_dir_path( __FILE__ ) . 'build';

	if ( file_exists( $block_path . '/block.json' ) ) {
		register_block_type(
			$block_path,
			array(
				'render_callback' => 'dcpb_render_portfolio_block',
			)
		);
	}
}

add_action( 'init', 'dcpb_register_blocks' );
