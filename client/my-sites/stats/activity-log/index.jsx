/**
 * External dependencies
 */
import React, { Component, PropTypes } from 'react';
import debugFactory from 'debug';
import { connect } from 'react-redux';
import { localize } from 'i18n-calypso';
import { groupBy, map, get, filter } from 'lodash';

/**
 * Internal dependencies
 */
import Main from 'components/main';
import { getSelectedSiteId } from 'state/ui/selectors';
import {
	getSiteSlug,
	getSiteTitle,
	isJetpackSite,
} from 'state/sites/selectors';
import StatsFirstView from '../stats-first-view';
import SidebarNavigation from 'my-sites/sidebar-navigation';
import StatsNavigation from '../stats-navigation';
import ActivityLogConfirmDialog from '../activity-log-confirm-dialog';
import ActivityLogDay from '../activity-log-day';
import ActivityLogBanner from '../activity-log-banner';
import ErrorBanner from '../activity-log-banner/error-banner';
import ProgressBanner from '../activity-log-banner/progress-banner';
import SuccessBanner from '../activity-log-banner/success-banner';
import QueryRewindStatus from 'components/data/query-rewind-status';
import QueryActivityLog from 'components/data/query-activity-log';
// For site time offset
import QuerySiteSettings from 'components/data/query-site-settings';
import DatePicker from 'my-sites/stats/stats-date-picker';
import StatsPeriodNavigation from 'my-sites/stats/stats-period-navigation';
import { recordGoogleEvent } from 'state/analytics/actions';
import ActivityLogRewindToggle from './activity-log-rewind-toggle';
import { rewindRestore as rewindRestoreAction } from 'state/activity-log/actions';
import {
	getRewindStatusError,
	getActivityLogs,
	getRestoreProgress,
	isRewindActive as isRewindActiveSelector,
	getSiteGmtOffset,
	getSiteTimezoneValue,
} from 'state/selectors';

const debug = debugFactory( 'calypso:activity-log' );

class ActivityLog extends Component {
	static propTypes = {
		isJetpack: PropTypes.bool,
		restoreProgress: PropTypes.shape( {
			errorCode: PropTypes.string.isRequired,
			failureReason: PropTypes.string.isRequired,
			message: PropTypes.string.isRequired,
			percent: PropTypes.number.isRequired,
			restoreId: PropTypes.number,
			status: PropTypes.oneOf( [
				'finished',
				'queued',
				'running',

				// These are other VP restore statuses.
				// We should _never_ see them for Activity Log rewinds
				// 'aborted',
				// 'fail',
				// 'success',
				// 'success-with-errors',
			] ).isRequired,
			timestamp: PropTypes.number.isRequired,
		} ),
		rewindStatusError: PropTypes.shape( {
			error: PropTypes.string.isRequired,
			message: PropTypes.string.isRequired,
		} ),
		siteId: PropTypes.number,
		siteTitle: PropTypes.string,
		slug: PropTypes.string,

		// FIXME: Testing only
		isPressable: PropTypes.bool,

		// localize
		moment: PropTypes.func.isRequired,
		translate: PropTypes.func.isRequired,
	};

	state = {
		requestedRestoreTimestamp: null,
		showRestoreConfirmDialog: false,
	};

	componentDidMount() {
		window.scrollTo( 0, 0 );
	}

	handleRequestRestore = ( requestedRestoreTimestamp ) => {
		this.setState( {
			requestedRestoreTimestamp,
			showRestoreConfirmDialog: true,
		} );
	};

	handleRestoreDialogClose = () => this.setState( { showRestoreConfirmDialog: false } );

	handleRestoreDialogConfirm = () => {
		const {
			rewindRestore,
			siteId,
		} = this.props;

		const { requestedRestoreTimestamp } = this.state;

		debug( 'Restore requested for site %d to time %d', this.props.siteId, requestedRestoreTimestamp );
		this.setState( { showRestoreConfirmDialog: false } );
		rewindRestore( siteId, requestedRestoreTimestamp );
	};

