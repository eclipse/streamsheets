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
/* eslint-disable react/prop-types */
import CircularProgress from '@material-ui/core/CircularProgress';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import React from 'react';
import { FormattedMessage } from 'react-intl';
import { connect } from 'react-redux';
import MachineHelper from '../../helper/MachineHelper';

function MachineLoadingDialog(props) {
	const { isDeleting, loadingState, isLoading, isConnected, open } = props;
	const getDialogContent = () => {
		if (!isConnected) {
			return <FormattedMessage id="Status.Connecting" defaultMessage="Connecting ..." />;
		} else if (isLoading) {
			switch (loadingState) {
				case 'FetchingUser':
					return <FormattedMessage id="Status.Machine.FetchingUser" defaultMessage="FetchingUser" />;
				case 'Loading':
					return <FormattedMessage id="Status.Machine.Loading" defaultMessage="Loading Process" />;
				case 'Loaded':
					return <FormattedMessage id="Status.Machine.Loaded" defaultMessage="Loaded" />;
				default:
					return <FormattedMessage id="Status.Machine.Initializing" defaultMessage="Initializing" />;
			}
		} else if (isDeleting) {
			return <FormattedMessage id="DeletingProcess" defaultMessage="Deleting Process" />;
		}
		return '';
	};

	return (
		<Dialog fullWidth mode="indeterminate" size={50} open={open}>
			<DialogContent style={{ textAlign: 'center' }}>
				<CircularProgress />
				<DialogContentText>
					<span>{getDialogContent()}</span>
				</DialogContentText>
			</DialogContent>
		</Dialog>
	);
}

function mapStateToProps(state) {
	const { isDeleting, loadingState, isLoading, isConnected, loadingFailed } = state.monitor;
	return {
		isDeleting,
		loadingState,
		isLoading,
		isConnected,
		open: (!MachineHelper.isViewMode() && isLoading && !loadingFailed) || isDeleting,
	};
}

export default connect(mapStateToProps)(MachineLoadingDialog);
