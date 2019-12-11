import React, { useEffect, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { IconButton, Snackbar, SnackbarContent } from '@material-ui/core';
import { Close, Warning } from '@material-ui/icons';

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const msToDays = (ms) => ms / DAY_IN_MS;
const expiresIn = (validUntil) => msToDays(validUntil - Date.now());

const getLicenseInfo = () => {
	const info = localStorage.getItem('licenseInfo');
	const licenseInfo = info ? JSON.parse(info) : {};
	licenseInfo.validUntil = licenseInfo.validUntil != null ? licenseInfo.validUntil : Date.now() + 18 * DAY_IN_MS;
	return licenseInfo;
};
const getDaysLeft = () => {
	const licenseInfo = getLicenseInfo();
	return expiresIn(licenseInfo.validUntil);
};
function LicenseExpireNotification() {
	const [daysLeft, setDaysLeft] = useState(100);
	useEffect(() => {
		setDaysLeft(getDaysLeft());
	});
	return (
		<Snackbar
			anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
			key="daysLeft"
			open={daysLeft < 20}
			autoHideDuration={10 * 1000}
			// ContentProps={{
			// 	'aria-describedby': 'message-id'
			// }}
		>
			<SnackbarContent
				aria-describedby='message-id'
				message={
					<span style={{ color: 'red' }} id="message-id">
						<Warning style={{fontSize: 20, opacity: 0.9, marginRight: 6 }} />
						{daysLeft.toFixed(1)}{' '}
						<FormattedMessage
							id="License.DaysLeftNotification"
							defaultMessage="days left for expiration of your StreamSheets!"
						/>
					</span>
				}
				action={[
					<IconButton key="close" aria-label="close" color="inherit"> { /* onClick={onClose}> */ }
						<Close style={{fontSize: 20 }} />
					</IconButton>
				]}
			/>
		</Snackbar>
	);
}

export default LicenseExpireNotification;
