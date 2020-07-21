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
import Typography from '@material-ui/core/Typography';
import SortSelector from '../base/sortSelector/SortSelector';
import TableSortHeader from '../base/addNewDialog/TableSortHeader';
import Input from '@material-ui/core/Input';
import InputAdornment from '@material-ui/core/InputAdornment';
import IconSearch from '@material-ui/icons/Search';
import KeyboardArrowLeft from '@material-ui/icons/KeyboardArrowLeft';
import KeyboardArrowRight from '@material-ui/icons/KeyboardArrowRight';
import { withStyles } from '@material-ui/core/styles';
// import StreamForm from '../Admin/streams/StreamForm';
// import AdminForm from '../Admin/AdminForm';
import AdminConstants from '../../constants/AdminConstants';
import StreamFieldComponents from './StreamFieldComponents';
import StreamHelper from '../../helper/StreamHelper';
import ExpandMore from '@material-ui/icons/ExpandMore';
import ExpandLess from '@material-ui/icons/ExpandLess';
import {
	ConsumerConfiguration, ProviderConfiguration,
} from '@cedalo/sdk-streams';
import {bindActionCreators} from 'redux';
import * as Actions from '../../actions/actions';
import {connect} from 'react-redux';

const styles = () => ({
	progress: {
		width: '60%'
	}
});

class StreamWizard extends React.Component {
	static propTypes = {
		// getListElement: PropTypes.func,
		open: PropTypes.bool.isRequired,
		// onSubmit: PropTypes.func.isRequired,
		// onClose: PropTypes.func.isRequired,
		isUnique: PropTypes.func,
		isValid: PropTypes.func,
	};

	static defaultProps = {
		isUnique: () => true,
		isValid: () => true,
		// getListElement: (resource) => <ListItemText primary={resource.name} />,
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
		this.state = {
			connector: '',
			selectedProvider: { id: '' },
			activeStep: undefined,
			error: '',
			connectorName: '',
			consumerName: '',
			sortQuery: 'name_asc',
			filter: '',
			step: 1,
			showAdvanced: false,
		};
	}

	static getDerivedStateFromProps(props, state) {
		if (state.activeStep === undefined) {
			return {...state, activeStep: props.initialStep, connector: props.connector};
		}
		return { ...state };
	}

	componentDidUpdate() {
		if (this.nameRef && this.start) {
			this.nameRef.selectionStart = this.start;
			this.nameRef.selectionEnd = this.start;
		}
	}

	reset = () => {
		this.setState({
			connector: '',
			selectedProvider: { id: '' },
			activeStep: undefined,
			error: '',
			connectorName: '',
			consumerName: '',
			step: 1,
			showAdvanced: false,
		});
	};

	getProviders = () => SortSelector.sort(this.props.streams.providers, this.state.sortQuery, this.state.filter);
	getConnectors = () => SortSelector.sort(this.props.streams.connectors, this.state.sortQuery, this.state.filter);

	handleTableSort = (event, property) => {
		const orderBy = property;
		let order = 'desc';

		const sortObj = SortSelector.parseSortQuery(this.state.sortQuery);

		if (sortObj.sortBy === property && sortObj.sortDir === 'desc') {
			order = 'asc';
		}

		const sortQuery = `${orderBy}_${order}`;
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

		const newValue = this.onUpdateName(event.target.value);
		this.start = event.target.selectionStart;
		const error = this.validateName(newValue);

		if (this.state.activeStep === 'consumername') {
			this.setState({
				consumerName: newValue,
				error,
			})
		} else {
			this.setState({
				connectorName: newValue,
				error,
			})
		}
	};

	onUpdateName = (name) => name.replace(' ', '_').replace(/[^a-zA-Z0-9_]/, '');

	handleDescriptionChange = (event) => {
		event.preventDefault();

		const newValue = event.target.value;

		if (this.state.activeStep === 'consumername') {
			this.setState({
				consumerDescription: newValue,
			})
		} else {
			this.setState({
				connectorDescription: newValue,
			})
		}
	};

	validateName = (name) => {
		const { isUnique, isValid } = this.props;
		if (!name || name.length < 1) {
			return this.ERROR_MESSAGES.EMPTY;
		}
		if (!isUnique(name)) {
			return this.ERROR_MESSAGES.DUPLICATE;
		}
		if (!isValid(name)) {
			return this.ERROR_MESSAGES.INVALID;
		}
		return '';
	};

