/**
 * External dependencies
 */
import { expect } from 'chai';

/**
 * Internal dependencies
 */
import { hasJetpackSites } from '../';

describe( 'hasJetpackSites()', () => {
	it( 'it should return false if sites are empty', () => {
		expect(
			hasJetpackSites( {
				sites: {
					items: {}
				}
			} )
		).to.be.false;
	} );

	it( 'it should return false if a site exists and the site is not a jetpack site', () => {
		expect(
			hasJetpackSites( {
				sites: {
					items: {
						77203074: { ID: 77203074, URL: 'https://example.wordpress.com', jetpack: false }
					}
				}
			} )
		).to.be.false;
	} );

	it( 'it should return false if several site exists and none of them is a jetpack site', () => {
		expect(
			hasJetpackSites( {
				sites: {
					items: {
						77203074: { ID: 77203074, URL: 'https://example.wordpress.com', jetpack: false },
						12203074: { ID: 12203074, URL: 'https://example2.wordpress.com', jetpack: false },
						32203074: { ID: 32203074, URL: 'https://test.wordpress.com', jetpack: false }
					}
				}
			} )
		).to.be.false;
	} );

	it( 'it should return true if one site is a jetpack site and the others are not', () => {
		expect(
			hasJetpackSites( {
				sites: {
					items: {
						77203074: { ID: 77203074, URL: 'https://example.wordpress.com', jetpack: false },
						12203074: { ID: 12203074, URL: 'https://example2.jetpack.com', jetpack: true },
						32203074: { ID: 32203074, URL: 'https://test.wordpress.com', jetpack: false }
					}
				}
			} )
		).to.be.true;
	} );

	it( 'it should return true if several site exist and all of them are jetpack sites', () => {
		expect(
			hasJetpackSites( {
				sites: {
					items: {
						77203074: { ID: 77203074, URL: 'https://example.jetpack.com', jetpack: true },
						12203074: { ID: 12203074, URL: 'https://example2.jetpack.com', jetpack: true },
						32203074: { ID: 32203074, URL: 'https://test.jetpack.com', jetpack: true }
					}
				}
			} )
		).to.be.true;
	} );
} );
