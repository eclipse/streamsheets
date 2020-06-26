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
/* eslint-disable react/forbid-prop-types */
/* eslint-disable react/prop-types */
import PropTypes from 'prop-types';
import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogTitle from '@material-ui/core/DialogTitle';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';
import Typography from '@material-ui/core/Typography';
import DialogContent from '@material-ui/core/DialogContent';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Input from '@material-ui/core/Input';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import FormGroup from '@material-ui/core/FormGroup';
import FormControl from '@material-ui/core/FormControl';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormLabel from '@material-ui/core/FormLabel';
import Checkbox from '@material-ui/core/Checkbox';
import { FormattedMessage } from 'react-intl';
import { Reference } from '@cedalo/parser';

import JSG from '@cedalo/jsg-ui';
import StreamHelper from '../../helper/StreamHelper';
import { accessManager } from '../../helper/AccessManager';
import * as Actions from '../../actions/actions';
import StreamSelector from '../StreamSelector/StreamSelector';
import MachineHelper from '../../helper/MachineHelper';
import { graphManager } from '../../GraphManager';

const { RESOURCE_ACTIONS } = accessManager;
const {
	AttributeUtils,
	ButtonNode,
	SetNameCommand,
	SetAttributeAtPathCommand,
	CompoundCommand,
	NotificationCenter,
} = JSG;

function TabContainer(props) {
	return (
		<Typography component="div">
			{props.children}
		</Typography>
	);
}

TabContainer.propTypes = {
	children: PropTypes.node.isRequired,
};


let triggerTypes;

const styles = {
	formControl: {
		marginTop: '10px',
		marginBottom: '10px',
	},
};
const getStreamsFromProps = (props) => {
	if(props.streams && Array.isArray(props.streams.consumers)) {
		return [...props.streams.consumers];
	}
	return [];
}

/**
 * A modal dialog can only be closed by selecting one of the actions.
 */
export class InboxSettings extends React.Component {
	static getDerivedStateFromProps(props, state) {
		const streams = getStreamsFromProps(props);
		if (props.streams && state.inbox && state.inbox.stream) {
			const stream = streams.find((s) => s.id === state.inbox.stream.id);
			if (stream) {
				return {
					...state,
					streams,
					inbox: {
						...state.inbox,
						stream: {
							name: stream.name,
							id: stream.id,
						},
					},
				};
			}
			return { ...state, streams };
		}
		return { ...state, streams };
	}

	constructor(props) {
		super(props);
		const streams = getStreamsFromProps(props);
		this.state = {
			streams,
			tabSelected: 0,
			expanded: 'basic',
			loopPathError: null,
			showAdvanced: false,
			preferences: {
				showGrid: true,
				showHeader: true,
				showInbox: true,
				greyIfRows: true,
				sheetColumns: 52,
				sheetRows: 100,
				sheetProtect: false,
				sheetShowFormulas: false,
			},
		};
		this.handleClose = this.handleClose.bind(this);
		this.handleSave = this.handleSave.bind(this);
	}

	componentDidMount() {
		NotificationCenter.getInstance().register(this, ButtonNode.BUTTON_CLICKED_NOTIFICATION, 'onButtonClicked');
	}

	componentWillUnmount() {
		NotificationCenter.getInstance().unregister(this, ButtonNode.BUTTON_CLICKED_NOTIFICATION);
	}

