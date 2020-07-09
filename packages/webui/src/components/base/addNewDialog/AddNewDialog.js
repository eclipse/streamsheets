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
import React from 'react';
import PropTypes from 'prop-types';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import Dialog from '@material-ui/core/Dialog';
import FormLabel from '@material-ui/core/FormLabel';
import { FormattedMessage, injectIntl } from 'react-intl';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';
import SortSelector from '../sortSelector/SortSelector';
import TableSortHeader from './TableSortHeader';
import Input from '@material-ui/core/Input';
import InputAdornment from '@material-ui/core/InputAdornment';
import IconSearch from '@material-ui/icons/Search';

const DEF_TITLE = <FormattedMessage id="Dashboard.Add" defaultMessage="Add" />;
const PREF_KEY = 'streamsheets-prefs-addnewdialog';

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

class AddNewDialog extends React.Component {
	static propTypes = {
		resources: PropTypes.arrayOf(
			PropTypes.shape({
				id: PropTypes.string,
				name: PropTypes.string
			})
		).isRequired,
		// getListElement: PropTypes.func,
		open: PropTypes.bool.isRequired,
		showState: PropTypes.bool,
		title: PropTypes.element,
		listTitle: PropTypes.element,
		onSubmit: PropTypes.func.isRequired,
		onClose: PropTypes.func.isRequired,
		isUnique: PropTypes.func,
		isValid: PropTypes.func,
		onUpdateName: PropTypes.func,
		sortQuery: PropTypes.string,
		filter: PropTypes.string,
		baseRequired: PropTypes.bool
	};

	static defaultProps = {
		isUnique: () => true,
		isValid: () => true,
		onUpdateName: (name) => name,
		// getListElement: (resource) => <ListItemText primary={resource.name} />,
		sortQuery: 'name_asc',
		filter: '',
		baseRequired: false,
		listTitle: DEF_TITLE,
		showState: false,
		title: DEF_TITLE
	};

	constructor(props) {
		super(props);
		this.nameRef = React.createRef();
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
		this.initialized = false;
		this.state = {
			selected: { id: '' },
			error: '',
			name: '',
			helperText: '',
			sortQuery: getPersistetSortPreferences() || this.props.sortQuery,
			filter: this.props.filter
		};
	}

	componentDidUpdate() {
		if (this.nameRef && this.start) {
			this.nameRef.selectionStart = this.start;
			this.nameRef.selectionEnd = this.start;
		}
	}

	reset = () => {
		this.setState({
			selected: { id: '' },
			error: '',
			name: '',
			helperText: ''
		});
	};

	getResources = () => SortSelector.sort(this.props.resources, this.state.sortQuery, this.state.filter);

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

	}

	handleFilter = (event) => {
		const filter = event.target.value;
		this.setState({
			filter,
		});
	};

	handleNameChange = (event) => {
		event.preventDefault();
		const { onUpdateName } = this.props;
		const newValue = onUpdateName(event.target.value);
		this.start = event.target.selectionStart;
		this.validateName(newValue);
	};

	validateName = (name) => {
		const { isUnique, isValid } = this.props;
		if (!name || name.length < 1) {
			this.setState({
				error: this.ERROR_MESSAGES.EMPTY,
				name
			});
			return false;
		}
		if (!isUnique(name)) {
			this.setState({
				error: this.ERROR_MESSAGES.DUPLICATE,
				name
			});
			return false;
		}
		if (!isValid(name)) {
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

	handleSelection = (selected) => () => {
		this.setState({ selected });
	};

	handleClose = () => {
		this.reset();
		this.props.onClose();
	};

	handleSubmit = () => {
		if (this.validateName(this.state.name)) {
			if (!this.state.selected.id && this.props.baseRequired) {
				this.setState({ helperText: 'No selection' });
			} else if (!this.state.error) {
				this.props.onSubmit({ ...this.state });
				this.handleClose();
			}
		}
	};

	getFormattedDateString(date) {
		const dat = new Date(Date.parse(date));
		return dat.toLocaleString(undefined, {year: '2-digit', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'});
	}

	render() {
		const { title, listTitle, baseRequired, open, onClose } = this.props;
		const { selected, name, error, filter } = this.state;
		const sortObj = SortSelector.parseSortQuery(this.state.sortQuery);
		return (
			<Dialog open={open} onClose={onClose} maxWidth={false}>
				<DialogTitle>{title}</DialogTitle>
				<DialogContent
					style={{
						height: '480px',
						minWidth: '600px'
					}}
				>
					<div
						style={{
							height: '85px',
						}}
					>
						<TextField
							inputRef={(el) => {
								this.nameRef = el;
							}}
							label={<FormattedMessage id="Stream.NameField" defaultMessage="Name" />}
							id="name"
							name="name"
							fullWidth
							margin="normal"
							value={name}
							onChange={this.handleNameChange}
							error={typeof error === 'string' && error.length > 0}
							helperText={error}
						/>
					</div>
					<div
						style={{
							width: '100%',
							display: 'flex',
							justifyContent: 'space-between',
							verticalAlign: 'middle',
						}}
					>
						<FormLabel
							style={{
								marginTop: '10px',
								fontSize: '13px',
								display: 'inline-block'
							}}
						>
							{listTitle}
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

					<div
						style={{
							border: '1px solid grey',
							height: '345px',
							overflow: 'auto',
							padding: '5px'
						}}
					>
						<Table>
							<TableSortHeader
								cells={this.props.showState ? [
									{ id: 'name', numeric: false, disablePadding: true, label: 'Name', width: '58%' },
									{ id: 'state', numeric: false, disablePadding: false, label: 'State', width: '14%' },
									{ id: 'lastModified', numeric: false, disablePadding: false, label: 'LastModified', width: '28%' },
								] : [
									{ id: 'name', numeric: false, disablePadding: true, label: 'Name', width: '72%' },
									{ id: 'lastModified', numeric: false, disablePadding: false, label: 'LastModified', width: '28%' },
								]}
								orderBy={sortObj.sortBy}
								order={sortObj.sortDir}
								onRequestSort={this.handleTableSort}
							/>
							<TableBody>
								{!baseRequired && (!filter || (typeof filter === 'string' && filter.length < 1)) ? (
									<TableRow
										style={ {
											height: '35px'
										}}
										key="no_stream"
										selected={selected.id === ''}
										onClick={this.handleSelection({ id: '' })}
										tabIndex={-1}
									>
										<TableCell component="th" scope="row" padding="none">
											<FormattedMessage id="DialogNew.noStream" defaultMessage="None" />
										</TableCell>
										{this.props.showState ? (
											<TableCell/>
										) : null}
										<TableCell/>
									</TableRow>
								) : null}
								{this.getResources().map((resource) => (
									<TableRow
										style={ {
											height: '35px'
										}}
										hover
										onClick={this.handleSelection(resource)}
										selected={resource.id === selected.id}
										tabIndex={-1}
										key={`${resource.className}-${resource.id}`}
									>
										<TableCell component="th" scope="row" padding="none">
											{resource.name}
										</TableCell>
										{this.props.showState ? (
											<TableCell>{resource.state}</TableCell>
										) : null}
										<TableCell>{this.getFormattedDateString(resource.lastModified)}</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
				</DialogContent>
				<DialogActions>
					<Button onClick={this.handleClose}>
						<FormattedMessage id="Cancel" defaultMessage="Cancel" />
					</Button>
					<Button onClick={this.handleSubmit}>
						<FormattedMessage id="DialogNew.add" defaultMessage="Add" />
					</Button>
				</DialogActions>
			</Dialog>
		);
	}
}

export default injectIntl(AddNewDialog);
