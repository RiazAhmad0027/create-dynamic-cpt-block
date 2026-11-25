document.addEventListener( 'DOMContentLoaded', () => {
	const portfolioBlocks = document.querySelectorAll(
		'.wp-block-dynamic-cpt-block-portfolio-list'
	);

	portfolioBlocks.forEach( ( block ) => {
		const searchInput = block.querySelector( '.dcpb-search-input' );
		const categorySelect = block.querySelector( '.dcpb-category-filter' );
		const sortSelect = block.querySelector( '.dcpb-sort-select' );
		const grid = block.querySelector( '.dcpb-portfolio-grid' );
		const noResults = block.querySelector( '.dcpb-no-results' );
		const prevButton = block.querySelector( '.dcpb-prev-page' );
		const nextButton = block.querySelector( '.dcpb-next-page' );
		const pageInfo = block.querySelector( '.dcpb-page-info' );
		const pagination = block.querySelector( '.dcpb-pagination' );

		const retryButton = document.createElement( 'button' );
		retryButton.type = 'button';
		retryButton.className = 'dcpb-retry-button';
		retryButton.textContent = wp.i18n.__(
			'Retry loading items',
			'dynamic-cpt-block'
		);
		retryButton.hidden = true;

		if ( grid ) {
			grid.insertAdjacentElement( 'afterend', retryButton );
		}
		retryButton.addEventListener( 'click', loadPortfolioPage );

		const apiUrl = block.dataset.apiUrl;
		const postType = block.dataset.postType;
		const itemsPerPage = Math.max(
			1,
			Math.min( 20, parseInt( block.dataset.itemsPerPage, 10 ) || 6 )
		);
		const showImage = block.dataset.showImage !== 'false';
		const showExcerpt = block.dataset.showExcerpt !== 'false';

		let currentPage = 1;
		let totalPages = 1;
		let totalPosts = 0;
		let requestNumber = 0;
		let searchTimer;

		function getSortParameters() {
			const sortOrder = sortSelect ? sortSelect.value : 'newest';
			switch ( sortOrder ) {
				case 'oldest':
					return { orderby: 'date', order: 'ASC' };
				case 'title-asc':
					return { orderby: 'title', order: 'ASC' };
				case 'title-desc':
					return { orderby: 'title', order: 'DESC' };
				case 'newest':
				default:
					return { orderby: 'date', order: 'DESC' };
			}
		}

		function createPortfolioItem( post ) {
			const isSafeUrl = ( value ) => {
				if ( typeof value !== 'string' || ! value.trim() ) {
					return false;
				}
				try {
					const url = new URL( value, window.location.href );
					return [ 'http:', 'https:' ].includes( url.protocol );
				} catch {
					return false;
				}
			};

			const safePermalink = isSafeUrl( post.permalink )
				? post.permalink
				: '#';
			const safeImage = isSafeUrl( post.image ) ? post.image : '';
			const article = document.createElement( 'article' );
			article.className = 'dcpb-portfolio-item';

			if ( showImage && safeImage ) {
				const imageLink = document.createElement( 'a' );
				imageLink.href = safePermalink;
				const image = document.createElement( 'img' );
				image.src = safeImage;
				image.alt = post.title || '';
				image.loading = 'lazy';
				imageLink.appendChild( image );
				article.appendChild( imageLink );
			}

			const heading = document.createElement( 'h3' );
			heading.className = 'dcpb-portfolio-title';
			const titleLink = document.createElement( 'a' );
			titleLink.href = safePermalink;
			titleLink.textContent = post.title || '';
			heading.appendChild( titleLink );
			article.appendChild( heading );

			if ( showExcerpt && post.excerpt ) {
				const excerpt = document.createElement( 'div' );
				excerpt.className = 'dcpb-portfolio-excerpt';
				excerpt.textContent = post.excerpt;
				article.appendChild( excerpt );
			}
			return article;
		}

		function updatePagination( visibleCount ) {
			if ( pageInfo ) {
				const pageMessage = wp.i18n.sprintf(
					// translators: 1: Current page, 2: Total pages, 3: Visible items, 4: Total matching items.
					wp.i18n.__(
						'Page %1$d of %2$d. Showing %3$d of %4$d items.',
						'dynamic-cpt-block'
					),
					currentPage,
					totalPages,
					visibleCount,
					totalPosts
				);
				pageInfo.textContent = pageMessage;
			}
			if ( prevButton ) {
				prevButton.disabled = currentPage <= 1;
			}
			if ( nextButton ) {
				nextButton.disabled = currentPage >= totalPages;
			}
			if ( pagination ) {
				pagination.hidden = totalPosts <= itemsPerPage;
			}
		}

		async function loadPortfolioPage() {
			if ( ! apiUrl || ! postType || ! grid ) {
				return;
			}
			const thisRequest = ++requestNumber;
			const url = new URL( apiUrl, window.location.href );
			const sortParameters = getSortParameters();
			url.searchParams.set( 'post_type', postType );
			url.searchParams.set( 'page', currentPage );
			url.searchParams.set( 'per_page', itemsPerPage );
			url.searchParams.set( 'show_image', showImage ? 'true' : 'false' );
			url.searchParams.set(
				'show_excerpt',
				showExcerpt ? 'true' : 'false'
			);
			url.searchParams.set( 'orderby', sortParameters.orderby );
			url.searchParams.set( 'order', sortParameters.order );
			const searchTerm = searchInput ? searchInput.value.trim() : '';
			const selectedCategory = categorySelect ? categorySelect.value : '';
			if ( searchTerm ) {
				url.searchParams.set( 'search', searchTerm );
			}
			if ( selectedCategory ) {
				url.searchParams.set( 'category', selectedCategory );
			}
			grid.setAttribute( 'aria-busy', 'true' );
			retryButton.hidden = true;
			if ( pageInfo ) {
				pageInfo.textContent = wp.i18n.__(
					'Loading items…',
					'dynamic-cpt-block'
				);
			}
			try {
				const response = await fetch( url.toString() );
				if ( ! response.ok ) {
					throw new Error( 'Unable to load items.' );
				}
				const posts = await response.json();
				if ( thisRequest !== requestNumber ) {
					return;
				}
				totalPosts =
					parseInt( response.headers.get( 'X-WP-Total' ), 10 ) || 0;
				totalPages = Math.max(
					1,
					parseInt( response.headers.get( 'X-WP-TotalPages' ), 10 ) ||
						1
				);
				if ( currentPage > totalPages ) {
					currentPage = totalPages;
					await loadPortfolioPage();
					return;
				}
				grid.replaceChildren();
				posts.forEach( ( post ) => {
					grid.appendChild( createPortfolioItem( post ) );
				} );
				if ( noResults ) {
					noResults.hidden = posts.length > 0;
				}
				updatePagination( posts.length );
			} catch ( error ) {
				if ( thisRequest !== requestNumber ) {
					return;
				}
				grid.replaceChildren();
				if ( noResults ) {
					noResults.hidden = true;
				}
				if ( pageInfo ) {
					pageInfo.textContent = wp.i18n.__(
						'Unable to load items. Please try again.',
						'dynamic-cpt-block'
					);
				}
				if ( pagination ) {
					pagination.hidden = true;
				}
				retryButton.hidden = false;
				// eslint-disable-next-line no-console
				console.error( 'Dynamic CPT Block:', error );
			} finally {
				if ( thisRequest === requestNumber ) {
					grid.setAttribute( 'aria-busy', 'false' );
				}
			}
		}

		function refreshPortfolio() {
			currentPage = 1;
			loadPortfolioPage();
		}

		if ( searchInput ) {
			searchInput.addEventListener( 'input', () => {
				clearTimeout( searchTimer );
				searchTimer = setTimeout( refreshPortfolio, 300 );
			} );
		}
		if ( categorySelect ) {
			categorySelect.addEventListener( 'change', refreshPortfolio );
		}
		if ( sortSelect ) {
			sortSelect.addEventListener( 'change', refreshPortfolio );
		}
		if ( prevButton ) {
			prevButton.addEventListener( 'click', () => {
				if ( currentPage > 1 ) {
					currentPage--;
					loadPortfolioPage();
				}
			} );
		}
		if ( nextButton ) {
			nextButton.addEventListener( 'click', () => {
				if ( currentPage < totalPages ) {
					currentPage++;
					loadPortfolioPage();
				}
			} );
		}
		loadPortfolioPage();
	} );
} );
