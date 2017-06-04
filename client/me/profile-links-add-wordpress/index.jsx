/**
 * External dependencies
 */
import React, { Component } from 'react';
import { localize } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import config from 'config';
import FormButton from 'components/forms/form-button';
import Notice from 'components/notice';
import Site from 'blocks/site';
import sitesFactory from 'lib/sites-list';
import { recordCheckboxEvent, recordClickEvent } from 'me/event-recorder';

const sites = sitesFactory();

class ProfileLinksAddWordPress extends Component {
	// an empty initial state is required to keep render and handleCheckedChange
	// code simpler / easier to maintain
	state = {};

	handleCheckedChanged = ( event ) => {
		const updates = {};
		updates[ event.target.name ] = event.target.checked;
		this.setState( updates );
	};

	onSelect = ( inputName ) => {
		return ( event ) => {
			const updates = {};
			event.preventDefault();
			updates[ inputName ] = ! this.state[ inputName ];
			this.setState( updates );
		};
	};

	getCheckedCount() {
		let checkedCount = 0;
		let inputName;
		for ( inputName in this.state ) {
			if ( this.state[ inputName ] ) {
				checkedCount++;
			}
		}
		return checkedCount;
	}

	onAddableSubmit = ( event ) => {
		const links = [];
		let siteID, site, inputName;

		event.preventDefault();

		for ( inputName in this.state ) {
			if ( 'site-' === inputName.substr( 0, 5 ) && this.state[ inputName ] ) {
				siteID = parseInt( inputName.substr( 5 ), 10 ); // strip leading "site-" from inputName to get siteID
				site = sites.getSite( siteID );
				links.push( {
					title: site.name,
					value: site.URL
				} );
			}
		}

		this.props.userProfileLinks.addProfileLinks( links, this.onSubmitResponse );
	};

	onCancel = ( event ) => {
		event.preventDefault();
		this.props.onCancel();
	};

	onCreateSite = ( event ) => {
		event.preventDefault();
		window.open( config( 'signup_url' ) + '?ref=me-profile-links' );
		this.props.onCancel();
	};

	onJetpackMe = ( event ) => {
		event.preventDefault();
		window.open( 'http://jetpack.me/' );
		this.props.onCancel();
	};

	onSubmitResponse = ( error, data ) => {
		const { translate } = this.props;
		if ( error ) {
			this.setState(
				{
					lastError: translate( 'Unable to add any links right now. Please try again later.' )
				}
			);
			return;
		} else if ( data.malformed ) {
			this.setState(
				{
					lastError: translate( 'An unexpected error occurred. Please try again later.' )
				}
			);
			return;
		} else if ( data.duplicate ) {
			// our links are probably out of date, let's initiate a refresh of our parent
			this.props.userProfileLinks.fetchProfileLinks();
		}

		this.props.onSuccess();
	};

	clearLastError = () => {
		this.setState( {
			lastError: false
		} );
	};

	possiblyRenderError() {
		if ( ! this.state.lastError ) {
			return null;
		}

		return (
			<Notice
				className="profile-links-add-wordpress__error"
				status="is-error"
				onDismissClick={ this.clearLastError }>
				{ this.state.lastError }
			</Notice>
		);
	}

	renderAddableSites() {
		return (
			sites.getPublic().map( ( site ) => {
				const inputName = 'site-' + site.ID;
				const checkedState = this.state[ inputName ];

				if ( this.props.userProfileLinks.isSiteInProfileLinks( site ) ) {
					return null;
				}

				return (
					<li
						key={ site.ID }
						className="profile-links-add-wordpress__item"
						onClick={ recordCheckboxEvent( 'Add WordPress Site' ) }
					>
						<input
							className="profile-links-add-wordpress__checkbox"
							type="checkbox"
							name={ inputName }
							onChange={ this.handleCheckedChanged }
							checked={ checkedState } />
						<Site
							site={ site }
							indicator={ false }
							onSelect={ this.onSelect( inputName ) } />
					</li>
				);
			} )
		);
	}

	renderAddableSitesForm() {
		const { translate } = this.props;
		const checkedCount = this.getCheckedCount();

		return (
			<form className="profile-links-add-wordpress" onSubmit={ this.onAddableSubmit }>
				<p>
					{ translate( 'Please select one or more sites to add to your profile.' ) }
				</p>
				<ul className="profile-links-add-wordpress__list">
					{ this.renderAddableSites() }
				</ul>
				{ this.possiblyRenderError() }
				<FormButton
					disabled={ ( 0 === checkedCount ) ? true : false }
					onClick={ recordClickEvent( 'Add WordPress Sites Button' ) }
				>
					{ translate( 'Add Site', 'Add Sites', { count: checkedCount } ) }
				</FormButton>
				<FormButton
					className="profile-links-add-wordpress__cancel"
					isPrimary={ false }
					onClick={ recordClickEvent( 'Cancel Add WordPress Sites Button', this.onCancel ) }
				>
					{ translate( 'Cancel' ) }
				</FormButton>
			</form>
		);
	}

	renderInvitationForm() {
		const { translate } = this.props;

		return (
			<form>
				<p>
					{
						translate(
							'You have no public sites on WordPress.com yet, but if you like you ' +
							'can create one now. You may also add self-hosted WordPress ' +
							'sites here after installing {{jetpackLink}}Jetpack{{/jetpackLink}} on them.',
							{
								components: {
									jetpackLink: <a
													href="#"
													className="profile-links-add-wordpress__jetpack-link"
													onClick={ recordClickEvent( 'Jetpack Link in Profile Links', this.onJetpackMe ) }
												/>
								}
							}
						)
					}
				</p>
				<FormButton
					onClick={ recordClickEvent( 'Create Sites Button in Profile Links', this.onCreateSite ) }
					>
					{ translate( 'Create Site' ) }
				</FormButton>
				<FormButton
					className="profile-links-add-wordpress__cancel"
					isPrimary={ false }
					onClick={ recordClickEvent( 'Cancel Add WordPress Sites Button', this.onCancel ) }
				>
					{ translate( 'Cancel' ) }
				</FormButton>
			</form>
		);
	}

	render() {
		return (
			<div>
				{ 0 === sites.getPublic().length ? this.renderInvitationForm() : this.renderAddableSitesForm() }
			</div>
		);
	}
}

export default localize( ProfileLinksAddWordPress );
