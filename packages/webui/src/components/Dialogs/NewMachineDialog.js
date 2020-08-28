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
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { FormattedMessage, injectIntl } from 'react-intl';
import * as Actions from '../../actions/actions';
import StreamHelper from '../../helper/StreamHelper';
import { Path } from '../../helper/Path';
import SortSelector from "../base/sortSelector/SortSelector";
import Dialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent";
import TextField from "@material-ui/core/TextField";
import Paper from "@material-ui/core/Paper";
import FormLabel from "@material-ui/core/FormLabel";
import Input from "@material-ui/core/Input";
import InputAdornment from "@material-ui/core/InputAdornment";
import IconSearch from "@material-ui/icons/Search";
import TableContainer from "@material-ui/core/TableContainer";
import Table from "@material-ui/core/Table";
import TableSortHeader from "../base/addNewDialog/TableSortHeader";
import TableBody from "@material-ui/core/TableBody";
import TableRow from "@material-ui/core/TableRow";
import TableCell from "@material-ui/core/TableCell";
import DialogActions from "@material-ui/core/DialogActions";
import Button from "@material-ui/core/Button";
import StreamWizard from "../Dashboard/StreamWizard";
import StreamSettings from "../Dashboard/StreamSettings";
// import AdminConstants from "../../constants/AdminConstants";
import {withStyles} from "@material-ui/core/styles";

const PREF_KEY = 'streamsheets-prefs-addnewdialog';

const styles = (theme) => ({
	tableRow: {
		"&$selected, &$selected:hover": {
			backgroundColor: theme.palette.action.hover
		}
	},
	hover: {},
	selected: {}
});

const getPersistetSortPreferences = () => {
	const prefs = JSON.parse(localStorage.getItem(PREF_KEY) || '{}');
	return prefs.sortQuery || '';
};

const persistSortPreferences = (preferences) => {
	localStorage.setItem(
		PREF_KEY,
		JSON.stringify({
			sortQuery: preferences.sortQuery
		})
	);
};

export class NewMachineDialog extends Component {
	constructor(props) {
		super(props);
		this.resources = [];

		this.ERROR_MESSAGES = {
			DUPLICATE: this.props.intl.formatMessage({
				id: 'Admin.duplicateName',
				defaultMessage: 'Name already taken, please select unique name'
			}),
			EMPTY: this.props.intl.formatMessage({
				id: 'Admin.emptyName',
				defaultMessage: 'Name cannot be empty'
			}),
			INVALID: this.props.intl.formatMessage({
				id: 'Admin.invalidName',
				defaultMessage: 'Invalid Name'
			})
		};
		this.state = {
			selected: { id: '' },
			error: '',
			name: '',
			sortQuery: getPersistetSortPreferences() || this.props.sortQuery,
			filter: this.props.filter,
			editStream: false,
			showStreamWizard: false
		};

	}

	handleClose = () => {
		this.reset();
		this.props.setAppState({
			showNewDialog: false
		});
	};

	isNameUnique = (name) => !this.props.machines.find((c) => c.name.toLowerCase() === name.toLowerCase());

	isNameValid = (name) => name.length > 0;

	reset = () => {
		this.setState({
			selected: { id: '' },
			error: '',
			name: '',
		});
	};

	getResources = () => SortSelector.sort(this.props.consumers, this.state.sortQuery, this.state.filter);

	handleTableSort = (event, property) => {
		const orderBy = property;
		let order = 'desc';

		const sortObj = SortSelector.parseSortQuery(this.state.sortQuery);

		if (sortObj.sortBy === property && sortObj.sortDir === 'desc') {
			order = 'asc';
		}

		// this.setState({ order, orderBy });

		const sortQuery = `${orderBy}_${order}`;
		persistSortPreferences({ sortQuery });
		this.setState({
			sortQuery
		});
	};

	handleFilter = (event) => {
		const filter = event.target.value;
		this.setState({
			filter
		});
	};