	onButtonClicked(notification) {
		if (notification.object) {
			const info = notification.object;
			const item = info.button;
			if (item && (item.getName().getValue() === 'inboxSettings' ||
				item.getName().getValue() === 'settings')) {
				triggerTypes = [
					{
						label: (
							<FormattedMessage
								id="ProcessContainerSettings.continuously"
								defaultMessage="Continuously"
							/>
						),
						value: 'continuously',
					},
					{
						// eslint-disable-next-line
						label: (
							<FormattedMessage
								id="ProcessContainerSettings.onDataArrival"
								defaultMessage="On Data Arrival"
							/>
						),
						value: 'arrival',
					},
					{
						label: <FormattedMessage id="ProcessContainerSettings.onExecute" defaultMessage="On Execute" />,
						value: 'execute',
					},
					{
						// eslint-disable-next-line
						label: (
							<FormattedMessage
								id="ProcessContainerSettings.onMachineStart"
								defaultMessage="On Machine Start"
							/>
						),
						value: 'start',
					},
					{
						// eslint-disable-next-line
						label: (
							<FormattedMessage
								id="ProcessContainerSettings.onMachineStop"
								defaultMessage="On Machine Stop"
							/>
						),
						value: 'stop',
					},
					{
						label: <FormattedMessage id="ProcessContainerSettings.onTime" defaultMessage="On Time" />,
						value: 'time',
					},
					{
						label: <FormattedMessage id="ProcessContainerSettings.onRandom" defaultMessage="On Random" />,
						value: 'random',
					},
				];

				const id = info.container
					.getStreamSheetContainerAttributes()
					.getSheetId()
					.getValue();
				const { machine } = this.props;
				const sheet = info.container.getStreamSheet();
				this.processSheet = sheet;

				if (machine.streamsheets.length > 0) {
					const streamsheet = machine.streamsheets.find((t) => t.id === id);
					if (streamsheet) {
						const settings = {
							tabSelected: item.getName().getValue() === 'settings' ? 1 : 0,
							...streamsheet,
							machineId: machine.id,
							streamsheetId: streamsheet.id,
							preferences: {
								...this.state.preferences,
								hideMessages: info.container
									.getStreamSheetContainerAttributes()
									.getHideMessages()
									.getValue(),
								showInbox: info.container
									.getStreamSheetContainerAttributes()
									.getInboxVisible()
									.getValue(),
								showGrid: sheet
									.getWorksheetAttributes()
									.getShowGrid()
									.getValue(),
								greyIfRows: sheet
									.getWorksheetAttributes()
									.getGreyIfRows()
									.getValue(),
								sheetProtect: sheet
									.getWorksheetAttributes()
									.getProtected()
									.getValue(),
								sheetRows: sheet
									.getWorksheetAttributes()
									.getRows()
									.getValue(),
								sheetColumns:
									sheet
										.getWorksheetAttributes()
										.getColumns()
										.getValue() + sheet.getColumns().getInitialSection(),
								showHeader: sheet
									.getWorksheetAttributes()
									.getShowHeader()
									.getValue(),
								showFormulas: sheet
									.getWorksheetAttributes()
									.getShowFormulas()
									.getValue(),
							},
						};
						this.setState(settings);
					}
				}

				this.props.getDataStores().then(() =>
					this.props.setAppState({
						showInboxSettings: true,
					}),
				);
			}
		}
	}

	getStreams = () => {
		const { streams } = this.state;
		return streams.map((s) => {
			s.state = StreamHelper.getResourceState(s, this.props.streams.statusMap);
			s.state = StreamHelper.getStatusFor(s.state);
			return s;
		});
	};

	getTriggerType = () => {
		const { type } = this.state.trigger;
		return type === 'start' && this.state.trigger.repeat === 'endless' ? 'continuously' : type;
	};

	handleShowGrid = (event, state) => {
		this.setState({
			preferences: {
				...this.state.preferences,
				showGrid: state,
			},
		});
	};

	handleGreyIfRows = (event, state) => {
		this.setState({
			preferences: {
				...this.state.preferences,
				greyIfRows: state,
			},
		});
	};

	handleShowHeader = (event, state) => {
		this.setState({
			preferences: {
				...this.state.preferences,
				showHeader: state,
			},
		});
	};

	handleShowFormulas = (event, state) => {
		this.setState({
			preferences: {
				...this.state.preferences,
				showFormulas: state,
			},
		});
	};

