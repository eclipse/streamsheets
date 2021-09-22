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
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { FormattedMessage } from 'react-intl';


const getErrorMessage = (error = {}) => {
	const { type, message } = error;
	if (type === 'LicenseError') {
		// currently only one license error => improve if more to come...
		return <FormattedMessage id="License.Info.Streamsheets.max.reached"	defaultMessage="Maximum number of Streamsheets reached"/>
	}
	return message;
};
const getErrorDetail = (error = {}) => {
	const { info = {}, type, stack } = error;
	if (type === 'LicenseError') {
		// currently only one license error => improve if more to come...
		const { maxStreamsheets } = info;
		return (
			<FormattedMessage
				id="License.Info.Streamsheets.info.allused"
				defaultMessage="All {maxStreamsheets} available Streamsheets are used."
				values={{ maxStreamsheets }}
			/>
		);
	}
	return stack;
};
function RequestStatusDialog(props) {
	const { open, error } = props;

	return (
		<Dialog fullWidth open={open} maxWidth="md">
			<DialogTitle>{getErrorMessage(error)}</DialogTitle>
			<DialogContent style={{ textAlign: 'center' }}>
				<DialogContentText>{getErrorDetail(error)}</DialogContentText>
			</DialogContent>
		</Dialog>
	);
}

RequestStatusDialog.propTypes = {
	open: PropTypes.bool.isRequired,
	error: PropTypes.shape({
		message: PropTypes.string,
		stack: PropTypes.string
	})
};

RequestStatusDialog.defaultProps = {
	error: {}
};

function mapStateToProps(state) {
	return {
		open: state.monitor.requestFailed,
		error: state.monitor.error.error
	};
}

export default connect(mapStateToProps)(RequestStatusDialog);
