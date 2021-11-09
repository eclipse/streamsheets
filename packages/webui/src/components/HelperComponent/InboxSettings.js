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
import MenuItem from '@material-ui/core/MenuItem';
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
import TableSortHeader from './TableSortHeader';
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
const getLimitText = (streamsheet) => {
	const maxchars = streamsheet ? streamsheet.sheet.settings.maxchars : undefined;
	const enabled = maxchars != null && maxchars > 0;
	return {
		enabled,
		maxchars: enabled ? maxchars : 1000
	};
};
const getMaxChars = (limitText) => {
	if (!limitText) return undefined;
	return limitText.enabled ? limitText.maxchars : -1;
};
const createStreamDescr = (stream) => {
	if (stream && stream.id !== 'none' && stream.name !== 'none') return { id: stream.id, name: stream.name };
	return { id: 'none', name: '' };
};

// const updatePrefState = (prop, component) => (event, state) => updatePreferences({ [prop]: state }, component);
const updatePreferences = (valobj, component) => {
	component.setState({
		preferences: {
			...component.state.preferences,
			...valobj
		}
	});
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
				name: '',
				showGrid: true,
				showHeader: true,
				showInbox: true,
				greyIfRows: true,
				sheetColumns: 52,
				sheetRows: 100,
				sheetProtect: false,
				showFormulas: false,
				hideMessages: false,
				limitText: { enabled: true, maxchars: 1000 },
				loop: { enabled: false, path: '', recursively: false },
				trigger: { type: 'none', repeat: 'once' }
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
						const { loop, trigger } = streamsheet;
						const settings = {
							tabSelected: item.getName().getValue() === 'settings' ? 1 : 0,
							...streamsheet,
							machineId: machine.id,
							streamsheetId: streamsheet.id,
							preferences: {
								...this.state.preferences,
								name: this.processSheet.getName().getValue(),
								hideMessages: cAttr.getHideMessages().getValue(),
								showInbox: cAttr.getInboxVisible().getValue(),
								showGrid: wsAttr.getShowGrid().getValue(),
								greyIfRows: wsAttr.getGreyIfRows().getValue(),
								sheetProtect: wsAttr.getProtected().getValue(),
								sheetRows: wsAttr.getRows().getValue(),
								sheetColumns: wsAttr.getColumns().getValue() - 2,
								showHeader: wsAttr.getShowHeader().getValue(),
								showFormulas: wsAttr.getShowFormulas().getValue(),
								limitText: getLimitText(streamsheet),
								loop: { enabled: !!loop.enabled, path: loop.path, recursively: !!loop.recursively },
								trigger: { type: 'none', repeat: 'once', ...trigger }
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

	handleFilter = (event) => {
		const filter = event.target.value;
		this.setState({
			filter
		});
	};

	handleShowGrid = (event, state) => {
		updatePreferences({ showGrid: state }, this);
	};

	handleGreyIfRows = (event, state) => {
		updatePreferences({ greyIfRows: state }, this);
	};

	handleShowHeader = (event, state) => {
		updatePreferences({ showHeader: state }, this);
	};

	handleShowFormulas = (event, state) => {
		updatePreferences({ showFormulas: state }, this);
	};

	handleShowInbox = (event, state) => {
		updatePreferences({ showInbox: state }, this);
	};

	handleSheetProtect = (event, state) => {
		updatePreferences({ sheetProtect: state }, this);
	};

	handleSheetName = (event) => {
		updatePreferences({ name: event.target.value }, this);
	};

	handleSheetRows = (event) => {
		updatePreferences({ sheetRows: Number(event.target.value) }, this);
	};

	handleSheetColumns = (event) => {
		updatePreferences({ sheetColumns: Number(event.target.value) }, this);
	};

	handleLimitTextEnabled = (event, state) => {
		const enabled = state;
		const limitText = { ...this.state.preferences.limitText, enabled };
		updatePreferences({ limitText }, this);
	}
	handleLimitTextMaxChars = (event) => {
		const limitText = { ...this.state.preferences.limitText, maxchars: Number(event.target.value) };
		updatePreferences({ limitText }, this);
	};

	parsePath(path) {
		// TODO: improve
		if (!path) return '';
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
			this.setState({ loopPathError: null });
		} catch (e) {
			this.setState({ loopPathError: e.message });
		}
		updatePreferences({ loop: { ...this.state.preferences.loop, path } }, this);
	};
	handleLoopEnabled = (event, state) => {
		const enabled = state;
		if (!enabled) this.setState({ loopPathError: null });
		updatePreferences({ loop: { ...this.state.preferences.loop, enabled } }, this);
	};
	handleLoopRecursively = (event, state) => {
		const recursively = state;
		updatePreferences({ loop: { ...this.state.preferences.loop, recursively } }, this);
	};

	handleTriggerChange = (valobj) => {
		updatePreferences({	trigger: { ...this.state.preferences.trigger, ...valobj } }, this);
	};

	handleHideMessages = (event, state) => {
		updatePreferences({ hideMessages: state }, this);
	};

	handleSave = () => {
		const { inbox, preferences, machineId, streamsheetId } = this.state;
		const settings = {
			machineId,
			streamsheetId,
			name: preferences.name,
			sheet: {
				maxrow: preferences.sheetRows,
				maxcol: preferences.sheetColumns,
				maxchars: getMaxChars(preferences.limitText),
				protected: preferences.sheetProtect
			},
			inbox: { stream: createStreamDescr(inbox.stream) },
			loop: { ...preferences.loop },
			trigger: { ...preferences.trigger }
		}
		if (this.state.loopPathError) settings.loop.path = '';
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
		cmd.add(new SetNameCommand(this.processSheet, preferences.name));
		cmd.add(getWorksheetCommand(JSG.WorksheetAttributes.SHOWGRID, preferences.showGrid));
		cmd.add(getWorksheetCommand(JSG.WorksheetAttributes.SHOWHEADER, preferences.showHeader));
		cmd.add(getWorksheetCommand(JSG.WorksheetAttributes.SHOWFORMULAS, preferences.showFormulas));
		cmd.add(getWorksheetCommand(JSG.WorksheetAttributes.PROTECTED, preferences.sheetProtect));
		cmd.add(getWorksheetCommand(JSG.WorksheetAttributes.GREYIFROWS, preferences.greyIfRows));
		cmd.add(getWorksheetCommand(JSG.WorksheetAttributes.ROWS, preferences.sheetRows));
		cmd.add(getWorksheetCommand(JSG.WorksheetAttributes.COLUMNS, preferences.sheetColumns + 2));

		cmd.add(getContainerCommand(JSG.StreamSheetContainerAttributes.HIDEMESSAGES, preferences.hideMessages));
		cmd.add(getContainerCommand(JSG.StreamSheetContainerAttributes.INBOXVISIBLE, preferences.showInbox));

		graphManager.synchronizedExecute(cmd);

		this.handleClose();
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
					stream: { name: 'none', id: 'none' }
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
				label: 'Streams.Name',
				width: '42%'
			},
			{
				id: 'provider',
				numeric: false,
				label: 'Streams.Provider',
				width: '25%',
				fields
			},
			{
				id: 'lastModified',
				numeric: false,
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
		const { tabSelected, filter, preferences } = this.state;

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
											variant="outlined"
											size="small"
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
											left: '-27px',
											top: '7px',
										}}
										size="small"
										onClick={this.handleConsumerClick}>
										<ArrowDropDown />
									</IconButton>
										<Button
											style={{
												height: '40px'
											}}
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
											width: '500px',
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
												height: '310px',
												overflow: 'auto',
												marginTop: '15px'
											}}
										>
											<Table stickyHeader size="small">
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
									>
										<TextField
											select
											variant="outlined"
											size="small"
											margin="normal"
											style={{
												width: '65%'
											}}
											value={preferences.trigger.type}
											onChange={(event) => this.handleTriggerChange({
												type: event.target.value,
												// endlessly should be selected explicitly so:
												repeat: 'once'
											})}
											label={
												<FormattedMessage
													id="InboxSettings.calcStreamSheet"
													defaultMessage="Calculate StreamSheet"
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
										</TextField>
									</FormControl>
									<FormGroup
										style={{
											marginTop: '10px'
										}}
									>
										<FormControlLabel
											control={
												<Checkbox
													checked={preferences.trigger.repeat === 'endless'}
													onChange={(event, state) => this.handleTriggerChange({
															repeat: state ? 'endless' : 'once'
													})}
													disabled={preferences.trigger.type === 'none'}
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

									{preferences.trigger.type === 'random' || preferences.trigger.type === 'time' ? (
										<div>
											<TextField
												variant="outlined"
												size="small"
												margin="normal"
												label={
													<FormattedMessage
														id="InboxSettings.starTimeDate"
														defaultMessage="Start Date"
													/>
												}
												type="datetime-local"
												defaultValue={preferences.trigger.start}
												style={{ width: '11rem', marginRight: '10px' }}
												InputLabelProps={{
													shrink: true
												}}
												onChange={(event) => this.handleTriggerChange({
													start: event.target.value
												})}
												disabled={!canEdit}
											/>
											<TextField
												variant="outlined"
												size="small"
												margin="normal"
												label={
													<FormattedMessage
														id="InboxSettings.interval"
														defaultMessage="Interval"
													/>
												}
												type="number"
												defaultValue={preferences.trigger.interval}
												style={{ width: '4rem', marginRight: '10px' }}
												InputLabelProps={{
													shrink: true
												}}
												inputProps={{
													min: 0,
													step: 1
												}}
												onChange={(event) => this.handleTriggerChange({
													interval: event.target.value
												})}
												disabled={!canEdit}
											/>
											<TextField
												variant="outlined"
												size="small"
												margin="normal"
												select
												value={preferences.trigger.intervalUnit || 'ms'}
												// eslint-disable-next-line
												label={
													<FormattedMessage
														id="InboxSettings.unit"
														defaultMessage="Unit"
													/>
												}
												style={{ width: '9rem' }}
												onChange={(event) => this.handleTriggerChange({
													intervalUnit: event.target.value
												})}
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
											</TextField>
										</div>
									) : null}
									<FormGroup style={styles.formControl}>
										<div style={{ marginBottom: '5px' }}>
											<FormControlLabel
												disabled={!canEdit}
												control={
													<Checkbox
														checked={preferences.loop.enabled}
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
											variant="outlined"
											size="small"
											label={
												<FormattedMessage
													id="InboxSettings.loopArray"
													defaultMessage="Loop Array"
												/>
											}
											disabled={!preferences.loop.enabled}
											margin="normal"
											fullWidth
											onChange={this.handleLoopPathChange}
											error={!!this.state.loopPathError}
											helperText={this.state.loopPathError}
											value={preferences.loop.path}
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
													checked={!!preferences.loop.recursively}
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
											disabled={!canEdit || !preferences.loop.enabled}
										/>
									</FormGroup>
									<FormGroup>
										<FormControlLabel
											control={
												<Checkbox
													checked={preferences.hideMessages}
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
											variant="outlined"
											size="small"
											margin="normal"
											fullWidth
											onChange={this.handleSheetName}
											value={preferences.name}
											disabled={!canEdit}
											error={!Reference.isValidIdentifier(preferences.name)}
											helperText={
												!Reference.isValidIdentifier(preferences.name) ? (
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
											variant="outlined"
											size="small"
											margin="normal"
											label={<FormattedMessage id="Columns" defaultMessage="Columns" />}
											inputProps={{
												min: 1,
												max: 50,
												step: 1
											}}
											error={preferences.sheetColumns > 50}
											helperText={
												preferences.sheetColumns > 50 ? (
													<FormattedMessage
														id="InboxSettings.tooManyColumns"
														defaultMessage="Only 50 columns allowed!"
													/>
												) : (
													''
												)
											}
											value={preferences.sheetColumns}
											onChange={(event) => this.handleSheetColumns(event)}
											type="number"
										/>
										<TextField
											disabled={!canEdit}
											style={{
												width: '100px'
											}}
											variant="outlined"
											size="small"
											margin="normal"
											id="number"
											label={<FormattedMessage id="Rows" defaultMessage="Rows" />}
											inputProps={{
												min: 1,
												max: 1000,
												step: 1
											}}
											error={preferences.sheetRows > 1000}
											helperText={
												preferences.sheetRows > 1000 ? (
													<FormattedMessage
														id="InboxSettings.tooManyRows"
														defaultMessage="Only 1000 rows allowed!"
													/>
												) : (
													''
												)
											}
											value={preferences.sheetRows}
											onChange={(event) => this.handleSheetRows(event)}
											type="number"
										/>
										<FormControlLabel
											disabled={!canEdit}
											style={{
												marginTop: '15px'
											}}
											control={
												<Checkbox
													checked={preferences.sheetProtect}
													onChange={this.handleSheetProtect}
												/>
											}
											label={
												<FormattedMessage id="ProtectSheet" defaultMessage="Protect Sheet" />
											}
										/>
									<FormGroup style={styles.formControl}>
										<div style={{ marginBottom: '5px' }}>
											<FormControlLabel
												disabled={!canEdit}
												control={
													<Checkbox
														checked={preferences.limitText.enabled}
														onChange={this.handleLimitTextEnabled}
													/>
												}
												// eslint-disable-next-line
												label={
													<FormattedMessage
														id="InboxSettings.limitText.checkbox"
														defaultMessage="Limit text in cells"
													/>
												}
											/>
										</div>
										<TextField
											label={<FormattedMessage id="InboxSettings.limitText.textfield" defaultMessage="Max. Characters" />}
											type="number"
											disabled={!canEdit || !preferences.limitText.enabled}
											variant="outlined"
											value={preferences.limitText.maxchars}
											onChange={this.handleLimitTextMaxChars}
											margin="normal"
											size="small"
											style={{
												marginTop: '2px',
												marginLeft: '35px',
												width: '120px'
											}}
											inputProps={{
												min: 1,
												max: Number.MAX_SAFE_INTEGER,
												step: 1
											}}
											error={preferences.limitText.maxchars > Number.MAX_SAFE_INTEGER}
											helperText={
												preferences.limitText.maxchars > Number.MAX_SAFE_INTEGER ? (
													<FormattedMessage
													id="InboxSettings.limitText.error"
													defaultMessage="At most {maxchars} characters allowed!"
													values={{
															maxchars: Number.MAX_SAFE_INTEGER
														}}
														/>
														) : (
															''
															)
														}
										/>
										</FormGroup>
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
														checked={preferences.showGrid}
														onChange={this.handleShowGrid}
													/>
												}
												label={<FormattedMessage id="ShowGrid" defaultMessage="Show Grid" />}
											/>
											<FormControlLabel
												disabled={!canEdit}
												control={
													<Checkbox
														checked={preferences.showHeader}
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
														checked={preferences.showFormulas}
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
														checked={preferences.showInbox}
														onChange={this.handleShowInbox}
													/>
												}
												label={<FormattedMessage id="ShowInbox" defaultMessage="Show Inbox" />}
											/>
											<FormControlLabel
												disabled={!canEdit}
												control={
													<Checkbox
														checked={preferences.greyIfRows}
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
						<Button
							color="primary"
							disabled={!!this.state.loopPathError}
							onClick={this.handleSave}
							autoFocus={canEdit}>
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
