/**
 * External dependencies
 */
import classNames from 'classnames';
import { get, map } from 'lodash';
import React, { PropTypes } from 'react';
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import {
	getPostRevision,
	getPostRevisionChanges,
	normalizeForEditing,
} from 'state/posts/revisions/selectors';

const EditorDiffViewer = ( { contentChanges, revision } ) => (
	<div className="editor-diff-viewer">
		<h1 className="editor-diff-viewer__title">
			{ get( revision, 'title' ) }
		</h1>
		{ map( contentChanges, ( change, changeIndex ) => {
			const changeClassNames = classNames( {
				'editor-diff-viewer__additions': change.added,
				'editor-diff-viewer__deletions': change.removed,
			} );
			return (
				<span key={ changeIndex } className={ changeClassNames }>
					{ change.value }
				</span>
			);
		} ) }
	</div>
);

EditorDiffViewer.propTypes = {
	contentChanges: PropTypes.array,
	postId: PropTypes.number,
	revision: PropTypes.object,
	selectedRevisionId: PropTypes.number,
	siteId: PropTypes.number,
};

export default connect(
	( state, ownProps ) => ( {
		contentChanges: getPostRevisionChanges( state, ownProps.siteId, ownProps.postId, ownProps.selectedRevisionId ),
		revision: normalizeForEditing(
			getPostRevision( state, ownProps.siteId, ownProps.postId, ownProps.selectedRevisionId )
		),
	} )
)( EditorDiffViewer );