	handleShowInbox = (event, state) => {
		this.setState({
			preferences: {
				...this.state.preferences,
				showInbox: state,
			},
		});
	};

	handleSheetProtect = (event, state) => {
		this.setState({
			preferences: {
				...this.state.preferences,
				sheetProtect: state,
			},
		});
	};

	handleSheetName = (event) => {
		this.setState({ name: event.target.value });
	};

	handleSheetRows = (event) => {
		this.setState({
			preferences: {
				...this.state.preferences,
				sheetRows: Number(event.target.value),
			},
		});
	};

	handleSheetColumns = (event) => {
		this.setState({
			preferences: {
				...this.state.preferences,
				sheetColumns: Number(event.target.value),
			},
		});
	};

	handleSave = () => {
		const settings = Object.assign({}, { ...this.state });
		if (!settings.inbox.stream) {
			settings.inbox.stream = {
				name: '',
			};
		}
		if (settings.inbox.stream.name === 'none') {
			settings.inbox.stream.name = '';
		}
		delete settings.streams;
		delete settings.loopPathError;
		this.props.saveProcessSettings(settings);

		const cmd = new CompoundCommand();
		cmd.add(new SetNameCommand(this.processSheet, this.state.name));

		let path = AttributeUtils.createPath(JSG.WorksheetAttributes.NAME, JSG.WorksheetAttributes.SHOWGRID);
		cmd.add(new SetAttributeAtPathCommand(this.processSheet, path, this.state.preferences.showGrid));

		path = AttributeUtils.createPath(JSG.WorksheetAttributes.NAME, JSG.WorksheetAttributes.SHOWHEADER);
		cmd.add(new SetAttributeAtPathCommand(this.processSheet, path, this.state.preferences.showHeader));

		path = AttributeUtils.createPath(JSG.WorksheetAttributes.NAME, JSG.WorksheetAttributes.SHOWFORMULAS);
		cmd.add(new SetAttributeAtPathCommand(this.processSheet, path, this.state.preferences.showFormulas));

		path = AttributeUtils.createPath(JSG.WorksheetAttributes.NAME, JSG.WorksheetAttributes.PROTECTED);
		cmd.add(new SetAttributeAtPathCommand(this.processSheet, path, this.state.preferences.sheetProtect));

		path = AttributeUtils.createPath(JSG.WorksheetAttributes.NAME, JSG.WorksheetAttributes.GREYIFROWS);
		cmd.add(new SetAttributeAtPathCommand(this.processSheet, path, this.state.preferences.greyIfRows));

		path = AttributeUtils.createPath(JSG.WorksheetAttributes.NAME, JSG.WorksheetAttributes.ROWS);
		cmd.add(new SetAttributeAtPathCommand(this.processSheet, path, this.state.preferences.sheetRows));

		path = AttributeUtils.createPath(JSG.WorksheetAttributes.NAME, JSG.WorksheetAttributes.COLUMNS);
		cmd.add(
			new SetAttributeAtPathCommand(
				this.processSheet,
				path,
				this.state.preferences.sheetColumns - this.processSheet.getColumns().getInitialSection(),
			),
		);

		path = AttributeUtils.createPath(
			JSG.StreamSheetContainerAttributes.NAME,
			JSG.StreamSheetContainerAttributes.HIDEMESSAGES,
		);
		cmd.add(
			new SetAttributeAtPathCommand(
				this.processSheet.getStreamSheetContainer(),
				path,
				this.state.preferences.hideMessages,
			),
		);

		path = AttributeUtils.createPath(
			JSG.StreamSheetContainerAttributes.NAME,
			JSG.StreamSheetContainerAttributes.INBOXVISIBLE,
		);
		cmd.add(
			new SetAttributeAtPathCommand(
				this.processSheet.getStreamSheetContainer(),
				path,
				this.state.preferences.showInbox,
			),
		);

		graphManager.synchronizedExecute(cmd);

		this.handleClose();
	};

