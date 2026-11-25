import { useEffect, useState } from '@wordpress/element';
import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import {
	PanelBody,
	RangeControl,
	ToggleControl,
	Spinner,
	Notice,
	SelectControl,
} from '@wordpress/components';
import apiFetch from '@wordpress/api-fetch';

export default function Edit( { attributes, setAttributes } ) {
	const {
		postType,
		postsPerPage,
		columns,
		showImage,
		showExcerpt,
		showSort,
		showSearch,
		showCategoryFilter,
	} = attributes;

	const [ posts, setPosts ] = useState( [] );
	const [ postTypes, setPostTypes ] = useState( [] );
	const [ loading, setLoading ] = useState( true );
	const [ error, setError ] = useState( '' );

	useEffect( () => {
		let isMounted = true;
		apiFetch( { path: '/wp/v2/types' } )
			.then( ( types ) => {
				if ( ! isMounted ) {
					return;
				}
				const availablePostTypes = Object.values( types )
					.filter(
						( type ) =>
							type.slug &&
							type.rest_base &&
							! [
								'attachment',
								'wp_block',
								'elementskit_template',
							].includes( type.slug )
					)
					.map( ( type ) => ( {
						label: type.name.trim(),
						value: type.slug,
						restBase: type.rest_base,
					} ) );
				setPostTypes( availablePostTypes );
				const currentTypeExists = availablePostTypes.some(
					( type ) => type.value === postType
				);
				if ( ! currentTypeExists ) {
					const defaultType = availablePostTypes.find(
						( type ) => type.value === 'portfolio'
					);
					setAttributes( {
						postType: defaultType ? defaultType.value : '',
					} );
				}
			} )
			.catch( () => {
				if ( isMounted ) {
					setError( 'Unable to load available post types.' );
					setLoading( false );
				}
			} );
		return () => {
			isMounted = false;
		};
	}, [ postType, setAttributes ] );

	useEffect( () => {
		let isMounted = true;
		const selectedPostType = postTypes.find(
			( type ) => type.value === postType
		);
		if ( ! selectedPostType ) {
			setPosts( [] );
			if ( postTypes.length > 0 ) {
				setLoading( false );
			}
			return undefined;
		}
		setLoading( true );
		setError( '' );
		apiFetch( {
			path: `/wp/v2/${ selectedPostType.restBase }?per_page=${ postsPerPage }&_embed`,
		} )
			.then( ( data ) => {
				if ( isMounted ) {
					setPosts( data );
					setLoading( false );
				}
			} )
			.catch( () => {
				if ( isMounted ) {
					setError( 'Unable to load entries.' );
					setLoading( false );
				}
			} );
		return () => {
			isMounted = false;
		};
	}, [ postType, postsPerPage, postTypes ] );

	const blockProps = useBlockProps();
	return (
		<>
			<InspectorControls>
				<PanelBody title="Portfolio Settings">
					<SelectControl
						label="Post Type"
						value={ postType }
						options={ [
							{ label: 'Select a post type', value: '' },
							...postTypes.map( ( type ) => ( {
								label: type.label,
								value: type.value,
							} ) ),
						] }
						onChange={ ( value ) =>
							setAttributes( { postType: value } )
						}
					/>
					<RangeControl
						label="Number of Posts"
						value={ postsPerPage }
						min={ 1 }
						max={ 20 }
						onChange={ ( value ) =>
							setAttributes( { postsPerPage: value } )
						}
					/>
					<RangeControl
						label="Columns"
						value={ columns }
						min={ 1 }
						max={ 4 }
						onChange={ ( value ) =>
							setAttributes( { columns: value } )
						}
					/>
					<ToggleControl
						label="Show Featured Image"
						checked={ showImage }
						onChange={ ( value ) =>
							setAttributes( { showImage: value } )
						}
					/>
					<ToggleControl
						label="Show Excerpt"
						checked={ showExcerpt }
						onChange={ ( value ) =>
							setAttributes( { showExcerpt: value } )
						}
					/>
					<ToggleControl
						label="Show Sorting Dropdown"
						checked={ showSort }
						onChange={ ( value ) =>
							setAttributes( { showSort: value } )
						}
					/>
					<ToggleControl
						label="Show Search Field"
						checked={ showSearch }
						onChange={ ( value ) =>
							setAttributes( { showSearch: value } )
						}
					/>
					<ToggleControl
						label="Show Category Filter"
						checked={ showCategoryFilter }
						onChange={ ( value ) =>
							setAttributes( { showCategoryFilter: value } )
						}
					/>
				</PanelBody>
			</InspectorControls>
			<div { ...blockProps }>
				<h3>Dynamic Portfolio</h3>
				{ loading && <Spinner /> }
				{ error && (
					<Notice status="error" isDismissible={ false }>
						{ error }
					</Notice>
				) }
				{ ! loading && ! error && posts.length === 0 && (
					<p>No entries found.</p>
				) }
				<div
					style={ {
						display: 'grid',
						gridTemplateColumns: `repeat(${ columns }, minmax(0, 1fr))`,
						gap: '20px',
					} }
				>
					{ posts.map( ( post ) => {
						const image =
							post._embedded?.[ 'wp:featuredmedia' ]?.[ 0 ]
								?.source_url;
						return (
							<article key={ post.id }>
								{ showImage && image && (
									<img
										src={ image }
										alt=""
										style={ {
											width: '100%',
											height: 'auto',
										} }
									/>
								) }
								<h4
									dangerouslySetInnerHTML={ {
										__html:
											post.title?.rendered ||
											post.slug ||
											'Untitled',
									} }
								/>
								{ showExcerpt && post.excerpt?.rendered && (
									<div
										dangerouslySetInnerHTML={ {
											__html: post.excerpt.rendered,
										} }
									/>
								) }
							</article>
						);
					} ) }
				</div>
			</div>
		</>
	);
}
