/**
 * External dependencies
 */
import React, { Component, PropTypes } from 'react';
import { localize } from 'i18n-calypso';
import classNames from 'classnames';

/**
 * Internal dependencies
 */
import Gridicon from 'gridicons';
import FoldableCard from 'components/foldable-card';
import EllipsisMenu from 'components/ellipsis-menu';
import PopoverMenuItem from 'components/popover/menu-item';
import Gravatar from 'components/gravatar';

class ActivityLogItem extends Component {

	static propTypes = {
		allowRestore: PropTypes.bool.isRequired,
		siteId: PropTypes.number.isRequired,
		timestamp: PropTypes.number.isRequired,
		requestRestore: PropTypes.func.isRequired,
		title: PropTypes.string,
		subTitle: PropTypes.string,
		className: PropTypes.string,
		icon: PropTypes.string,
		status: PropTypes.oneOf( [ 'is-success', 'is-warning', 'is-error', 'is-info' ] ),
		user: PropTypes.object,
		actionText: PropTypes.string,
		description: PropTypes.string,
		siteOffset: PropTypes.func.isRequired,
	};

	static defaultProps = {
		allowRestore: true,
		status: 'is-info',
		icon: 'info-outline'
	};

	handleClickRestore = () => {
		const {
			requestRestore,
			timestamp,
		} = this.props;
		requestRestore( timestamp );
	};

	getTime() {
		const {
			moment,
			timestamp,
			siteOffset,
		} = this.props;

		return (
			<div className="activity-log-item__time">
				{ siteOffset( moment( timestamp ) ).format( 'LT' ) }
			</div>
		);
	}

	getIcon() {
		const {
			icon,
			status
		} = this.props;

		const classes = classNames(
			'activity-log-item__icon',
			status
		);

		return (
			<div className={ classes }>
				<Gridicon icon={ icon } size={ 24 } />
			</div>
		);
	}

	getActor() {
		const {
			user
		} = this.props;

		if ( ! user ) {
			return null;
		}

		return (
			<div className="activity-log-item__actor">
				<Gravatar user={ user } size={ 48 } />
				<div className="activity-log-item__actor-info">
					<div className="activity-log-item__actor-name">{ user.name }</div>
					<div className="activity-log-item__actor-role">{ user.role }</div>
				</div>
			</div>
		);
	}

	getContent() {
		const {
			title,
			subTitle
		} = this.props;

		return (
			<div className="activity-log-item__content">
				<div className="activity-log-item__content-title">{ title }</div>
				{ subTitle && <div className="activity-log-item__content-sub-title">{ subTitle }</div> }
			</div>
		);
	}

	getSummary() {
		const {
			allowRestore,
			translate,
		} = this.props;

		if ( ! allowRestore ) {
			return null;
		}

		return (
			<div className="activity-log-item__action">
				<EllipsisMenu position="bottom right">
					<PopoverMenuItem onClick={ this.handleClickRestore } icon="undo">
						{ translate( 'Rewind to this point' ) }
					</PopoverMenuItem>
				</EllipsisMenu>
			</div>
		);
	}

	getHeader() {
		return (
			<div className="activity-log-item__card-header">
				{ this.getActor() }
				{ this.getContent() }
			</div>
		);
	}

	render() {
		const {
			className,
			description
		} = this.props;

		const classes = classNames(
			'activity-log-item',
			className
		);
		return (
			<div className={ classes } >
				<div className="activity-log-item__type">
					{ this.getTime() }
					{ this.getIcon() }
				</div>
				<FoldableCard
					className="activity-log-item__card"
					header={ this.getHeader() }
					summary={ this.getSummary() }
					expandedSummary={ this.getSummary() }
					clickableHeader={ true }
				>
					{ description }
				</FoldableCard>
			</div>
		);
	}
}

export default localize( ActivityLogItem );
