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
import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import Input from '@material-ui/core/Input';
import InputLabel from '@material-ui/core/InputLabel';
import FormControl from '@material-ui/core/FormControl';
import FormGroup from '@material-ui/core/FormGroup';
import TextField from '@material-ui/core/TextField';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import { FormattedMessage } from 'react-intl';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import Select from '@material-ui/core/Select';
import Button from '@material-ui/core/Button';
import MenuItem from '@material-ui/core/MenuItem';
import JSG from '@cedalo/jsg-ui';

import * as Actions from '../../actions/actions';
import { graphManager } from '../../GraphManager';

const {
	AttributeUtils,
	SetAttributeAtPathCommand,
	CompoundCommand,
} = JSG;

let sheetNames = [];

const FLAG_STYLE = {
	width: '45px',
	height: '24px',
	marginRight: '10px',
	// display: 'block',
};

/**
 * A modal dialog can only be closed by selecting one of the actions.
 */
export class MachineSettingsDialog extends React.Component {

	constructor(props) {
		super(props);
		this.state = {
			showOutbox: true,
			maximizeSheet: 'none',
			machineLocale: 'de',
			toolBarVisibleSize: 1000,
			exposeViaOPCUA: true,
		};
	}

	componentWillReceiveProps() {
		if (!this.props.openSettings) {
			if (graphManager.getGraph() === undefined) {
				return;
			}

			const container = graphManager.getGraph().getMachineContainer();
			if (container === undefined) {
				return;
			}

			const attr = container.getMachineContainerAttributes();

			sheetNames = [];
			graphManager.getGraph().getStreamSheetsContainer().enumerateStreamSheetContainers((sheet) => {
				sheetNames.push(sheet.getStreamSheet().getName().getValue());
			});

			this.setState({ showOutbox: attr.getOutboxVisible().getValue() });
			this.setState({ maximizeSheet: attr.getMaximizeSheet().getValue() });
			this.setState({ toolBarVisibleSize: attr.getHideToolbarThreshold().getValue() });
			this.setState({ machineLocale: this.props.machine.locale });
			this.setState({ exposeViaOPCUA: this.props.machine.isOPCUA });
			// this.setState({ toolBarVisibleSize: this.props.machine.minToolbarPix });s
		}
	}

	handleSettingsCancel = () => {
		this.props.setAppState({ openSettings: false });
		// this.props.setUserSettings({ locale: this.prevLocale });
	};

	handleSettingsSubmit = () => {
		if (this.state.machineLocale !== this.props.machine.locale
			|| this.state.exposeViaOPCUA !== this.props.machine.isOPCUA) {
			this.props.updateMachineSettings(this.props.machine.id, {
				locale: this.state.machineLocale,
				isOPCUA: this.state.exposeViaOPCUA
			});
		}

		graphManager.setMachineLanguage(this.state.machineLocale);

		const container = graphManager.getGraph().getMachineContainer();
		const cmd = new CompoundCommand();

		this.props.setAppState({ openSettings: false });

		let path = AttributeUtils.createPath(
			JSG.MachineContainerAttributes.NAME,
			JSG.MachineContainerAttributes.OUTBOXVISIBLE,
		);
		cmd.add(new SetAttributeAtPathCommand(container, path, this.state.showOutbox));

		path = AttributeUtils.createPath(
			JSG.MachineContainerAttributes.NAME,
			JSG.MachineContainerAttributes.MAXIMIZESHEET,
		);
		cmd.add(new SetAttributeAtPathCommand(container, path, this.state.maximizeSheet));

		path = AttributeUtils.createPath(
			JSG.MachineContainerAttributes.NAME,
			JSG.MachineContainerAttributes.HIDETOOLBARTHRESHOLD,
		);
		cmd.add(new SetAttributeAtPathCommand(container, path, this.state.toolBarVisibleSize));

		graphManager.synchronizedExecute(cmd);
		graphManager.getGraph().getMachineContainer().layout();
		graphManager.getGraph().getMachineContainer().setRefreshNeeded(true);
		graphManager.redraw();
		graphManager.updateControls();
	};

	handleMachineLocaleSelect = (event) => {
		const locale = event.target.value;
		if (locale !== this.state.machineLocale) {
			this.setState({ machineLocale: locale });
		}
	};

	handleMaximizeChange(event) {
		this.setState({ maximizeSheet: event.target.value });
	}

	handleShowOutbox = (event, state) => {
		this.setState({ showOutbox: state });
	};

	handleToolbar = (event) => {
		this.setState({ toolBarVisibleSize: Number(event.target.value) });
	}

