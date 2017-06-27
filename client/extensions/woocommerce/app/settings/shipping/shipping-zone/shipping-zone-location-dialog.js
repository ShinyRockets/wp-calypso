/**
 * External dependencies
 */
import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { localize } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import Dialog from 'components/dialog';
import ShippingZoneLocationDialogCountries from './shipping-zone-location-dialog-countries';
import ShippingZoneLocationDialogSettings from './shipping-zone-location-dialog-settings';
import { bindActionCreatorsWithSiteId } from 'woocommerce/lib/redux-utils';
import {
	closeEditLocations,
	cancelEditLocations,
} from 'woocommerce/state/ui/shipping/zones/locations/actions';
import { isEditLocationsModalOpen } from 'woocommerce/state/ui/shipping/zones/locations/selectors';

const ShippingZoneLocationDialog = ( { siteId, isVisible, translate, actions, onChange } ) => {
	if ( ! isVisible ) {
		return null;
	}

	const onCancel = () => ( actions.cancelEditLocations() );
	const onClose = () => {
		onChange();
		actions.closeEditLocations();
	};

	const buttons = [
		{ action: 'cancel', label: translate( 'Cancel' ) },
		{ action: 'add', label: translate( 'Save' ), onClick: onClose, isPrimary: true },
	];

	return (
		<Dialog
			additionalClassNames="shipping-zone__location-dialog woocommerce"
			isVisible={ isVisible }
			buttons={ buttons }
			onClose={ onCancel } >
			<div className="shipping-zone__location-dialog-header">
				{ translate( 'Edit location' ) }
			</div>
			<ShippingZoneLocationDialogCountries siteId={ siteId } />
			<ShippingZoneLocationDialogSettings siteId={ siteId } />
		</Dialog>
	);
};

ShippingZoneLocationDialog.propTypes = {
	siteId: PropTypes.number,
	onChange: PropTypes.func.isRequired,
};

export default connect(
	( state ) => ( {
		isVisible: isEditLocationsModalOpen( state ),
	} ),
	( dispatch, ownProps ) => ( {
		actions: bindActionCreatorsWithSiteId( {
			closeEditLocations,
			cancelEditLocations,
		}, dispatch, ownProps.siteId ),
	} )
)( localize( ShippingZoneLocationDialog ) );
