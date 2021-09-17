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

const config = {
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
const errorConfig = {
	MAX_NUMBER_SHEETS_REACHED: {
		Icon: styles.error.icon,
		contentStyle: styles.warning.style,
		messageId: 'License.Info.Streamsheets.max.reached',
		defMessage: 'Maximum number of Streamsheets reached!'
	}
};

const getConfig = (isInvalid, isExpired, errorCode) => {
	const errconfig = errorConfig[errorCode];
	if (errconfig) return errconfig;
	// eslint-disable-next-line
	return isInvalid ? config.notfound : (isExpired ? config.expired : config.warning);
};

function LicenseNotification({ isInvalid, edition = '', service = '', daysLeft, errorCode = '', clearLicenseError }) {
	const [open, setOpen] = useState(false);
	const [prevDays, setPrevDays] = useState(-1);
	const [prevError, setPrevError] = useState(null);
	const isExpired = daysLeft < 1;
	const days = isExpired ? '' : daysLeft.toFixed();
	const Config = getConfig(isInvalid, isExpired, errorCode || prevError);
	
	const onClose = () => {
		setOpen(false);
		setPrevError(null);
		clearLicenseError();
	}
	if (daysLeft !== prevDays) {
		setOpen(daysLeft < 20);
		setPrevDays(daysLeft);
	} else if (errorCode && errorCode !== prevError) {
		setOpen(true);
		setPrevError(errorCode);
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
				style={Config.contentStyle}
				message={
					<span style={styles.message} id="message-id">
						<Config.Icon style={styles.iconStyle} />
						<DynamicFormattedMessage
							id={Config.messageId}
							defaultMessage={Config.defMessage}
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