	update_logs( log ) {
		const { translate } = this.props;
		switch ( log.type ) {
			// Scans
			case 'security_threat_found':
				log.subTitle = translate( 'Security Threat Found!' );
				log.icon = 'notice';
				log.actionText = translate( 'Fix it' );
				break;
			// Backups
			case 'site_backed_up':
				log.subTitle = translate( 'Site Backed up' );
				log.icon = 'checkmark';
				log.status = 'is-success';
				log.actionText = 'Restore';
				break;
			// Backups
			case 'site_backed_up_failed':
				log.subTitle = translate( 'Site Backed up' );
				log.icon = 'notice';
				log.actionText = 'Fix';
				log.status = 'is-error';
				break;
			// Plugins
			case 'plugin_activated':
				log.subTitle = translate( 'Plugin Activated' );
				log.icon = 'plugins';
				log.actionText = 'Deactivate';
				break;
			case 'plugin_deactivated':
				log.subTitle = translate( 'Plugin Deactivated' );
				log.icon = 'plugins';
				log.actionText = 'Activate';
				break;
			case 'plugin_needs_update':
				log.subTitle = translate( 'Plugin Update Available' );
				log.icon = 'plugins';
				log.status = 'is-warning';
				log.actionText = 'Update';
				break;
			case 'suspicious_code':
				log.subTitle = translate( 'Security Scan' );
				log.icon = 'notice';
				log.status = 'is-error';
				log.actionText = 'Fix';
				break;
			case 'plugin_updated':
				log.subTitle = translate( 'Plugin Updated' );
				log.icon = 'plugins';
				log.actionText = 'Revert';
				break;

			// Themes
			case 'theme_switched':
				log.subTitle = translate( 'Theme Activated' );
				log.icon = 'themes';
				log.actionText = 'Revert';
				break;
			case 'theme_updated':
				log.subTitle = translate( 'Theme Updated' );
				log.icon = 'themes';
				log.actionText = 'Revert';
				break;
			// Plans
			case 'plan_updated':
				log.subTitle = translate( 'Plan' );
				log.icon = 'clipboard';
				log.actionText = 'Cancel';
				break;
			case 'plan_renewed':
				log.subTitle = translate( 'Plan Renewed' );
				log.icon = 'clipboard';
				break;
			// Jetpack Modules
			case 'activate_jetpack_feature':
				log.subTitle = translate( 'Jetpack' );
				log.icon = 'cog';
				log.actionText = 'Deactivate';
				break;
			case 'deactivate_jetpack_feature':
				log.subTitle = translate( 'Jetpack' );
				log.icon = 'cog';
				log.actionText = 'Activate';
				break;
		}

		return log;
	}

	getSiteOffsetFunc() {
		const { timezone, gmtOffset } = this.props;
		return ( moment ) => {
			if ( timezone ) {
				return moment.tz( timezone );
			}
			if ( gmtOffset ) {
				return moment.offset( timezone );
			}
			return moment;
		};
	}

	renderBanner() {
		const { restoreProgress } = this.props;

		if ( ! restoreProgress ) {
			return null;
		}

		const {
			errorCode,
			failureReason,
			percent,
			status,
			siteTitle,
			timestamp,
		} = restoreProgress;

		if ( status === 'finished' ) {
			return ( errorCode
				? (
					<ErrorBanner
						errorCode={ errorCode }
						failureReason={ failureReason }
						requestRestore={ this.handleRequestRestore }
						siteTitle={ siteTitle }
						timestamp={ timestamp }
					/>
				) : (
					<SuccessBanner
						timestamp={ timestamp }
					/>
				)
			);
		}
		return (
			<ProgressBanner
				percent={ percent }
				status={ status }
				timestamp={ timestamp }
			/>
		);
	}

	renderErrorMessage() {
		const {
			isPressable,
			rewindStatusError,
			translate,
		} = this.props;

		// Do not match null
		// FIXME: This is for internal testing
		if ( false === isPressable ) {
			return (
				<ActivityLogBanner status="info" icon={ null } >
					{ translate( 'Rewind is currently only available for Pressable sites' ) }
				</ActivityLogBanner>
			);
		}

		if ( rewindStatusError ) {
			return (
				<ActivityLogBanner status="error" icon={ null } >
					{ translate( 'Rewind error: %s', { args: rewindStatusError.message } ) }
					<br />
					{ translate( 'Do you have an appropriate plan?' ) }
				</ActivityLogBanner>
			);
		}
	}

