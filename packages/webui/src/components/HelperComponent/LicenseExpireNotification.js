import React, { useEffect, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { amber, red } from '@material-ui/core/colors';
import { IconButton, Snackbar, SnackbarContent } from '@material-ui/core';
import { Close as CloseIcon, Error, Warning } from '@material-ui/icons';

const styles = {
	expired: {
		icon: Error,
		style: {
			backgroundColor: red[700],
			color: 'black'
		}
	},
	willExpire: {
		icon: Warning,
		style: {
			backgroundColor: amber[700],
			color: 'black'
		}
	},
	iconStyle: {
		fontSize: 20,
		opacity: 0.9,
		marginRight: 6
	},
	message: {
		display: 'flex',
		alignItems: 'center'
	}
};

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const LICENSE_INFO = { isValid: true, validUntil: Date.now() + 18 * DAY_IN_MS };
// Workaround for Babel restriction, see https://github.com/yahoo/babel-plugin-react-intl/issues/119
const FormattedMessageFixed = (props) => <FormattedMessage {...props} />;

const msToDays = (ms) => ms / DAY_IN_MS;
const expiresIn = (validUntil) => msToDays(validUntil - Date.now());

const getLicenseInfo = () => {
	let licenseInfo;
	try {
		licenseInfo = JSON.parse(localStorage.getItem('licenseInfo'));
	} catch (err) {
		/* ignore */
	}
	return Object.assign({}, LICENSE_INFO, licenseInfo);
};

function LicenseExpireNotification() {
	const [open, setOpen] = useState(false);
	const [licenseInfo, setLicenseInfo] = useState({ ...LICENSE_INFO });
	const { isValid, validUntil} = licenseInfo;
	const daysLeft = expiresIn(validUntil);
	const days = isValid ? daysLeft.toFixed() : '';
	const Icon = isValid ? styles.willExpire.icon : styles.expired.icon;
	const contentStyle = isValid ? styles.willExpire.style : styles.expired.style;
	const messageId = isValid ? 'License.WillExpire' : 'License.Expired';
	const defMessage = isValid
		? 'days left for expiration of your StreamSheets!'
		: 'Your Streamsheet license has expired!';
	const onClose = () => setOpen(false);
	useEffect(() => {
		const info = getLicenseInfo();
		const expiresInDays = expiresIn(info.validUntil);
		setOpen(!info.isValid || expiresInDays < 20);
		setLicenseInfo({ ...info });
	}, []);

	return (
		<Snackbar
			anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
			key="daysLeft"
			open={open}
			// onClose={onClose}
			// autoHideDuration={8000}
		>
			<SnackbarContent
				aria-describedby="message-id"
				style={contentStyle}
				message={
					<span style={styles.message} id="message-id">
						<Icon style={styles.iconStyle} />
						{days}&nbsp;
						<FormattedMessageFixed id={messageId} defaultMessage={defMessage} />
					</span>
				}
				action={licenseInfo.isValid ? [
					<IconButton key="close" aria-label="close" color="inherit" onClick={onClose}>
						<CloseIcon style={styles.iconStyle} />
					</IconButton>
				] : []}
			/>
		</Snackbar>
	);
}

export default LicenseExpireNotification;
