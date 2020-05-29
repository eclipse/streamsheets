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
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import PropTypes from 'prop-types';
import React from 'react';
import { FormattedMessage } from 'react-intl';
import { connect } from 'react-redux';
import { deleteMachine, openDashboard, setAppState } from '../../actions/actions';

function MachineDeleteDialog(props) {
	const { open, machineId, machineName } = props;

	const handleSubmitDeleteMachine = async () => {
		try {
			await props.deleteMachine(machineId);
			props.closeDialog();
			props.openDashboard(machineId);
		} catch (error) {
			props.closeDialog();
		}
	};

	const handleKeyPressed = (event) => {
		switch (event.key) {
			case 'Enter':
				return handleSubmitDeleteMachine();
			case 'Escape':
				return props.closeDialog();
			default:
		}
		return false;
	};

	return (
		<Dialog open={open} onClose={props.closeDialog} onKeyDown={handleKeyPressed}>
			<DialogTitle>
				<FormattedMessage id="DeleteMachineDialog" defaultMessage="Delete Machine" />
			</DialogTitle>
			<DialogContent
				style={{
					margin: '20px',
				}}
			>
				<DialogContentText>
					<FormattedMessage
						id="DeleteMachineDialog.message"
						defaultMessage="This action can not be undone. Are you sure,
								you want to delete the machine: '{machine}'?"
						values={{ machine: machineName }}
					/>
				</DialogContentText>
			</DialogContent>
			<DialogActions>
				<Button color="primary" autoFocus onClick={props.closeDialog}>
					<FormattedMessage id="Cancel" defaultMessage="Cancel" />
				</Button>
				<Button color="primary" onClick={handleSubmitDeleteMachine}>
					<FormattedMessage id="OK" defaultMessage="OK" />
				</Button>
			</DialogActions>
		</Dialog>
	);
}

MachineDeleteDialog.propTypes = {
	open: PropTypes.bool.isRequired,
	machineName: PropTypes.string,
	machineId: PropTypes.string,
	closeDialog: PropTypes.func.isRequired,
	deleteMachine: PropTypes.func.isRequired,
	openDashboard: PropTypes.func.isRequired,
};

MachineDeleteDialog.defaultProps = {
	machineName: null,
	machineId: null,
};

function mapStateToProps(state) {
	return {
		open: state.appState.showDeleteMachineDialog,
		machineName: state.monitor.machine.name,
		machineId: state.monitor.machine.id,
	};
}

const mapDispatchToProps = {
	closeDialog: () => setAppState({ showDeleteMachineDialog: false }),
	deleteMachine,
	openDashboard,
};

export default connect(
	mapStateToProps,
	mapDispatchToProps,
)(MachineDeleteDialog);