	handleExposeViaOPCUA = (event, state) => {
		this.setState({ exposeViaOPCUA: state });
	};

	handleKeyPressed = (event) => {
		switch (event.key) {
		case 'Enter': return this.handleSettingsSubmit();
		case 'Escape': return this.handleSettingsCancel();
		default:
		}
		return false;
	};

	render() {
		return (
			<Dialog
				open={this.props.openSettings}
				onClose={() => this.handleSettingsCancel()}
				onKeyDown={this.handleKeyPressed}
			>
				<DialogTitle>
					<FormattedMessage
						id="DialogSettings.title"
						defaultMessage="Process Settings"
					/>
				</DialogTitle>
				<DialogContent style={{
					minWidth: '500px',
					minHeight: '100px',
				}}
				>
					<div
						style={{
							position: 'relative',
						}}
					>
						<div>
							<FormGroup
								style={{
									margin: '10px',
								}}
							>
								<FormControl
									style={{
										marginTop: '20px',
										width: '300px',
										marginBottom: '15px'
									}}
								>
									<InputLabel htmlFor="language-setting">
										<FormattedMessage id="MachineLanguage" defaultMessage="Language" />
									</InputLabel>
									<Select
										id="language-setting"
										value={this.state.machineLocale}
										onChange={(ev) => this.handleMachineLocaleSelect(ev)}>
										<MenuItem key="en" value="en">
											<img alt="EN" src="images/flags/gb.svg" style={FLAG_STYLE} />
											English (UK)
										</MenuItem>
										<MenuItem key="de" value="de">
											<img alt="DE" src="images/flags/de.svg" style={FLAG_STYLE} />
											German
										</MenuItem>
										<MenuItem key="us" value="us">
											<img alt="EN-US" src="images/flags/us.svg" style={FLAG_STYLE} />
											English (US)
										</MenuItem>
									</Select>
								</FormControl>
								<FormControl
									style={{
										width: '300px',
									}}
								>
									<InputLabel htmlFor="maximize-load">
										<FormattedMessage
											id="DialogSettings.maximizeOnStart"
											defaultMessage="Maximized on Load"
										/>
									</InputLabel>
									<Select
										id="maximize-load"
										value={this.state.maximizeSheet}
										onChange={event => this.handleMaximizeChange(event)}
										input={<Input
											name="sheet-selection"
											id="sheet-selection"
										/>}
									>
										<MenuItem key="none" value="none">
											<FormattedMessage
												id="Nones"
												defaultMessage="None"
											/>
										</MenuItem>
										{sheetNames.map((name) =>
											<MenuItem key={name} value={name}>
												{name}
											</MenuItem>
										)}
									</Select>
								</FormControl>
								<FormControl
									style={{
										width: '400px',
									}}
								>
									<TextField
										id="number"
										label={
											<FormattedMessage
												id="DialogSettings.toolbarMin"
 												defaultMessage="Hide Toolbar, if Browser is smaller than Pixels:"
											/>
										}
										inputProps={{
											min: 0,
											max: 10,
											step: 1,
										}}
										value={this.state.toolBarVisibleSize}
										onChange={event => this.handleToolbar(event)}
										type="number"
										margin="normal"
									/>
								</FormControl>
								<FormControlLabel
									control={<Checkbox
										checked={this.state.showOutbox}
										onChange={this.handleShowOutbox}
									/>}
									label={
										<FormattedMessage
											id="DialogSettings.showOutbox"
											defaultMessage="Show Outbox"
										/>
									}
								/>
								<FormControlLabel
									control={<Checkbox
										checked={this.state.exposeViaOPCUA}
										onChange={this.handleExposeViaOPCUA}
									/>}
									label={
										<FormattedMessage
											id="DialogSettings.exposeViaOPCUA"
											defaultMessage="Expose via OPC UA"
										/>
									}
								/>
							</FormGroup>
						</div>
					</div>
				</DialogContent>
				<DialogActions>
					<Button
						color="primary"
						onClick={this.handleSettingsCancel}
					>
						<FormattedMessage
							id="Cancel"
							defaultMessage="Cancel"
						/>
					</Button>
					<Button
						color="primary"
						autoFocus
						onClick={() => this.handleSettingsSubmit()}
					>
						<FormattedMessage
							id="OK"
							defaultMessage="OK"
						/>
					</Button>
				</DialogActions>
			</Dialog>
		);
	}
}

function mapStateToProps(state) {
	return {
		openSettings: state.appState.openSettings,
		machine: state.machine,
	};
}

function mapDispatchToProps(dispatch) {
	return bindActionCreators(Actions, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(MachineSettingsDialog);