	handleNameChange = (event) => {
		event.preventDefault();
		this.validateName(event.target.value);
	};

	validateName = (name) => {
		if (!name || name.length < 1) {
			this.setState({
				error: this.ERROR_MESSAGES.EMPTY,
				name
			});
			return false;
		}
		if (!this.isNameUnique(name)) {
			this.setState({
				error: this.ERROR_MESSAGES.DUPLICATE,
				name
			});
			return false;
		}
		if (!this.isNameValid(name)) {
			this.setState({
				error: this.ERROR_MESSAGES.INVALID,
				name
			});
			return false;
		}
		this.setState({
			error: '',
			name
		});
		return true;
	};

	getFormattedDateString(date) {
		const d = new Date(Date.parse(date));
		return `${d.toLocaleDateString(undefined, {
			year: '2-digit',
			month: '2-digit',
			day: '2-digit'
		})} ${d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`;
	}

	handleSelection = (selected) => () => {
		this.setState({ selected });
	};

	handleAddConsumer = () => {
		this.setState({
			showStreamWizard: true
		});
	};

	handleEditConsumer = () => {
		// const consumer = this.props.streams[AdminConstants.CONFIG_TYPE.ConsumerConfiguration].find(
		// 	(p) => p.id === this.state.selected.id
		// );
		//
		this.setState({
			editStream: true,
		});
	};

	onWizardClose = (consumer) => {
		if (consumer) {
			this.scroll = `stream-${consumer.id}`;
			this.setState({
				selected: consumer.toJSON()
			});
		}
		this.setState({
			showStreamWizard: false,
			editStream: false
		});
	};


	handleSubmit = () => {
		if (this.validateName(this.state.name)) {
			if (this.state.selected && !this.state.error) {
				const query = {
					scope: this.props.scopeId,
					machineName: this.state.name
				};
				if (this.state.selected && this.state.selected.id) {
					query.streamId = this.state.selected.id;
					query.streamName = this.state.selected.name;
				}
				window.open(Path.machine('base_machine', query));
				this.handleClose();
			}
		}
	};

