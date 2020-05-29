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
	

function RequestStatusDialog(props) {
	const { open, error } = props;

	return (
		<Dialog fullWidth open={open} maxWidth="md">
			<DialogTitle>{error && error.message}</DialogTitle>
			<DialogContent style={{ textAlign: 'center' }}>
				<DialogContentText>{error.stack}</DialogContentText>
			</DialogContent>
		</Dialog>
	);
}

RequestStatusDialog.propTypes = {
	open: PropTypes.bool.isRequired,
	error: PropTypes.shape({
		message: PropTypes.string,
		stack: PropTypes.string,
	}),
};

RequestStatusDialog.defaultProps = {
	error: {},
};

function mapStateToProps(state) {
	return {
		open: state.monitor.requestFailed,
		error: state.monitor.error.error,
	};
}

export default connect(mapStateToProps)(RequestStatusDialog);
