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
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import TextField from '@material-ui/core/TextField';
import ListItemText from '@material-ui/core/ListItemText';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import Dialog from '@material-ui/core/Dialog';
import FormLabel from '@material-ui/core/FormLabel';
import { FormattedMessage, injectIntl } from 'react-intl';
import SortSelector from '../sortSelector/SortSelector';

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
		getListElement: PropTypes.func,
		open: PropTypes.bool.isRequired,
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
		getListElement: (resource) => <ListItemText primary={resource.name} />,
		sortQuery: 'name_asc',
		filter: '',
		baseRequired: false,
		listTitle: DEF_TITLE,
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

	handleSort = (event, sortedResources, sortQuery, filter) => {
		persistSortPreferences({ sortQuery });
		this.setState({
			filter,
			sortQuery
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

	render() {
		const { title, listTitle, baseRequired, open, onClose } = this.props;
		const { selected, name, error, filter } = this.state;
		const sortObj = SortSelector.parseSortQuery(this.state.sortQuery);
		return (
			<Dialog open={open} onClose={onClose} maxWidth={false}>
				<DialogTitle>{title}</DialogTitle>
				<DialogContent
					style={{
						height: '545px',
						minWidth: '500px'
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
					<FormLabel
						style={{
							marginTop: '10px',
							fontSize: '13px',
							display: 'block'
						}}
					>
						{listTitle}
					</FormLabel>
					<SortSelector
						onSort={this.handleSort}
						defaultSortBy={sortObj.sortBy}
						defaultSortDir={sortObj.sortDir}
						defaultFilter={filter}
						sortFields={this.props.sortFields}
						withFilter
					/>
					<List style={{ height: '360px', padding: '0px', overflowY: 'scroll' }}>
						{!baseRequired && (!filter || (typeof filter === 'string' && filter.length < 1)) ? (
							<div>
								<ListItem
									key="no_stream"
									selected={selected.id === ''}
									onClick={this.handleSelection({ id: '' })}
									button
								>
									<ListItemText key="none">
										<FormattedMessage id="DialogNew.noStream" defaultMessage="None" />
									</ListItemText>
								</ListItem>
							</div>
						) : null}
						{this.getResources().map((resource) => (
							<ListItem
								key={`${resource.className}-${resource.id}`}
								button
								onClick={this.handleSelection(resource)}
								selected={resource.id === selected.id}
							>
								{this.props.getListElement(resource)}
							</ListItem>
						))}
					</List>
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