	handleProviderSelection = (selectedProvider) => () => {
		this.setState({
			selectedProvider,
			connectorName: this.onUpdateName(selectedProvider.name.replace('Provider', 'Connector')),
		});
	};

	handleConnectorSelection = (connector) => () => {
		let name;

		if (connector && connector.name.indexOf('Connector') !== -1) {
			name = connector.name.replace('Connector', 'Consumer')
		} else {
			name = 'Consumer'

		}
		this.setState({
			connector,
			consumerName: name,
		});
	};

	handleCancel = () => {
		this.reset();
		this.props.onClose();
	};

	handleClose = () => {
		this.reset();
		this.props.onClose();
	};

	async saveConnector() {
		// newConfiguration.owner = user.userId;
		const newConfiguration = this.state.connector;
		newConfiguration.name = this.state.connectorName;

		const resp = await this.props.saveConfiguration(newConfiguration);

		return (!resp.error && resp.response && !resp.response.result.error);
	}

	getStepTitle() {
		switch (this.state.activeStep) {
		case 'provider':
			return `Step ${this.state.step}: Select Provider`;
		case 'connector':
			return `Step ${this.state.step}: Select or create Connector`;
		case 'connectorname':
			return `Step ${this.state.step}: Assign Connector Name and Description`;
		case 'connectorsettings':
			return `Step ${this.state.step}: Define Connector Settings`;
		case 'consumername':
			return `Step ${this.state.step}: Assign Consumer Name and Description`;
		case 'consumersettings':
			return `Step ${this.state.step}: Define Consumer Settings`;
		default:
			return ''
		}
	}

	getStreamInfo() {
		if (this.state.connector === undefined) {
			return '';
		}
		const provider = this.props.streams[AdminConstants.CONFIG_TYPE.ProviderConfiguration]
			.find(p => p.id === this.state.connector.provider.id);

		switch (this.state.activeStep) {
		case 'connectorname':
		case 'connectorsettings':
			return `Provider: ${provider.name}`;
		case 'consumername':
		case 'consumersettings':
			return `Provider: ${provider.name} - Connector ${this.state.connector.name}`;
		default:
			return ''
		}
	}

	getNextDisabled() {
		switch (this.state.activeStep) {
		case 'provider':
			return this.state.selectedProvider.id === '';
		case 'connector':
			return this.state.connector === undefined;
		case 'connectorname':
			return this.state.error !== '';
		case 'connectorsettings':
			return false;
		case 'consumername':
			return this.state.error !== '';
		case 'consumersettings':
			return false;
		default:
			return ''
		}
	}

	getBackDisabled() {
		switch (this.state.activeStep) {
		case 'provider':
			return false;
		case 'connector':
			return true;
		case 'connectorname':
			return this.state.type === 'connector';
		case 'connectorsettings':
			return false;
		case 'consumername':
			return this.state.initialStep === 'consumername';
		case 'consumersettings':
			return false;
		default:
			return ''
		}
	}

	handleNext = () => {
		switch (this.state.activeStep) {
		case 'connector':
			// if no connector selected, create new
			this.setState({
				activeStep: this.state.connector === '' ? 'provider' : 'consumername',
				selectedProvider: {id: ''},
				backDisabled: false,
				consumer: undefined,
				step: this.state.step + 1,
			});
			break;
		case 'provider': {
			this.setState({
				activeStep: 'connectorname',
				backDisabled: false,
				connector: StreamHelper.createNewConfiguration('connectors', this.state.selectedProvider, this.props.streams),
				consumer: undefined,
				step: this.state.step + 1,
			});
			break;
		}
		case 'connectorname':
			this.setState({
				activeStep: 'connectorsettings',
				backDisabled: false,
				step: this.state.step + 1,
			});
			this.state.connector.name = this.state.connectorName;
			break;
		case 'connectorsettings':
			if (this.props.type === 'consumer') {
				this.setState({
					activeStep: 'consumername',
					backDisabled: false,
					step: this.state.step + 1,
				});
			} else if (this.saveConnector()) {
				this.handleClose();
			}
			break;
		case 'consumername': {
			const provider = this.props.streams[AdminConstants.CONFIG_TYPE.ProviderConfiguration]
					.find(p => p.id === this.state.connector.provider.id);

			const consumer = this.state.consumer === undefined ?
				new ConsumerConfiguration({}, this.state.connector, new ProviderConfiguration(provider)) : this.state.consumer
			consumer.name = this.state.connectorName;
			this.setState({
				activeStep: 'consumersettings',
				backDisabled: false,
				consumer,
				step: this.state.step + 1,
			});
			break;
		}
		case 'consumersettings':
			this.handleClose();
			break;
		default:
		}
	};

