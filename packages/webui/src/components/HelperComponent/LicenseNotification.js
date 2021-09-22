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
import { amber, red } from '@material-ui/core/colors';
import IconButton from '@material-ui/core/IconButton';
import Snackbar from '@material-ui/core/Snackbar';
import SnackbarContent from '@material-ui/core/SnackbarContent';
import CloseIcon from '@material-ui/icons/Close';
import Error from '@material-ui/icons/Error';
import Warning from '@material-ui/icons/Warning';
import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { clearLicenseErrorState } from '../../actions/actions';
import { DynamicFormattedMessage } from './DynamicFormattedMessage';

const styles = {
	error: {
		icon: Error,
		style: { backgroundColor: red[700], color: 'black' }
	},
	warning: {
		icon: Warning,
		style: { backgroundColor: amber[700], color: 'black' }
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

const Config = {
	expired: {
		Icon: styles.error.icon,
		contentStyle: styles.error.style,
		messageId: 'License.Expired',
		defMessage: 'Your Streamsheets {edition}-license has expired!'
	},
	notfound: {
		Icon: styles.error.icon,
		contentStyle: styles.error.style,
		messageId: 'License.NotFound',
		defMessage: 'No valid Streamsheets license found!'
	},
	warning: {
		Icon: styles.warning.icon,
		contentStyle: styles.warning.style,
		messageId: 'License.WillExpire',
		defMessage: '{days} days left until your Streamsheets {edition}-license expires!'
	}
};
const ErrorConfig = {
	MAX_NUMBER_SHEETS_REACHED: {
		Icon: styles.error.icon,
		contentStyle: styles.warning.style,
		messageId: 'License.Info.Streamsheets.max.reached',
		defMessage: 'Maximum number of Streamsheets reached!'
	}
};

const getConfig = (isInvalid, isExpired, errorCode) => {
	const errconfig = ErrorConfig[errorCode];
	if (errconfig) return errconfig;
	// eslint-disable-next-line
	return isInvalid ? Config.notfound : (isExpired ? Config.expired : Config.warning);
};
const isExpireWarning = (oldDaysLeft, newDaysLeft) => newDaysLeft < 20 && newDaysLeft !== oldDaysLeft;
const isErrorCode = (oldCode, newCode) => newCode && newCode !== oldCode;
const stateChanged = (state, daysLeft, errorCode) =>
	isExpireWarning(state.daysLeft, daysLeft) || isErrorCode(state.errorCode, errorCode);

function LicenseNotification({ isInvalid, edition = '', service = '', daysLeft, errorCode = '', clearLicenseError }) {
	const [open, setOpen] = useState(false);
	const [config, setConfig] = useState(Config.warning);
	const [prevState, setPrevState] = useState({});
	const isExpired = daysLeft < 1;
	const days = isExpired ? '' : daysLeft.toFixed();
	
	const onClose = () => {
		setOpen(false);
		clearLicenseError();
		setPrevState({ daysLeft, errorCode: undefined });
	}
	if (!open && stateChanged(prevState, daysLeft, errorCode)) {
		setOpen(true);
		setPrevState({ daysLeft, errorCode });
		setConfig(getConfig(isInvalid, isExpired, errorCode));
	}

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
				style={config.contentStyle}
				message={
					<span style={styles.message} id="message-id">
						<config.Icon style={styles.iconStyle} />
						<DynamicFormattedMessage
							id={config.messageId}
							defaultMessage={config.defMessage}
							values={{ days, edition, service }}
						/>
					</span>
				}
				action={
					isExpired
						? []
						: [
							<IconButton key="close" aria-label="close" color="inherit" onClick={onClose}>
								<CloseIcon style={styles.iconStyle} />
							</IconButton>
						  ]
				}
			/>
		</Snackbar>
	);
}

LicenseNotification.propTypes = {
	isInvalid: PropTypes.bool,
	edition: PropTypes.string,
	daysLeft: PropTypes.number,
	service: PropTypes.string,
	errorCode: PropTypes.string
};

LicenseNotification.defaultProps = {
	isInvalid: false,
	edition: '',
	service: '',
	daysLeft: 1500,
	errorCode: ''
};

const mapStateToProps = (state) => {
	const { licenseInfo = {} } = state.meta;
	return { ...licenseInfo };
};
const mapDispatchToProps = (dispatch) => bindActionCreators({ clearLicenseError: clearLicenseErrorState }, dispatch);


export default connect(mapStateToProps, mapDispatchToProps)(LicenseNotification);
