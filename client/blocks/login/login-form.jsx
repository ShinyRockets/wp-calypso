/**
 * External dependencies
 */
import classNames from 'classnames';
import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import { localize } from 'i18n-calypso';
import { capitalize } from 'lodash';

/**
 * Internal dependencies
 */
import config from 'config';
import FormsButton from 'components/forms/form-button';
import FormInputValidation from 'components/forms/form-input-validation';
import Card from 'components/card';
import FormPasswordInput from 'components/forms/form-password-input';
import FormTextInput from 'components/forms/form-text-input';
import FormCheckbox from 'components/forms/form-checkbox';
import { getCurrentQueryArguments } from 'state/ui/selectors';
import { loginUser } from 'state/login/actions';
import { recordTracksEvent } from 'state/analytics/actions';
import { isRequesting, getRequestError } from 'state/login/selectors';
import SocialLoginForm from './social';

export class LoginForm extends Component {
	static propTypes = {
		isRequesting: PropTypes.bool.isRequired,
		loginError: PropTypes.string,
		loginUser: PropTypes.func.isRequired,
		onSuccess: PropTypes.func.isRequired,
		redirectTo: PropTypes.string,
		requestError: PropTypes.object,
		translate: PropTypes.func.isRequired,
	};

	state = {
		usernameOrEmail: '',
		password: '',
		rememberMe: false,
		linkingSocialUser: false,
		linkingSocialService: '',
	};

	onChangeField = ( event ) => {
		this.setState( {
			[ event.target.name ]: event.target.value
		} );
	};

	onChangeRememberMe = ( event ) => {
		const { name, checked } = event.target;

		this.props.recordTracksEvent( 'calypso_login_block_remember_me_click', { new_value: checked } );

		this.setState( { [ name ]: checked } );
	};

	onSubmitForm = ( event ) => {
		event.preventDefault();

		const { password, rememberMe, usernameOrEmail } = this.state;
		const { onSuccess, redirectTo } = this.props;

		this.props.recordTracksEvent( 'calypso_login_block_login_form_submit' );

		this.props.loginUser( usernameOrEmail, password, rememberMe, redirectTo ).then( () => {
			this.props.recordTracksEvent( 'calypso_login_block_login_form_success' );

			onSuccess();
		} ).catch( error => {
			this.props.recordTracksEvent( 'calypso_login_block_login_form_failure', {
				error_code: error.code,
				error_message: error.message
			} );
		} );
	};

	linkSocialUser = ( service, usernameOrEmail ) => {
		this.setState( {
			usernameOrEmail: usernameOrEmail,
			linkingSocialUser: true,
			linkingSocialService: capitalize( service ),
		} );
	};

	render() {
		const isDisabled = {};
		if ( this.props.isRequesting ) {
			isDisabled.disabled = true;
		}

		const { requestError } = this.props;

		return (
			<form onSubmit={ this.onSubmitForm } method="post">
				<Card className="login__form">
					<div className="login__form-userdata">
						{ this.state.linkingSocialUser && (
							<div className="login__form-link-social-notice">
								<p>
									{ this.props.translate( 'We found a WordPress.com account with the email address "%(email)s".' +
										'To connect this account to your %(service)s account, please enter your password.', {
											args: {
												email: this.state.usernameOrEmail,
												service: this.state.linkingSocialService,
											}
										}
									) }
								</p>
								<p>
									{ this.props.translate( 'You will be able to user your %(service)s account to ' +
										'log in to WordPress.com in the future.', {
											args: {
												service: this.state.linkingSocialService,
											}
										}
									) }
								</p>
							</div>
						) }
						<label htmlFor="usernameOrEmail" className="login__form-userdata-username">
							{ this.props.translate( 'Username or Email Address' ) }
						</label>

						<FormTextInput
							autoCapitalize="off"
							autoFocus
							className={
								classNames( 'login__form-userdata-username-input', {
									'is-error': requestError && requestError.field === 'usernameOrEmail'
								} )
							}
							onChange={ this.onChangeField }
							id="usernameOrEmail"
							name="usernameOrEmail"
							value={ this.state.usernameOrEmail }
							{ ...isDisabled } />

						{ requestError && requestError.field === 'usernameOrEmail' && (
							<FormInputValidation isError text={ requestError.message } />
						) }

						<label htmlFor="password" className="login__form-userdata-username">
							{ this.props.translate( 'Password' ) }
						</label>

						<FormPasswordInput
							autoCapitalize="off"
							autoComplete="off"
							className={
								classNames( 'login__form-userdata-username-password', {
									'is-error': requestError && requestError.field === 'password'
								} )
							}
							onChange={ this.onChangeField }
							id="password"
							name="password"
							value={ this.state.password }
							{ ...isDisabled } />

						{ requestError && requestError.field === 'password' && (
							<FormInputValidation isError text={ requestError.message } />
						) }
					</div>

					<div className="login__form-remember-me">
						<label>
							<FormCheckbox
								name="rememberMe"
								checked={ this.state.rememberMe }
								onChange={ this.onChangeRememberMe }
								{ ...isDisabled } />
							<span>{ this.props.translate( 'Keep me logged in' ) }</span>
						</label>
					</div>

					<div className="login__form-action">
						<FormsButton primary { ...isDisabled }>
							{ this.props.translate( 'Log In' ) }
						</FormsButton>
					</div>
				</Card>
				{ config.isEnabled( 'signup/social' ) && (
					<Card>
						<div className="login__form-social">
							<SocialLoginForm onSuccess={ this.props.onSuccess } linkSocialUser={ this.linkSocialUser } />
						</div>
					</Card>
				) }
			</form>
		);
	}
}

export default connect(
	( state ) => ( {
		redirectTo: getCurrentQueryArguments( state ).redirect_to,
		isRequesting: isRequesting( state ),
		requestError: getRequestError( state ),
	} ),
	{
		loginUser,
		recordTracksEvent,
	}
)( localize( LoginForm ) );