	render() {
		if (!this.props.open) {
			return <div />;
		}
		const { selected, name, error, filter } = this.state;
		const sortObj = SortSelector.parseSortQuery(this.state.sortQuery);

		if (this.scroll) {
			const sel = document.getElementById(this.scroll);
			if (sel && sel.scrollIntoView) {
				sel.scrollIntoView(true);
				this.scroll = undefined;
			}
		}

		return (
			<Dialog open={this.props.open} onClose={this.handleClose} maxWidth={false}>
				<DialogTitle>
					<FormattedMessage id="DialogNew.title" defaultMessage="New" />
				</DialogTitle>
				<DialogContent
					style={{
						height: '480px',
						minWidth: '600px'
					}}
				>
					<TextField
						variant="outlined"
						label={<FormattedMessage id="Stream.NameField" defaultMessage="Name" />}
						id="name"
						size="small"
						name="name"
						fullWidth
						margin="normal"
						value={name}
						onChange={this.handleNameChange}
						error={typeof error === 'string' && error.length > 0}
						helperText={error}
					/>
					<Paper variant="outlined" style={{ padding: '12px', marginTop: '15px' }}>
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
								<FormattedMessage id="DialogNew.consumer" defaultMessage="Please select a consumer" />
							</FormLabel>
							<Input
								onChange={this.handleFilter}
								style={{ marginBottom: '8px', flexGrow: 0.3 }}
								startAdornment={
									<InputAdornment position="start">
										<IconSearch />
									</InputAdornment>
								}
								defaultValue={filter}
								type="search"
							/>
						</div>

						<TableContainer style={{ overflowY: 'auto', height: '320px' }}>
							<Table stickyHeader size="small">
								<TableSortHeader
									cells={[
										{
											id: 'name',
											numeric: false,
											disablePadding: true,
											label: 'Name',
											width: '72%'
										},
										{
											id: 'lastModified',
											numeric: false,
											disablePadding: false,
											label: 'LastModified',
											width: '28%'
										}
									]}
									orderBy={sortObj.sortBy}
									order={sortObj.sortDir}
									onRequestSort={this.handleTableSort}
								/>
								<TableBody>
									{(!filter || (typeof filter === 'string' && filter.length < 1)) ? (
										<TableRow
											style={{
												height: '35px',
												cursor: 'pointer'
											}}
											key="no_stream"
											classes={{ hover: this.props.classes.hover, selected: this.props.classes.selected }}
											className={this.props.classes.tableRow}
											selected={selected.id === ''}
											onClick={this.handleSelection({ id: '' })}
											tabIndex={-1}
										>
											<TableCell component="th" scope="row">
												<FormattedMessage id="DialogNew.noStream" defaultMessage="None" />
											</TableCell>
											<TableCell />
										</TableRow>
									) : null}
									{this.getResources().map((resource) => (
										<TableRow
											style={{
												height: '35px',
												cursor: 'pointer'
											}}
											hover
											classes={{ hover: this.props.classes.hover, selected: this.props.classes.selected }}
											className={this.props.classes.tableRow}
											onClick={this.handleSelection(resource)}
											selected={resource.id === selected.id}
											tabIndex={-1}
											id={`stream-${resource.id}`}
											key={`${resource.className}-${resource.id}`}
										>
											<TableCell component="th" scope="row">
												<img
													style={{ verticalAlign: 'bottom', paddingRight: '6px' }}
													width={15}
													height={15}
													src={StreamHelper.getIconForState(resource.state)}
													alt="state"
												/>
												{resource.name}
											</TableCell>
											<TableCell>{this.getFormattedDateString(resource.lastModified)}</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</TableContainer>
					</Paper>
				</DialogContent>
				<DialogActions style={{ justifyContent: 'space-between', padding: '0px 16px 10px 16px' }}>
					<div>
						<Button color="primary" onClick={this.handleAddConsumer}>
							<FormattedMessage id="DialogNew.AddConsumer" defaultMessage="Add Consumer" />
						</Button>
						<Button color="primary" onClick={this.handleEditConsumer} disabled={selected.id === ''}>
							<FormattedMessage id="DialogNew.EditConsumer" defaultMessage="Edit Consumer" />
						</Button>
					</div>
					<div>
						<Button color="primary" onClick={this.handleClose}>
							<FormattedMessage id="Cancel" defaultMessage="Cancel" />
						</Button>
						<Button color="primary" onClick={this.handleSubmit}>
							<FormattedMessage id="DialogNew.add" defaultMessage="Add" />
						</Button>
					</div>
				</DialogActions>
				{this.state.showStreamWizard ? (
					<StreamWizard
						onClose={this.onWizardClose}
						initialStep="connector"
						connector={undefined}
						type="consumer"
						open={this.state.showStreamWizard}
						streams={this.props.streams}
					/>
				) : null}
				{this.state.editStream ? (
					<StreamSettings
						onClose={this.onWizardClose}
						stream={this.state.selected}
						type="consumer"
						open={this.state.editStream}
						streams={this.props.streams}
					/>
				) : null}
			</Dialog>
		);
	}
}

function mapStateToProps(state) {
	return {
		open: state.appState.showNewDialog,
		machines: state.machines.data,
		consumers: state.streams.consumers.map((s) => ({ ...s, state: StreamHelper.getStreamState(s) })),
		streams: state.streams,
		scopeId: state.user.user.scope.id
	};
}

function mapDispatchToProps(dispatch) {
	return bindActionCreators({ ...Actions }, dispatch);
}

export default injectIntl(withStyles(styles)(connect(mapStateToProps, mapDispatchToProps)(NewMachineDialog)));
