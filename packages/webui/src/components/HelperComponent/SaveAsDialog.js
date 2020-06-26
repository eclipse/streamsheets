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
import React, { Component } from 'react';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { FormattedMessage } from 'react-intl';

import * as Actions from '../../actions/actions';

// eslint-disable-next-line react/prefer-stateless-function
export class SaveAsDialog extends Component {
	state = {
		machineCopyName: 'Default Name',
	};

	componentWillReceiveProps(props) {
		if (props.monitor && props.monitor.machine) {
			this.setState({
				machineCopyName: `${props.monitor.machine.name} Copy`,
			});
		}
	}

	closeSaveAsDialog = () => {
		this.props.setAppState({
			showSaveAsDialog: false,
		});
	};

	handleSaveAs = () => {
		this.props.saveMachineAs(
			this.props.monitor.machine.id,
			this.state.machineCopyName,
		);
		this.props.setAppState({
			showSaveAsDialog: false,
		});
	};

	handleMachineCopyName = (event) => {
		this.setState({
			machineCopyName: event.target.value,
		});
	};

	render() {
		return (
			<Dialog
				fullWidth
				open={this.props.showSaveAsDialog}
				onClose={() => this.props.setAppState({ showSaveAsDialog: false })}
			>
				<DialogTitle>
					<FormattedMessage
						id="SaveAsDialog.header"
						defaultMessage="Save machine as"
					/>
				</DialogTitle>
				<DialogContent style={{
					padding: '20px',
				}}
				>
					<TextField
						value={this.state.machineCopyName}
						onChange={this.handleMachineCopyName}
						label={<FormattedMessage
							id="SaveAsDialog.hint"
							defaultMessage="Name of the copy"
						/>}
						fullWidth
					/>
				</DialogContent>
				<DialogActions>
					<Button
						onClick={this.closeSaveAsDialog}
					>
						<FormattedMessage
							id="Cancel"
							defaultMessage="Cancel"
						/>
					</Button>
					<Button
						onClick={this.handleSaveAs}
					>
						<FormattedMessage
							id="SaveButton"
							defaultMessage="Save"
						/>
					</Button>
				</DialogActions>
			</Dialog>
		);
	}
}

function mapStateToProps(state) {
	return {
		showSaveAsDialog: state.appState.showSaveAsDialog,
		monitor: state.monitor,
	};
}

function mapDispatchToProps(dispatch) {
	return bindActionCreators({ ...Actions }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(SaveAsDialog);