	handleBack = () => {
		switch (this.state.activeStep) {
		case 'provider':
			this.setState({
				activeStep: 'connector',
				step: this.state.step - 1,
				connector: '',
			});
			break;
		case 'connectorname':
			this.setState({
				activeStep: 'provider',
				step: this.state.step - 1,
			});
			break;
		case 'consumername':
			this.setState({
				activeStep: this.state.selectedProvider.id === '' ? 'connector' : 'connectorsettings',
				step: this.state.step - 1,
			});
			break;
		case 'consumersettings':
			this.setState({
				activeStep: 'consumername',
				step: this.state.step - 1,
			});
			break;
		case 'connectorsettings':
			this.setState({
				activeStep: 'connectorname',
				step: this.state.step - 1,
			});
			break;
		default:
		}
	};

	getStreamFields(advanced) {
		let config;
		if (this.props.edit) {
			if (!this.props.selectedStream || this.props.selectedStream.id === '') {
				// no selection
				return <div />;
			}
			config = StreamHelper.getInstanceFromObject(this.props.selectedStream, this.props.streams);
		} else {
			switch (this.state.activeStep) {
			case 'connectorsettings':
				config = this.state.connector;
				break;
			case 'consumersettings':
				config = this.state.consumer;
				break;
			case 'producersettings':
				config = this.state.producer;
				break;
			default:
				return null;
			}
		}

		const fc = new StreamFieldComponents(this.props.streams);

		return advanced ?
			fc.getComponents(config).advanced :
			fc.getComponents(config).main
	}

	toggleAdvanced = () => {
		this.setState({ showAdvanced: !this.state.showAdvanced });
	};