	parsePath(path) {
		// TODO: improve
		if (!path.startsWith('[')) {
			throw new Error('expression must start with [ ');
		}
		if (!path.endsWith(']')) {
			throw new Error('expression must end with ] ');
		}
		return path;
	}

	toggleAdvanced = () => {
		this.setState({ showAdvanced: !this.state.showAdvanced });
	};

	handleLoopPathChange = (event) => {
		const path = event.target.value;
		try {
			this.parsePath(path);
			this.setState({
				loopPathError: null,
			});
		} catch (e) {
			this.setState({
				loopPathError: e.message,
			});
		}
		this.setState({
			loop: {
				...this.state.loop,
				path,
			},
		});
	};

	handleLoopEnabled = (event, state) => {
		const enabled = state;
		this.setState({ loop: { ...this.state.loop, enabled } });
	};
	handleLoopRecursively = (event, state) => {
		const recursively = state;
		this.setState({ loop: { ...this.state.loop, recursively } });
	};

	handleRepeatCalculation = (event, state) => {
		const repeat = state ? 'endless' : 'once';
		this.setState({ trigger: { ...this.state.trigger, repeat } });
	};

	handleHideMessages = (event, state) => {
		this.setState({
			preferences: {
				...this.state.hideMessages,
				hideMessages: state,
			},
		});
	};

	handleClose = () => {
		this.props.setAppState({ showInboxSettings: false });
	};

	handleChange = (panel) => (event, expanded) => {
		this.setState({
			expanded: expanded ? panel : false,
		});
	};

	handleStreamChange = (stream, event) => {
		const streamId = event.target.value;
		const streams = this.getStreams();
		const newStream = streams.find((s) => s.id === streamId);
		if (newStream) {
			const streamDesc = {
				name: newStream.name || 'none',
				id: newStream.id,
				type: newStream.type,
			};
			this.setState({
				inbox: {
					...this.state.inbox,
					stream: streamDesc,
				},
			});
		} else {
			this.setState({
				inbox: {
					...this.state.inbox,
					stream: { id: 'none' },
				},
			});
		}
	};


	handleTriggerChange = (event) => {
		const type = event.target.value;
		const newState = { trigger: { ...this.state.trigger, type } };
		if (type === 'continuously') {
			newState.trigger.type = 'start';
			newState.trigger.repeat = 'endless';
		} /* if (type === 'start') */ else {
			newState.trigger.repeat = 'once';
		}
		this.setState(newState);
	};

	handleTabChange = (event, value) => {
		this.setState({ tabSelected: value });
	};

