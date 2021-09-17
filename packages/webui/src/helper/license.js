/********************************************************************************
 * Copyright (c) 2021 Cedalo AG
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 ********************************************************************************/
import React from 'react';
import { FormattedMessage } from 'react-intl';
import PremiumVersionIcon from '@material-ui/icons/VerifiedUser';

// const isPremiumLicense = (license) => license && license.edition === 'pro';
export const isPremiumLicense = (license) => !!license;

export const getPremium = () => {
	return (
		<span>
			<PremiumVersionIcon fontSize="small" style={{ color: '#ffc107', verticalAlign: 'middle' }} /> Premium
		</span>
	);
};

export const getLicenseValidUntil = (daysLeft) => {
	const date = new Date();
	date.setDate(date.getDate() + daysLeft);
	return date.toLocaleDateString();
};

export const getLicenseStreamsheetsInfo = ({ maxStreamsheets = -1, usedStreamsheets = 0 }) => {
	if (maxStreamsheets < 0) {
		return <FormattedMessage id="License.Info.Streamsheets.unlimited" defaultMessage="Unlimited" />;
	}
	const remaining = Math.max(0, maxStreamsheets - usedStreamsheets);
	return (
		<FormattedMessage
			id="License.Info.Streamsheets.info"
			defaultMessage="{maxStreamsheets} ({remaining} remain)"
			values={{ maxStreamsheets, remaining }}
		/>
	);
};