	render() {
		const {open, onClose} = this.props;
		if (!open) {
			return <div/>
		}
		const {selectedProvider, connector, consumerName, connectorName, error, filter, activeStep} = this.state;
		const sortObj = SortSelector.parseSortQuery(this.state.sortQuery);
		const advancedFields = activeStep === 'consumersettings' || activeStep === 'connectorsettings' ? this.getStreamFields(true) : undefined;

		return (
			<Dialog open={open} onClose={onClose} maxWidth={false}>
				<DialogTitle>{this.getStepTitle()}</DialogTitle>
				<DialogContent
					style={{
						height: '480px',
						minWidth: '600px'
					}}
				>
					{activeStep === 'connector' ? (
						<div>
							<div>
								<div
									style={{
										width: '100%',
										marginTop: '20px',
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
										List of Connectors
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
										height: '407px',
										overflow: 'auto',
										padding: '5px'
									}}
								>
									<Table>
										<TableSortHeader
											cells={[
												{
													id: 'name',
													numeric: false,
													disablePadding: true,
													label: 'Name',
													width: '72%'
												}
											]}
											orderBy={sortObj.sortBy}
											order={sortObj.sortDir}
											onRequestSort={this.handleTableSort}
										/>
										<TableBody>
											<TableRow
												style={{
													height: '35px'
												}}
												hover
												onClick={this.handleConnectorSelection('')}
												selected={connector === ''}
												tabIndex={-1}
												key="connector-new"
											>
												<TableCell component="th" scope="row" padding="none">
													Create new Connector...
												</TableCell>
											</TableRow>
											{this.getConnectors().map((resource) => (
												<TableRow
													style={{
														height: '35px'
													}}
													hover
													onClick={this.handleConnectorSelection(resource)}
													selected={connector && resource.id === connector.id}
													tabIndex={-1}
													key={`${resource.className}-${resource.id}`}
												>
													<TableCell component="th" scope="row" padding="none">
														{resource.name}
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</div>
							</div>
						</div>
					) : null}
					{activeStep === 'provider' ? (
						<div>
							<div
								style={{
									width: '100%',
									marginTop: '20px',
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
									Providers
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
									height: '407px',
									overflow: 'auto',
									padding: '5px'
								}}
							>
								<Table>
									<TableSortHeader
										cells={[
											{
												id: 'name',
												numeric: false,
												disablePadding: true,
												label: 'Name',
												width: '72%'
											}
										]}
										orderBy={sortObj.sortBy}
										order={sortObj.sortDir}
										onRequestSort={this.handleTableSort}
									/>
									<TableBody>
										{this.getProviders().map((resource) => (
											<TableRow
												style={{
													height: '35px'
												}}
												hover
												onClick={this.handleProviderSelection(resource)}
												selected={resource.id === selectedProvider.id}
												tabIndex={-1}
												key={`${resource.className}-${resource.id}`}
											>
												<TableCell component="th" scope="row" padding="none">
													{resource.name}
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>
						</div>
					) : null}
					{activeStep === 'connectorname' || activeStep === 'consumername' ? (
						<div
							style={{
								height: '85px'
							}}
						>
							<Typography style={{fontSize: '0.85rem', marginTop: '16px'}}>
								{this.getStreamInfo()}
							</Typography>
							<TextField
								inputRef={(el) => {
									this.nameRef = el;
								}}
								label={<FormattedMessage id="Stream.NameField" defaultMessage="Name" />}
								id="name"
								name="name"
								fullWidth
								margin="normal"
								value={activeStep === 'connectorname' ? connectorName : consumerName}
								onChange={this.handleNameChange}
								error={typeof error === 'string' && error.length > 0}
								helperText={error}
							/>
							<TextField
								inputRef={(el) => {
									this.nameRef = el;
								}}
								label={<FormattedMessage id="Stream.DescriptionField" defaultMessage="Please enter a Description" />}
								id="description"
								name="description"
								fullWidth
								multiline
								margin="normal"
								value={activeStep === 'connectorname' ? this.state.connectorDescription : this.state.consumerDescription}
								onChange={this.handleDescriptionChange}
								error={typeof error === 'string' && error.length > 0}
								helperText={error}
							/>
						</div>
					) : null}
					{activeStep === 'consumersettings' || activeStep === 'connectorsettings' ? (
						<div>
							<Typography style={{fontSize: '0.85rem', marginTop: '16px'}}>
								{this.getStreamInfo()}
							</Typography>
							{this.getStreamFields(false)}
							{/* eslint-disable-next-line no-nested-ternary */}
							{advancedFields.length ? !this.state.showAdvanced ?
								<Button style={{marginTop:'15px', border: 'none'}} variant="outlined" size="small" fullWidth
										onClick={this.toggleAdvanced}>
									<ExpandMore/>
									<FormattedMessage id="ShowExtendedSettings" defaultMessage="Show Extended Settings"/>
								</Button> :
								<Button style={{marginTop:'15px', border: 'none'}} variant="outlined" size="small" fullWidth
										onClick={this.toggleAdvanced}>
									<ExpandLess/>
									<FormattedMessage id="HideExtendedSettings" defaultMessage="Hide Extended Settings"/>
								</Button> : null
							}
							{this.state.showAdvanced ? advancedFields : null}
						</div>
					) : null}
				</DialogContent>
				<DialogActions>
					<Button color="primary" onClick={() => this.handleCancel()}>
						<FormattedMessage id="Cancel" defaultMessage="Cancel" />
					</Button>
					<Button size="small" onClick={this.handleBack} disabled={this.getBackDisabled()}>
						{<KeyboardArrowLeft />}
						Back
					</Button>
					<Button size="small" onClick={this.handleNext} disabled={this.getNextDisabled()}>
						Next
						{<KeyboardArrowRight />}
					</Button>
				</DialogActions>
			</Dialog>
		);
	}
}

function mapDispatchToProps(dispatch) {
	return bindActionCreators({ ...Actions }, dispatch);
}

export default injectIntl(withStyles(styles, { withTheme: true })(connect(null, mapDispatchToProps)(StreamWizard)));

