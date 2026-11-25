<?php
/**
 * REST API endpoint for Dynamic CPT Block.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Register the Dynamic CPT Block REST API route.
 */
function dcpb_register_rest_routes() {

	register_rest_route(
		'dcpb/v1',
		'/posts',
		array(
			'methods'             => WP_REST_Server::READABLE,
			'callback'            => 'dcpb_get_posts',
			'permission_callback' => '__return_true',
			'args'                => array(
				'post_type' => array(
					'required'          => true,
					'type'              => 'string',
					'sanitize_callback' => 'sanitize_key',
				),
				'show_image' => array(
					'default'           => true,
					'type'              => 'boolean',
					'sanitize_callback' => 'rest_sanitize_boolean',
				),
				'show_excerpt' => array(
					'default'           => true,
					'type'              => 'boolean',
					'sanitize_callback' => 'rest_sanitize_boolean',
				),
				'page' => array(
					'default'           => 1,
					'type'              => 'integer',
					'sanitize_callback' => 'absint',
				),
				'per_page' => array(
					'default'           => 6,
					'type'              => 'integer',
					'sanitize_callback' => 'absint',
				),
				'search' => array(
					'type'              => 'string',
					'sanitize_callback' => 'sanitize_text_field',
				),
				'category' => array(
					'type'              => 'integer',
					'sanitize_callback' => 'absint',
				),
				'orderby' => array(
					'default'           => 'date',
					'type'              => 'string',
					'sanitize_callback' => 'sanitize_key',
					'enum'              => array( 'date', 'title' ),
				),
				'order'   => array(
					'default'           => 'DESC',
					'type'              => 'string',
					'sanitize_callback' => function ( $value ) {
						return strtoupper( sanitize_text_field( $value ) );
					},
					'enum'              => array( 'ASC', 'DESC' ),
				),
			),
		)
	);
}
add_action( 'rest_api_init', 'dcpb_register_rest_routes' );

/**
 * Retrieve paginated posts for the block.
 *
 * @param WP_REST_Request $request REST API request.
 * @return WP_REST_Response|WP_Error Posts response or validation error.
 */
function dcpb_get_posts( WP_REST_Request $request ) {

	$post_type        = $request->get_param( 'post_type' );
	$post_type_object = get_post_type_object( $post_type );

	$show_image   = $request->get_param( 'show_image' );
	$show_excerpt = $request->get_param( 'show_excerpt' );

	// Validate the requested post type.
	if (
		! $post_type_object ||
		! $post_type_object->public ||
		! $post_type_object->publicly_queryable
	) {
		return new WP_Error(
			'dcpb_invalid_post_type',
			__( 'Invalid post type.', 'dynamic-cpt-block' ),
			array( 'status' => 400 )
		);
	}

	// Validate pagination values.
	$page     = max( 1, absint( $request->get_param( 'page' ) ) );
	$per_page = min( 20, max( 1, absint( $request->get_param( 'per_page' ) ) ) );

	// Validate sorting parameters.
	$allowed_orderby = array( 'date', 'title' );
	$orderby         = $request->get_param( 'orderby' );

	if ( ! in_array( $orderby, $allowed_orderby, true ) ) {
		$orderby = 'date';
	}

	$order = strtoupper( $request->get_param( 'order' ) );
	$order = in_array( $order, array( 'ASC', 'DESC' ), true ) ? $order : 'DESC';

	// Prepare the database query.
	$query_args = array(
		'post_type'              => $post_type,
		'post_status'            => 'publish',
		'has_password'           => false,
		'posts_per_page'         => $per_page,
		'paged'                  => $page,
		'orderby'                => $orderby,
		'order'                  => $order,
		'update_post_term_cache' => false,
	);

	// Apply search filtering.
	$search = $request->get_param( 'search' );

	if ( ! empty( $search ) ) {
		$search = sanitize_text_field( $search );

		if ( function_exists( 'mb_substr' ) ) {
			$search = mb_substr( $search, 0, 100 );
		} else {
			$search = substr( $search, 0, 100 );
		}

		$query_args['s'] = $search;
	}

	// Validate and apply category filtering.
	$category = absint( $request->get_param( 'category' ) );

	if ( $category ) {

		if ( ! is_object_in_taxonomy( $post_type, 'category' ) ) {
			return new WP_Error(
				'dcpb_invalid_category',
				__( 'This post type does not support categories.', 'dynamic-cpt-block' ),
				array( 'status' => 400 )
			);
		}

		$category_term = get_term( $category, 'category' );

		if ( ! $category_term || is_wp_error( $category_term ) ) {
			return new WP_Error(
				'dcpb_invalid_category',
				__( 'Invalid category.', 'dynamic-cpt-block' ),
				array( 'status' => 400 )
			);
		}

		$query_args['cat'] = $category;
	}

	$query = new WP_Query( $query_args );

	$posts = array();

	// Prepare the API response.
	foreach ( $query->posts as $post ) {

		$posts[] = array(
			'id'        => $post->ID,
			'title'     => get_the_title( $post ),
			'excerpt'   => $show_excerpt
				? wp_strip_all_tags( get_the_excerpt( $post ) )
				: '',
			'permalink' => get_permalink( $post ),
			'date'      => get_the_date( 'c', $post ),
			'image'     => $show_image
				? ( get_the_post_thumbnail_url( $post, 'large' ) ?: '' )
				: '',
		);
	}

	// Return posts with pagination headers.
	$response = rest_ensure_response( $posts );

	$response->header( 'X-WP-Total', (int) $query->found_posts );
	$response->header( 'X-WP-TotalPages', (int) $query->max_num_pages );

	return $response;
}
