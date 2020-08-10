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
import MachineHelper from '../../helper/MachineHelper';
import { graphManager } from '../../GraphManager';
import Table from '@material-ui/core/Table';
import TableSortHeader from '../base/addNewDialog/TableSortHeader';
import TableBody from '@material-ui/core/TableBody';
import TableRow from '@material-ui/core/TableRow';
import TableCell from '@material-ui/core/TableCell';
import InputAdornment from '@material-ui/core/InputAdornment';
import IconSearch from '@material-ui/icons/Search';
import StreamWizard from '../Dashboard/StreamWizard';
import StreamSettings from '../Dashboard/StreamSettings';
import Popover from "@material-ui/core/Popover";
import IconButton from "@material-ui/core/IconButton";
import ArrowDropDown from "@material-ui/icons/ArrowDropDown";

const { RESOURCE_ACTIONS } = accessManager;
const {
	AttributeUtils,
	ButtonNode,
	SetNameCommand,
	SetAttributeAtPathCommand,
	CompoundCommand,
	NotificationCenter
} = JSG;

function TabContainer(props) {
	return <Typography component="div">{props.children}</Typography>;
}

TabContainer.propTypes = {
	children: PropTypes.node.isRequired
};

let triggerTypes;

const styles = {
	formControl: {
		marginTop: '10px',
		marginBottom: '10px'
	}
};
const getStreamsFromProps = (props) => {
	if (props.streams && Array.isArray(props.streams.consumers)) {
		return [...props.streams.consumers];
	}
	return [];
};

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
							stream,
						}
					}
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
			anchorEl: null,
			streams,
			streamSortBy: 'name',
			streamSortOrder: 'asc',
			editStream: false,
			showStreamWizard: false,
			filter: '',
			tabSelected: 0,
			expanded: 'basic',
			loopPathError: null,
			showAdvanced: false,
			providerFilter: [],
			preferences: {
				showGrid: true,
				showHeader: true,
				showInbox: true,
				greyIfRows: true,
				sheetColumns: 52,
				sheetRows: 100,
				sheetProtect: false,
				sheetShowFormulas: false
			}
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

	onWizardClose = (consumer) => {
		if (consumer) {
			this.scroll = `stream-${consumer.id}`;
			this.handleStreamChange(consumer);
		}
		this.setState({ showStreamWizard: false, editStream: false });
	};

	handleAddConsumer = () => {
		this.setState({
			showStreamWizard: true,
			activeStep: 'connector',
		})
	};

	handleEditConsumer = () => {
		this.setState({
			editStream: true,
			row: this.state.selected,
		})
	};

	onButtonClicked(notification) {
		if (notification.object) {
			const info = notification.object;
			const item = info.button;
			if (item && (item.getName().getValue() === 'inboxSettings' || item.getName().getValue() === 'settings')) {
				triggerTypes = [
					{
						label: (
							<FormattedMessage
								id="InboxSettings.continuously"
								defaultMessage="Continuously"
							/>
						),
						value: 'continuously'
					},
					{
						// eslint-disable-next-line
						label: (
							<FormattedMessage
								id="InboxSettings.onDataArrival"
								defaultMessage="On Data Arrival"
							/>
						),
						value: 'arrival'
					},
					{
						label: <FormattedMessage id="InboxSettings.onExecute" defaultMessage="On Execute" />,
						value: 'execute'
					},
					{
						// eslint-disable-next-line
						label: (
							<FormattedMessage
								id="InboxSettings.onMachineStart"
								defaultMessage="On Machine Start"
							/>
						),
						value: 'start'
					},
					{
						// eslint-disable-next-line
						label: (
							<FormattedMessage
								id="InboxSettings.onMachineStop"
								defaultMessage="On Machine Stop"
							/>
						),
						value: 'stop'
					},
					{
						label: <FormattedMessage id="InboxSettings.onTime" defaultMessage="On Time" />,
						value: 'time'
					},
					{
						label: <FormattedMessage id="InboxSettings.onRandom" defaultMessage="On Random" />,
						value: 'random'
					}
				];

				const id = info.container
					.getStreamSheetContainerAttributes()
					.getSheetId()
					.getValue();
				const { machine } = this.props;
				this.processSheet = info.container.getStreamSheet();
				const wsAttr = this.processSheet.getWorksheetAttributes();
				const cAttr = info.container.getStreamSheetContainerAttributes();

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
								hideMessages: cAttr.getHideMessages().getValue(),
								showInbox: cAttr.getInboxVisible().getValue(),
								showGrid: wsAttr.getShowGrid().getValue(),
								greyIfRows: wsAttr.getGreyIfRows().getValue(),
								sheetProtect: wsAttr.getProtected().getValue(),
								sheetRows: wsAttr.getRows().getValue(),
								sheetColumns: wsAttr.getColumns().getValue() - 2,
								showHeader: wsAttr.getShowHeader().getValue(),
								showFormulas: wsAttr.getShowFormulas().getValue()
							}
						};
						this.setState(settings);
					}
				}

				this.props.getDataStores().then(() =>
					this.props.setAppState({
						showInboxSettings: true
					})
				);
			}
		}
	}

	getStreams = () => {
		const { streams } = this.state;
		return streams.map((s) => {
			s.provider = this.props.streams.providers.find((p) => p.id === s.providerId);
			return s;
		});
	};

	getFormattedDateString(date) {
		const d = new Date(Date.parse(date));
		return `${d.toLocaleDateString(undefined, {
			year: '2-digit',
			month: '2-digit',
			day: '2-digit'
		})} ${d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`;
	}

	getTriggerType = () => {
		const { type } = this.state.trigger;
		return type === 'start' && this.state.trigger.repeat === 'endless' ? 'continuously' : type;
	};

	handleFilter = (event) => {
		const filter = event.target.value;
		this.setState({
			filter
		});
	};

	handleShowGrid = (event, state) => {
		this.setState({
			preferences: {
				...this.state.preferences,
				showGrid: state
			}
		});
	};

	handleGreyIfRows = (event, state) => {
		this.setState({
			preferences: {
				...this.state.preferences,
				greyIfRows: state
			}
		});
	};

	handleShowHeader = (event, state) => {
		this.setState({
			preferences: {
				...this.state.preferences,
				showHeader: state
			}
		});
	};

	handleShowFormulas = (event, state) => {
		this.setState({
			preferences: {
				...this.state.preferences,
				showFormulas: state
			}
		});
	};

	handleShowInbox = (event, state) => {
		this.setState({
			preferences: {
				...this.state.preferences,
				showInbox: state
			}
		});
	};

	handleSheetProtect = (event, state) => {
		this.setState({
			preferences: {
				...this.state.preferences,
				sheetProtect: state
			}
		});
	};

	handleSheetName = (event) => {
		this.setState({ name: event.target.value });
	};

	handleSheetRows = (event) => {
		this.setState({
			preferences: {
				...this.state.preferences,
				sheetRows: Number(event.target.value)
			}
		});
	};

	handleSheetColumns = (event) => {
		this.setState({
			preferences: {
				...this.state.preferences,
				sheetColumns: Number(event.target.value)
			}
		});
	};

	handleSave = () => {
		const settings = Object.assign({}, { ...this.state });
		if (!settings.inbox.stream || settings.inbox.stream.name === 'none') {
			settings.inbox.stream = {
				name: ''
			};
		}
		delete settings.streams;
		delete settings.loopPathError;

		this.props.saveProcessSettings(settings);

		const getWorksheetCommand = (valuePath, value) => {
			const path = AttributeUtils.createPath(JSG.WorksheetAttributes.NAME, valuePath);
			return new SetAttributeAtPathCommand(this.processSheet, path, value);
		};
		const getContainerCommand = (valuePath, value) => {
			const path = AttributeUtils.createPath(JSG.StreamSheetContainerAttributes.NAME, valuePath);
			return new SetAttributeAtPathCommand(this.processSheet.getStreamSheetContainer(), path, value);
		};

		const cmd = new CompoundCommand();
		cmd.add(new SetNameCommand(this.processSheet, this.state.name));
		cmd.add(getWorksheetCommand(JSG.WorksheetAttributes.SHOWGRID, this.state.preferences.showGrid));
		cmd.add(getWorksheetCommand(JSG.WorksheetAttributes.SHOWHEADER, this.state.preferences.showHeader));
		cmd.add(getWorksheetCommand(JSG.WorksheetAttributes.SHOWFORMULAS, this.state.preferences.showFormulas));
		cmd.add(getWorksheetCommand(JSG.WorksheetAttributes.PROTECTED, this.state.preferences.sheetProtect));
		cmd.add(getWorksheetCommand(JSG.WorksheetAttributes.GREYIFROWS, this.state.preferences.greyIfRows));
		cmd.add(getWorksheetCommand(JSG.WorksheetAttributes.ROWS, this.state.preferences.sheetRows));
		cmd.add(getWorksheetCommand(JSG.WorksheetAttributes.COLUMNS, this.state.preferences.sheetColumns + 2));

		cmd.add(getContainerCommand(JSG.StreamSheetContainerAttributes.HIDEMESSAGES, this.state.preferences.hideMessages));
		cmd.add(getContainerCommand(JSG.StreamSheetContainerAttributes.INBOXVISIBLE, this.state.preferences.showInbox));

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

	handleLoopPathChange = (event) => {
		const path = event.target.value;
		try {
			this.parsePath(path);
			this.setState({
				loopPathError: null
			});
		} catch (e) {
			this.setState({
				loopPathError: e.message
			});
		}
		this.setState({
			loop: {
				...this.state.loop,
				path
			}
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
				hideMessages: state
			}
		});
	};

	handleClose = () => {
		this.props.setAppState({ showInboxSettings: false });
	};

	handleChange = (panel) => (event, expanded) => {
		this.setState({
			expanded: expanded ? panel : false
		});
	};

	handleStreamChange = (newStream, callback) => {
		if (newStream) {
			const streamDesc = {
				name: newStream.name || 'none',
				id: newStream.id,
				stream: newStream,
			};
			this.setState({
				inbox: {
					...this.state.inbox,
					stream: streamDesc
				},
				anchorEl: null,
			}, callback);
		} else {
			this.setState({
				inbox: {
					...this.state.inbox,
					stream: { id: 'none' }
				},
				anchorEl: null,
			});
		}
	};

	getHeader() {
		const fields = [];

		fields.push({ name: 'Admin.#all_provs', selected: this.state.providerFilter.length === 0 });

		this.props.streams.providers.forEach((provider) => {
			fields.push({ name: provider.name, selected: !this.state.providerFilter.includes(provider.name) });
		});

		return [
			{
				id: 'name',
				numeric: false,
				disablePadding: true,
				label: 'Streams.Name',
				width: '42%'
			},
			{
				id: 'provider',
				numeric: false,
				disablePadding: true,
				label: 'Streams.Provider',
				width: '25%',
				fields
			},
			{
				id: 'lastModified',
				numeric: false,
				disablePadding: true,
				label: 'Streams.LastModified',
				width: '22%'
			}
		];
	}

	getResources = (streams) => {
		const result = [];

		streams.forEach((consumer) => {
			const index = this.state.providerFilter.indexOf(consumer.provider.name);
			if (index === -1 && consumer.name.toLowerCase().includes(this.state.filter.toLowerCase())) {
				result.push(consumer);
			}
		});

		result.sort((a, b) => {
			const dir = this.state.streamSortOrder === 'asc' ? 1 : -1;

			switch (this.state.streamSortBy) {
				case 'provider': {
					const aName = a[this.state.streamSortBy].name || '';
					const bName = b[this.state.streamSortBy].name || '';
					if (aName.toLowerCase() > bName.toLowerCase()) {
						return dir;
					} else if (aName.toLowerCase() < bName.toLowerCase()) {
						return -1 * dir;
					}
					return 0;
				}
				case 'name': {
					const aName = a[this.state.streamSortBy] || '';
					const bName = b[this.state.streamSortBy] || '';
					if (aName.toLowerCase() > bName.toLowerCase()) {
						return dir;
					} else if (aName.toLowerCase() < bName.toLowerCase()) {
						return -1 * dir;
					}
					return 0;
				}
				case 'lastModified': {
					const aLastModified = a.lastModifiedDate || new Date().toISOString();
					const bLastModified = b.lastModifiedDate || new Date().toISOString();
					const res = new Date(aLastModified) - new Date(bLastModified);
					return dir * res;
				}
				default:
					return 0;
			}
		});

		return result;
	};

	handleTableSort = (event, property) => {
		const orderBy = property;
		const order =
			(this.state.streamSortBy === property && this.state.streamSortOrder === 'desc') ||
			this.state.streamSortBy !== property
				? 'asc'
				: 'desc';

		this.setState({
			streamSortBy: orderBy,
			streamSortOrder: order
		});
	};

	onFieldToggle(field, state) {
		if (state) {
			if (field.name === 'Admin.#all_provs') {
				this.state.providerFilter = [];
			} else {
				const index = this.state.providerFilter.indexOf(field.name);
				if (index !== -1) {
					this.state.providerFilter.splice(index, 1);
				}
			}
		} else if (field.name === 'Admin.#all_provs') {
			this.props.streams.providers.forEach((provider) => {
				this.state.providerFilter.push(provider.name);
			});
		} else {
			this.state.providerFilter.push(field.name);
		}

		this.setState({ providerFilter: this.state.providerFilter });
	}

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

	handleConsumerClose = () => {
		this.setState({
			anchorEl: null,
		});
	};

	handleConsumerClick = (event) => {
		this.setState({
			anchorEl: event.currentTarget
		});
	};

	render() {
		if (!this.state.id || !this.props.open) {
			return null;
		}
		const streams = this.getStreams();
		const canEdit = MachineHelper.currentMachineCan(RESOURCE_ACTIONS.EDIT);
		const { tabSelected, filter } = this.state;

		if (this.scroll) {
			const sel = document.getElementById(this.scroll);
			if (sel && sel.scrollIntoView) {
				sel.scrollIntoView(true);
				this.scroll = undefined;
			}
		}

		return (
			<Dialog open={this.props.open} onClose={() => this.handleClose()} maxWidth={false}>
				<DialogTitle>
					<FormattedMessage id="InboxSettings.title" defaultMessage="StreamSheet Settings" />
				</DialogTitle>
				<DialogContent
					style={{
						height: 'auto',
						minHeight: '440px',
						minWidth: '550px',
						paddingBottom: '0px',
					}}
				>
					<Tabs textColor="primary" value={tabSelected} onChange={this.handleTabChange}>
						<Tab label={<FormattedMessage id="Stream" defaultMessage="Stream" />} />
						<Tab label={<FormattedMessage id="Sheet" defaultMessage="Sheet" />} />
					</Tabs>
					{tabSelected === 0 && (
						<TabContainer>
							<FormGroup>
								<div
									style={{
										display: 'flex',
										marginBottom: '10px',
										marginTop: '25px'
									}}
								>
										<TextField
											style={{
												width: '65%',
												cursor: 'pointer',
											}}
											id="ibconsumerselect"
											onClick={this.handleConsumerClick}
											label={
												<FormattedMessage id="InboxSettings.SelectConsumer" defaultMessage="Please select a Consumer:" />
											}
											inputProps={{
												readOnly: true,
												style: { cursor: 'pointer' },											}}
											value={this.state.inbox.stream === null || this.state.inbox.stream.id === 'none' ? 'None' : this.state.inbox.stream.name}
											disabled={!canEdit}
										/>
									<IconButton
										disabled={!canEdit}
										style={{
											padding: '0px',
											height: '25px',
											position: 'relative',
											left: '-23px',
											top: '19px',
										}}
										size="small"
										onClick={this.handleConsumerClick}>
										<ArrowDropDown />
									</IconButton>
										<Button
											color="primary"
											onClick={this.handleEditConsumer}
											disabled={!canEdit || this.state.inbox.stream === null || this.state.inbox.stream.id === 'none'}
										>
											<FormattedMessage id="DialogNew.EditConsumer" defaultMessage="Edit Consumer" />
										</Button>
								</div>
								<Popover
									open={Boolean(this.state.anchorEl)}
									anchorEl={document.getElementById('ibconsumerselect')}
									anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
									transformOrigin={{ horizontal: 'left', vertical: 'top' }}
									onClose={this.handleConsumerClose}
								>
									<div
										style={{
											width: '450px',
											margin: '20px',
										}}
									>
										<div
											style={{
												width: '100%',
												display: 'flex',
												justifyContent: 'space-between',
												verticalAlign: 'middle'
											}}
										>
											<FormLabel
												style={{
													marginTop: '10px',
													fontSize: '13px',
													display: 'inline-block'
												}}
											>
												<FormattedMessage id="InboxSettings.SelectConsumer" defaultMessage="Please select a Consumer:" />
											</FormLabel>
											<Input
												onChange={this.handleFilter}
												style={{ marginBottom: '8px', width: '35%' }}
												startAdornment={
													<InputAdornment position="start">
														<IconSearch />
													</InputAdornment>
												}
												defaultValue={filter}
												type="search"
											/>
										</div>
										<div
											style={{
												border: '1px solid grey',
												height: '310px',
												overflow: 'auto',
												padding: '5px'
											}}
										>
											<Table>
												<TableSortHeader
													cells={this.getHeader()}
													orderBy={this.state.streamSortBy}
													order={this.state.streamSortOrder}
													onRequestSort={this.handleTableSort}
													onFieldToggle={(field, state) => this.onFieldToggle(field, state)}
												/>
												<TableBody>
													<TableRow
														style={{
															height: '35px',
															cursor: 'pointer',
														}}
														key="no_stream"
														hover
														selected={
															this.state.inbox.stream === null ||
															this.state.inbox.stream.id === 'none'
														}
														onClick={() => this.handleStreamChange()}
														tabIndex={-1}
													>
														<TableCell component="th" scope="row" padding="none">
															<FormattedMessage
																id="DialogNew.noStream"
																defaultMessage="None"
															/>
														</TableCell>
														<TableCell />
														<TableCell />
													</TableRow>
													{this.getResources(streams).map((resource) => (
														<TableRow
															style={{
																height: '35px',
																cursor: 'pointer',
															}}
															hover
															onClick={() => this.handleStreamChange(resource)}
															selected={
																this.state.inbox.stream &&
																resource.id === this.state.inbox.stream.id
															}
															tabIndex={-1}
															id={`stream-${resource.id}`}
															key={`${resource.className}-${resource.id}`}
														>
															<TableCell component="th" scope="row" padding="none">
																<img
																	style={{ verticalAlign: 'bottom', paddingRight: '6px' }}
																	width={15}
																	height={15}
																	src={StreamHelper.getIconForState(resource.state)}
																	alt="state"
																/>

																{resource.name}
															</TableCell>
															<TableCell component="th" scope="row" padding="none">
																{resource.provider.name}
															</TableCell>
															<TableCell padding="none">
																{this.getFormattedDateString(resource.lastModified)}
															</TableCell>
														</TableRow>
													))}
												</TableBody>
											</Table>
										</div>
									</div>
								</Popover>
									<FormControl
										disabled={!canEdit}
										style={{
											marginBottom: '10px',
											marginTop: '0px'
										}}
									>
										<InputLabel htmlFor="processSetting.triggerType">
											<FormattedMessage
												id="InboxSettings.calcStreamSheet"
												defaultMessage="Calculate StreamSheet"
											/>
										</InputLabel>
										<Select
											style={{
												width: '65%'
											}}
											value={this.getTriggerType()}
											onChange={this.handleTriggerChange}
											input={
												<Input
													name="processSetting.triggerType"
													id="processSetting.triggerType"
												/>
											}
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
											marginTop: '10px'
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
												<FormattedMessage
													id="InboxSettings.repeat"
													defaultMessage="Repeat"
												/>
											}
										/>
									</FormGroup>

									{this.state.trigger.type === 'random' || this.state.trigger.type === 'time' ? (
										<div>
											<TextField
												// eslint-disable-next-line
												label={
													<FormattedMessage
														id="InboxSettings.starTimeDate"
														defaultMessage="Start Date"
													/>
												}
												type="datetime-local"
												defaultValue={this.state.trigger.start}
												style={{ width: '11rem' }}
												InputLabelProps={{
													shrink: true
												}}
												onChange={(event) =>
													this.setState({
														trigger: {
															...this.state.trigger,
															start: event.target.value
														}
													})
												}
												disabled={!canEdit}
											/>
											<TextField
												// eslint-disable-next-line
												label={
													<FormattedMessage
														id="InboxSettings.interval"
														defaultMessage="Interval"
													/>
												}
												type="number"
												defaultValue={this.state.trigger.interval}
												style={{ width: '9rem' }}
												InputLabelProps={{
													shrink: true
												}}
												inputProps={{
													min: 0,
													step: 1
												}}
												onChange={(event) =>
													this.setState({
														trigger: {
															...this.state.trigger,
															interval: event.target.value
														}
													})
												}
												disabled={!canEdit}
											/>
											<Select
												value={this.state.trigger.intervalUnit || 'ms'}
												// eslint-disable-next-line
												label={
													<FormattedMessage
														id="InboxSettings.unit"
														defaultMessage="Unit"
													/>
												}
												style={{ width: '9rem' }}
												onChange={(event) =>
													this.setState({
														trigger: {
															...this.state.trigger,
															intervalUnit: event.target.value
														}
													})
												}
												input={
													<Input
														name="processSetting.intervalUnit"
														id="processSetting.intervalUnit"
													/>
												}
												disabled={!canEdit}
											>
												<MenuItem value="ms" key="ms">
													<FormattedMessage
														id="InboxSettings.ms"
														defaultMessage="ms"
													/>
												</MenuItem>
												<MenuItem value="s" key="seconds">
													<FormattedMessage
														id="InboxSettings.seconds"
														defaultMessage="seconds"
													/>
												</MenuItem>
												<MenuItem value="m" key="minutes">
													<FormattedMessage
														id="InboxSettings.minutes"
														defaultMessage="minutes"
													/>
												</MenuItem>
												<MenuItem value="h" key="hours">
													<FormattedMessage
														id="InboxSettings.hours"
														defaultMessage="hours"
													/>
												</MenuItem>
												<MenuItem value="d" key="days">
													<FormattedMessage
														id="InboxSettings.days"
														defaultMessage="days"
													/>
												</MenuItem>
											</Select>
										</div>
									) : null}
									<FormGroup style={styles.formControl}>
										<div style={{ marginBottom: '5px' }}>
											<FormControlLabel
												disabled={!canEdit}
												control={
													<Checkbox
														checked={this.state.loop.enabled}
														onChange={this.handleLoopEnabled}
													/>
												}
												// eslint-disable-next-line
												label={
													<FormattedMessage
														id="InboxSettings.loopArrayText"
														defaultMessage="Loop"
													/>
												}
											/>
										</div>
										<TextField
											// eslint-disable-next-line
											label={
												<FormattedMessage
													id="InboxSettings.loopArray"
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
												width: '59%',
												marginTop: '2px'
											}}
										/>
										<FormControlLabel
											style={{
												marginLeft: '20px',
											}}
											control={
												<Checkbox
													checked={!!this.state.loop.recursively}
													onChange={this.handleLoopRecursively}
												/>
											}
											// eslint-disable-next-line
											label={
												<FormattedMessage
													id="InboxSettings.loopRecursively"
													defaultMessage="Recursively"
												/>
											}
											disabled={!canEdit || !this.state.loop.enabled}
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
													id="InboxSettings.hideMessages"
													defaultMessage="Hide Messages"
												/>
											}
											disabled={!canEdit}
										/>
									</FormGroup>
							</FormGroup>
							{this.state.showStreamWizard ? (
								<StreamWizard
									onClose={this.onWizardClose}
									initialStep={this.state.activeStep}
									connector={undefined}
									type="consumer"
									open={this.state.showStreamWizard}
									streams={this.props.streams}
								/>) : null}
							{this.state.editStream ? (
								<StreamSettings
									onClose={this.onWizardClose}
									stream={this.state.inbox.stream.stream}
									type="consumer"
									open={this.state.editStream}
									streams={this.props.streams}
								/>) : null}
						</TabContainer>
					)}
					{tabSelected === 1 && (
						<TabContainer>
							<div
								style={{
									display: 'flex',
								}}
							>
								<div
									style={{
										marginTop: '35px',
										marginRight: '40px',
										width: '40%',
									}}
								>
									<FormLabel
										disabled={!canEdit}
										style={{
											display: 'block'
										}}
									>
										<FormattedMessage id="Settings" defaultMessage="Settings" />
									</FormLabel>
									<FormGroup style={{}}>
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
										<TextField
											disabled={!canEdit}
											style={{
												marginRight: '20px',
												width: '100px'
											}}
											id="number"
											label={<FormattedMessage id="Columns" defaultMessage="Columns" />}
											inputProps={{
												min: 1,
												max: 50,
												step: 1
											}}
											error={this.state.preferences.sheetColumns > 50}
											helperText={
												this.state.preferences.sheetColumns > 50 ? (
													<FormattedMessage
														id="InboxSettings.tooManyColumns"
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
												width: '100px'
											}}
											id="number"
											label={<FormattedMessage id="Rows" defaultMessage="Rows" />}
											inputProps={{
												min: 1,
												max: 1000,
												step: 1
											}}
											error={this.state.preferences.sheetRows > 1000}
											helperText={
												this.state.preferences.sheetRows > 1000 ? (
													<FormattedMessage
														id="InboxSettings.tooManyRows"
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
										<FormControlLabel
											disabled={!canEdit}
											style={{
												marginTop: '15px'
											}}
											control={
												<Checkbox
													checked={this.state.preferences.sheetProtect}
													onChange={this.handleSheetProtect}
												/>
											}
											label={
												<FormattedMessage id="ProtectSheet" defaultMessage="Protect Sheet" />
											}
										/>
									</FormGroup>
								</div>
								<div
									style={{
										marginTop: '35px',
										width: '40%',
									}}
								>
									<FormLabel
										disabled={!canEdit}
										style={{
											display: 'block'
										}}
									>
										<FormattedMessage id="View" defaultMessage="View" />
									</FormLabel>
									<div
										style={{
											display: 'inline-block',
											marginTop: '10px'
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
												label={
													<FormattedMessage id="ShowHeaders" defaultMessage="Show Headers" />
												}
											/>
											<FormControlLabel
												disabled={!canEdit}
												control={
													<Checkbox
														checked={this.state.preferences.showFormulas}
														onChange={this.handleShowFormulas}
													/>
												}
												label={
													<FormattedMessage
														id="ShowFormulas"
														defaultMessage="Show Formulas"
													/>
												}
											/>
										</FormGroup>
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
												label={
													<FormattedMessage id="GreyIfRows" defaultMessage="Grey IF Rows" />
												}
											/>
										</FormGroup>
									</div>
								</div>
							</div>
						</TabContainer>
					)}
				</DialogContent>
				<DialogActions style={{ justifyContent: 'space-between', padding: '0px 13px 4px 11px' }}>
					{tabSelected === 0 ? (
						<div>
							<Button
								disabled={!canEdit}
								color="primary" onClick={this.handleAddConsumer}>
								<FormattedMessage id="DialogNew.AddConsumer" defaultMessage="Add Consumer" />
							</Button>
						</div>
					) : (
						<div />
					)}
					<div>
						<Button color="primary" onClick={this.handleClose}>
							<FormattedMessage id="Cancel" defaultMessage="Cancel" />
						</Button>
						<Button color="primary" onClick={this.handleSave} autoFocus={canEdit}>
							<FormattedMessage id="SaveButton" defaultMessage="Save" />
						</Button>
					</div>
				</DialogActions>
			</Dialog>
		);
	}
}

function mapStateToProps(state) {
	return {
		open: state.appState.showInboxSettings,
		streams: state.streams,
		machine: state.monitor.machine
	};
}

function mapDispatchToProps(dispatch) {
	return bindActionCreators(Actions, dispatch);
}

InboxSettings.propTypes = {
	saveProcessSettings: PropTypes.func.isRequired,
	machine: PropTypes.object.isRequired
};

export default connect(mapStateToProps, mapDispatchToProps)(InboxSettings);
