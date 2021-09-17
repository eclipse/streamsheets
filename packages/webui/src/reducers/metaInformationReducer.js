/********************************************************************************
 * Copyright (c) 2020 Cedalo AG
 *
 * This program and the accompanying materials are made available under the 
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 ********************************************************************************/
import * as Actions from '../constants/ActionTypes';
import * as Messages from '../constants/WebsocketMessageTypes';

const defaultMetaInformationState = {
	services: {},
	isFetching: false,
	licenseInfo: {},
	disconnectedServices: [],
	allServicesConnected: true,
};

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const msToDays = (ms) => ms / DAY_IN_MS;
const expiresInDays = (validUntil) => Math.ceil(msToDays(validUntil - Date.now()));
const createLicenseInfo = (licenseInfo = {}, errcode) => {
	// TODO: extract every information from license object?
	const {
		edition = 'Open Source',
		invalid,
		service,
		validUntil,
		issuedBy,
		issuedTo,
		maxInstallations,
		maxStreamsheets,
		usedStreamsheets
	} = licenseInfo;
	const info = {
		isInvalid: !!invalid,
		edition,
		service,
		issuedBy,
		issuedTo,
		maxInstallations,
		maxStreamsheets,
		usedStreamsheets,
		errorCode: errcode
	};
	if (validUntil != null) info.daysLeft = expiresInDays(validUntil);
	return info;
};

export default function metaInformationReducer(state = defaultMetaInformationState, action) {
	switch (action.type) {
		case Actions.FETCH_META_INFORMATION:
			return {
				...state,
				isFetching: true,
			};
		case Actions.RECEIVE_META_INFORMATION: {
			const { licenseInfo, services } = action.metaInformation;
			const disconnectedServices = Object.entries(services)
				.filter(([serviceName]) => serviceName !== 'undefined')
				.filter(([, service]) => !Object.keys(service.instances).length > 0)
				.map(([serviceName]) => serviceName);
			return {
				...state,
				isFetching: false,
				services,
				licenseInfo: createLicenseInfo(licenseInfo),
				disconnectedServices,
				allServicesConnected: disconnectedServices.length === 0
			};
		}
		case Actions.LICENSE_INFORMATION: {
			const { licenseInfo } = action;
			return {
				...state,
				licenseInfo: createLicenseInfo(licenseInfo),
			};
		}
		case Messages.REQUEST_FAILED: {
			const { error = {} } = action;
			const { type, code, info } = error;
			return type === 'LicenseError' ? { ...state, licenseInfo: createLicenseInfo(info, code) } : state;
		}
		default:
			return state;
	}
}