	render() {
		const { machine } = this.props;
		const streams = this.getStreams();
		if (!this.state.id) {
			return null;
		}
		const canEdit = MachineHelper.currentMachineCan(RESOURCE_ACTIONS.EDIT);
		const stream = this.state.inbox.stream ? this.state.inbox.stream : { id: 'none' };
		const { tabSelected } = this.state;
		return (
			<Dialog open={this.props.open} onClose={() => this.handleClose()} maxWidth={false}>
				<DialogTitle>
					<FormattedMessage id="InboxSettings.title" defaultMessage="StreamSheet Settings" />
				</DialogTitle>
				<DialogContent
					style={{
						height: 'auto',
						minHeight: '425px',
						minWidth: '600px',
					}}
				>
					<Tabs value={tabSelected} onChange={this.handleTabChange}>
						<Tab label={<FormattedMessage id="Stream" defaultMessage="Stream" />} />
						<Tab label={<FormattedMessage id="Sheet" defaultMessage="Sheet" />} />
					</Tabs>
					{tabSelected === 0 &&
					<TabContainer>
					<div>
						<StreamSelector
							disabled={machine.simulate || !canEdit}
							streams={streams}
							onChange={this.handleStreamChange}
							value={stream}
						/>
						<FormControl
							disabled={!canEdit}
							style={{
								marginBottom: '10px',
								marginTop: '20px',
							}}
						>
							<InputLabel htmlFor="processSetting.triggerType">
								<FormattedMessage
									id="ProcessContainerSettings.calcStreamSheet"
									defaultMessage="Calculate StreamSheet"
								/>
							</InputLabel>
							<Select
								style={{
									width: '380px',
								}}
								value={this.getTriggerType()}
								onChange={this.handleTriggerChange}
								input={<Input name="processSetting.triggerType" id="processSetting.triggerType" />}
							>
								<MenuItem value="none" key="none">
									<em>
										<FormattedMessage id="Never" defaultMessage="Never" />
									</em>
								</MenuItem>
								{triggerTypes.map((t) => (
									<MenuItem value={t.value} key={t.value}>
										{t.label}
									</MenuItem>
								))}
							</Select>
						</FormControl>
						<FormGroup
							style={{
								marginTop: '10px',
							}}
						>
							<FormControlLabel
								control={
									<Checkbox
										checked={this.state.trigger.repeat === 'endless'}
										onChange={this.handleRepeatCalculation}
										disabled={
											this.state.trigger.type === 'none' ||
											(this.state.trigger.type === 'start' &&
												this.state.trigger.repeat === 'endless')
										}
									/>
								}
								// eslint-disable-next-line
								label={
									<FormattedMessage id="ProcessContainerSettings.repeat" defaultMessage="Repeat" />
								}
							/>
						</FormGroup>

						{this.state.trigger.type === 'random' || this.state.trigger.type === 'time' ? (
							<div>
								<TextField
									// eslint-disable-next-line
									label={
										<FormattedMessage
											id="ProcessContainerSettings.starTimeDate"
											defaultMessage="Start Date"
										/>
									}
									type="datetime-local"
									defaultValue={this.state.trigger.start}
									style={{ width: '11rem' }}
									InputLabelProps={{
										shrink: true,
									}}
									onChange={(event) =>
										this.setState({
											trigger: {
												...this.state.trigger,
												start: event.target.value,
											},
										})
									}
									disabled={!canEdit}
								/>
								<TextField
									// eslint-disable-next-line
									label={
										<FormattedMessage
											id="ProcessContainerSettings.interval"
											defaultMessage="Interval"
										/>
									}
									type="number"
									defaultValue={this.state.trigger.interval}
									style={{ width: '9rem' }}
									InputLabelProps={{
										shrink: true,
									}}
									inputProps={{
										min: 0,
										step: 1,
									}}
									onChange={(event) =>
										this.setState({
											trigger: {
												...this.state.trigger,
												interval: event.target.value,
											},
										})
									}
									disabled={!canEdit}
								/>
								<Select
									value={this.state.trigger.intervalUnit || 'ms'}
									// eslint-disable-next-line
									label={
										<FormattedMessage id="ProcessContainerSettings.unit" defaultMessage="Unit" />
									}
									style={{ width: '9rem' }}
									onChange={(event) =>
										this.setState({
											trigger: {
												...this.state.trigger,
												intervalUnit: event.target.value,
											},
										})
									}
									input={
										<Input name="processSetting.intervalUnit" id="processSetting.intervalUnit" />
									}
									disabled={!canEdit}
								>
									<MenuItem value="ms" key="ms">
										<FormattedMessage id="ProcessContainerSettings.ms" defaultMessage="ms" />
									</MenuItem>
									<MenuItem value="s" key="seconds">
										<FormattedMessage
											id="ProcessContainerSettings.seconds"
											defaultMessage="seconds"
										/>
									</MenuItem>
									<MenuItem value="m" key="minutes">
										<FormattedMessage
											id="ProcessContainerSettings.minutes"
											defaultMessage="minutes"
										/>
									</MenuItem>
									<MenuItem value="h" key="hours">
										<FormattedMessage id="ProcessContainerSettings.hours" defaultMessage="hours" />
									</MenuItem>
									<MenuItem value="d" key="days">
										<FormattedMessage id="ProcessContainerSettings.days" defaultMessage="days" />
									</MenuItem>
								</Select>
							</div>
						) : null}
						<FormGroup style={styles.formControl}>
							<div style={{ marginBottom: '5px' }}>
								<FormControlLabel
									disabled={!canEdit}
									control={
										<Checkbox checked={this.state.loop.enabled} onChange={this.handleLoopEnabled} />
									}
									// eslint-disable-next-line
									label={
										<FormattedMessage
											id="ProcessContainerSettings.loopArrayText"
											defaultMessage="Loop"
										/>
									}
								/>
								<FormControlLabel
									control={
										<Checkbox
										checked={!!this.state.loop.recursively}
										onChange={this.handleLoopRecursively}
										/>
									}
									// eslint-disable-next-line
									label={
										<FormattedMessage
										id="ProcessContainerSettings.loopRecursively"
										defaultMessage="Recursively"
										/>
									}
									disabled={!canEdit || !this.state.loop.enabled}
								/>
							</div>
							<TextField
								// eslint-disable-next-line
								label={
									<FormattedMessage
										id="ProcessContainerSettings.loopArray"
										defaultMessage="Loop Array"
									/>
								}
								disabled={!this.state.loop.enabled}
								margin="normal"
								fullWidth
								onChange={this.handleLoopPathChange}
								error={!!this.state.loopPathError}
								helperText={this.state.loopPathError}
								value={this.state.loop.path}
								style={{
									marginLeft: '35px',
									width: '93%',
									marginTop: '2px',
								}}
							/>
						</FormGroup>
						<FormGroup>
							<FormControlLabel
								control={
									<Checkbox
										checked={this.state.preferences.hideMessages}
										onChange={this.handleHideMessages}
									/>
								}
								// eslint-disable-next-line
								label={
									<FormattedMessage
										id="ProcessContainerSettings.hideMessages"
										defaultMessage="Hide Messages"
									/>
								}
								disabled={!canEdit}
							/>
						</FormGroup>
					</div>
					</TabContainer>}
					{tabSelected === 1 &&
					<TabContainer>
						<div
							style={{
								marginTop: '20px',
							}}
						>
							<FormGroup
								style={{
								}}
							>
								<TextField
									label={<FormattedMessage id="Name" defaultMessage="Name" />}
									margin="normal"
									fullWidth
									onChange={this.handleSheetName}
									value={this.state.name}
									disabled={!canEdit}
									error={!Reference.isValidIdentifier(this.state.name)}
									helperText={
										!Reference.isValidIdentifier(this.state.name) ? (
											<FormattedMessage
												id="Reference.InvalidName"
												defaultMessage="Only alphanumeric characters and the underscore are allowed"
											/>
										) : (
											''
										)
									}
								/>
								<div>
									<TextField
										disabled={!canEdit}
										style={{
											marginRight: '20px',
											width: '100px',
										}}
										id="number"
										label={<FormattedMessage id="Columns" defaultMessage="Columns" />}
										inputProps={{
											min: 1,
											max: 50,
											step: 1,
										}}
										error={this.state.preferences.sheetColumns > 50}
										helperText={
											this.state.preferences.sheetColumns > 50 ? (
												<FormattedMessage
													id="ProcessContainerSettings.tooManyColumns"
													defaultMessage="Only 50 columns allowed!"
												/>
											) : (
												''
											)
										}
										value={this.state.preferences.sheetColumns}
										onChange={(event) => this.handleSheetColumns(event)}
										type="number"
										margin="normal"
									/>
									<TextField
										disabled={!canEdit}
										style={{
											width: '100px',
										}}
										id="number"
										label={<FormattedMessage id="Rows" defaultMessage="Rows" />}
										inputProps={{
											min: 1,
											max: 1000,
											step: 1,
										}}
										error={this.state.preferences.sheetRows > 1000}
										helperText={
											this.state.preferences.sheetRows > 1000 ? (
												<FormattedMessage
													id="ProcessContainerSettings.tooManyRows"
													defaultMessage="Only 1000 rows allowed!"
												/>
											) : (
												''
											)
										}
										value={this.state.preferences.sheetRows}
										onChange={(event) => this.handleSheetRows(event)}
										type="number"
										margin="normal"
									/>
								</div>
								<FormControlLabel
									disabled={!canEdit}
									style={{
										marginTop: '15px',
									}}
									control={
										<Checkbox
											checked={this.state.preferences.sheetProtect}
											onChange={this.handleSheetProtect}
										/>
									}
									label={<FormattedMessage id="ProtectSheet" defaultMessage="Protect Sheet" />}
								/>
							</FormGroup>
							<FormLabel
								disabled={!canEdit}
								style={{
									marginTop: '20px',
									display: 'block',
								}}
							>
								<FormattedMessage id="View" defaultMessage="View" />
							</FormLabel>
							<div
								style={{
									display: 'inline-block',
									width: '48%',
									marginTop: '10px',
								}}
							>
								<FormGroup>
									<FormControlLabel
										disabled={!canEdit}
										control={
											<Checkbox
												checked={this.state.preferences.showGrid}
												onChange={this.handleShowGrid}
											/>
										}
										label={<FormattedMessage id="ShowGrid" defaultMessage="Show Grid" />}
									/>
									<FormControlLabel
										disabled={!canEdit}
										control={
											<Checkbox
												checked={this.state.preferences.showHeader}
												onChange={this.handleShowHeader}
											/>
										}
										label={<FormattedMessage id="ShowHeaders" defaultMessage="Show Headers" />}
									/>
									<FormControlLabel
										disabled={!canEdit}
										control={
											<Checkbox
												checked={this.state.preferences.showFormulas}
												onChange={this.handleShowFormulas}
											/>
										}
										label={<FormattedMessage id="ShowFormulas" defaultMessage="Show Formulas" />}
									/>
								</FormGroup>
							</div>
							<div
								style={{
									width: '50%',
									marginTop: '10px',
									display: 'inline-block',
								}}
							>
								<FormGroup>
									<FormControlLabel
										disabled={!canEdit}
										control={
											<Checkbox
												checked={this.state.preferences.showInbox}
												onChange={this.handleShowInbox}
											/>
										}
										label={<FormattedMessage id="ShowInbox" defaultMessage="Show Inbox" />}
									/>
									<FormControlLabel
										disabled={!canEdit}
										control={
											<Checkbox
												checked={this.state.preferences.greyIfRows}
												onChange={this.handleGreyIfRows}
											/>
										}
										label={<FormattedMessage id="GreyIfRows" defaultMessage="Grey IF Rows" />}
									/>
								</FormGroup>
							</div>
						</div>
					</TabContainer>}
				</DialogContent>
				<DialogActions>
					<Button onClick={this.handleClose} color="primary">
						<FormattedMessage id="Cancel" defaultMessage="Cancel" />
					</Button>
					<Button onClick={this.handleSave} color="primary" autoFocus={canEdit}>
						<FormattedMessage id="SaveButton" defaultMessage="Save" />
					</Button>
				</DialogActions>
			</Dialog>
		);
	}
}

function mapStateToProps(state) {
	return {
		open: state.appState.showInboxSettings,
		streams: state.streams,
		machine: state.monitor.machine,
	};
}

function mapDispatchToProps(dispatch) {
	return bindActionCreators(Actions, dispatch);
}

InboxSettings.propTypes = {
	saveProcessSettings: PropTypes.func.isRequired,
	machine: PropTypes.object.isRequired,
};

export default connect(
	mapStateToProps,
	mapDispatchToProps,
)(InboxSettings);