	renderContent() {
		const {
			isPressable,
			isRewindActive,
			logs,
			moment,
			siteId,
			slug,
			startDate,
		} = this.props;

		const siteOffset = this.getSiteOffsetFunc();

		const startOfMonthMs = siteOffset( moment( startDate ).startOf( 'month' ) ).valueOf();
		const endOfMonthMs = siteOffset( moment( startDate ).endOf( 'month' ) ).valueOf();

		const filteredLogs = filter( logs, obj => startOfMonthMs <= obj.ts_utc && obj.ts_utc <= endOfMonthMs );
		const logsGroupedByDay = map(
			groupBy(
				filteredLogs.map( this.update_logs, this ),
				log => siteOffset( moment( log.ts_utc ) ).startOf( 'day' ).format( 'x' )
			),
			( daily_logs, timestamp ) => (
				<ActivityLogDay
					allowRestore={ !! isPressable }
					isRewindActive={ isRewindActive }
					key={ timestamp }
					logs={ daily_logs }
					requestRestore={ this.handleRequestRestore }
					siteId={ siteId }
					timestamp={ +timestamp }
					siteOffset={ siteOffset }
				/>
			)
		);

		const startOfMonth = moment( startDate ).startOf( 'month' );
		const query = {
			period: 'month',
			date: startOfMonth.format( 'YYYY-MM-DD' )
		};

		return (
			<div>
				<StatsPeriodNavigation
					period="month"
					date={ startOfMonth }
					url={ `/stats/activity/${ slug }` }
					recordGoogleEvent={ this.changePeriod }
				>
					<DatePicker
						isActivity={ true }
						period="month"
						date={ startOfMonth }
						query={ query }
					/>
				</StatsPeriodNavigation>
				{ this.renderBanner() }
				{ ! isRewindActive && !! isPressable && <ActivityLogRewindToggle siteId={ siteId } /> }
				<section className="activity-log__wrapper">
					{ logsGroupedByDay }
				</section>
			</div>
		);
	}

	render() {
		const {
			isJetpack,
			siteId,
			siteTitle,
			slug,
		} = this.props;
		const {
			requestedRestoreTimestamp,
			showRestoreConfirmDialog,
		} = this.state;

		return (
			<Main wideLayout>
				<QueryRewindStatus siteId={ siteId } />
				<QueryActivityLog siteId={ siteId } />
				<QuerySiteSettings siteId={ siteId } />
				<StatsFirstView />
				<SidebarNavigation />
				<StatsNavigation
					isJetpack={ isJetpack }
					slug={ slug }
					section="activity"
				/>
				{ this.renderErrorMessage() }
				{ this.renderContent() }
				<ActivityLogConfirmDialog
					isVisible={ showRestoreConfirmDialog }
					siteTitle={ siteTitle }
					timestamp={ requestedRestoreTimestamp }
					onClose={ this.handleRestoreDialogClose }
					onConfirm={ this.handleRestoreDialogConfirm }
				/>
			</Main>
		);
	}
}

export default connect(
	( state ) => {
		const siteId = getSelectedSiteId( state );

		return {
			isJetpack: isJetpackSite( state, siteId ),
			logs: getActivityLogs( state, siteId ),
			siteId,
			siteTitle: getSiteTitle( state, siteId ),
			slug: getSiteSlug( state, siteId ),
			rewindStatusError: getRewindStatusError( state, siteId ),
			restoreProgress: getRestoreProgress( state, siteId ),
			isRewindActive: isRewindActiveSelector( state, siteId ),

			// FIXME: Testing only
			isPressable: get( state.activityLog.rewindStatus, [ siteId, 'isPressable' ], null ),
			timezone: getSiteTimezoneValue( state, siteId ),
			gmtOffset: getSiteGmtOffset( state, siteId ) || 0,
		};
	}, {
		recordGoogleEvent,
		rewindRestore: rewindRestoreAction,
	}
)( localize( ActivityLog ) );
