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
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import React from 'react';
import { FormattedMessage } from 'react-intl';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as Actions from '../../actions/actions';
import MachineListComponent from '../MachineListComponent/MachineListComponent';
import { Path } from '../../helper/Path';

// eslint-disable-next-line react/prefer-stateless-function
export function OpenDialog(props) {
	const { open } = props;

	const handleClose = (machine) => {
		props.setAppState({ showOpenDialog: false });
		window.open(Path.machine(machine.id), '_blank');
	};

	const handleCancel = () => {
		props.setAppState({ showOpenDialog: false });
	};

	return (
		<Dialog open={open}  maxWidth={false} onClose={handleCancel}>
			<DialogTitle>
				<FormattedMessage id="DialogOpen.title" defaultMessage="Load Process" />
			</DialogTitle>
			<DialogContent
				style={{
					height: '480px',
					width: '600px'
				}}
			>
				<MachineListComponent onItemClick={handleClose} />
			</DialogContent>
			<DialogActions>
				<Button color="primary" onClick={handleCancel}>
					<FormattedMessage id="Cancel" defaultMessage="Cancel" />
				</Button>
			</DialogActions>
		</Dialog>
	);
}

function mapStateToProps(state) {
	return {
		open: state.appState.showOpenDialog,
	};
}

function mapDispatchToProps(dispatch) {
	return bindActionCreators({ ...Actions }, dispatch);
}

export default connect(
	mapStateToProps,
	mapDispatchToProps,
)(OpenDialog);
