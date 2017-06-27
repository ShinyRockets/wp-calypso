/**
 * External dependencies
 */
import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { localize } from 'i18n-calypso';
import classNames from 'classnames';

/**
 * Internal dependencies
 */
import FilteredList from 'woocommerce/components/filtered-list';
import FormCheckbox from 'components/forms/form-checkbox';
import FormFieldSet from 'components/forms/form-fieldset';
import FormLabel from 'components/forms/form-label';
import LocationFlag from 'woocommerce/components/location-flag';
import { decodeEntities } from 'lib/formatting';
import { bindActionCreatorsWithSiteId } from 'woocommerce/lib/redux-utils';
import {
	toggleContinentSelected,
	toggleCountrySelected,
} from 'woocommerce/state/ui/shipping/zones/locations/actions';
import {
	getCurrentlyEditingShippingZoneCountries,
} from 'woocommerce/state/ui/shipping/zones/locations/selectors';

const ShippingZoneLocationDialogCountries = ( { continentCountries, translate, actions } ) => {
	const renderCountryLocation = ( location, index ) => {
		const { type, code, name, selected, disabled } = location;
		const isCountry = 'country' === type;

		const onToggle = ( event ) => {
			event.stopPropagation();
			if ( disabled ) {
				return;
			}

			(
				isCountry ? actions.toggleCountrySelected : actions.toggleContinentSelected
			)( code, ! selected );
		};

		const checkboxClass = classNames(
			'shipping-zone__location-dialog-list-item-checkbox',
			{ 'is-country': isCountry }
		);

		const listItemClass = disabled
			? 'shipping-zone__location-dialog-list-item is-disabled' : 'shipping-zone__location-dialog-list-item';

		return (
			<li key={ index } className={ listItemClass } onClick={ onToggle }>
				<FormCheckbox
					onChange={ onToggle }
					className={ checkboxClass }
					checked={ selected }
					disabled={ disabled } />
				{ isCountry ? <LocationFlag code={ code } /> : null }
				<span>{ decodeEntities( name ) }</span>
				{ disabled && (
					<small>{ translate( '(An existing zone covers this location)' ) }</small>
				) }
			</li>
		);
	};

	return (
		<FormFieldSet>
			<FormLabel>{ translate( 'Location' ) }</FormLabel>
			<FilteredList
				items={ continentCountries }
				filterBy="name"
				renderItem={ renderCountryLocation }
				placeholder={ translate( 'Filter by continent or country from the list below' ) } />
		</FormFieldSet>
	);
};

ShippingZoneLocationDialogCountries.propTypes = {
	siteId: PropTypes.number,
};

export default connect(
	( state ) => ( {
		continentCountries: getCurrentlyEditingShippingZoneCountries( state ),
	} ),
	( dispatch, ownProps ) => ( {
		actions: bindActionCreatorsWithSiteId( {
			toggleContinentSelected,
			toggleCountrySelected,
		}, dispatch, ownProps.siteId )
	} )
)( localize( ShippingZoneLocationDialogCountries ) );
