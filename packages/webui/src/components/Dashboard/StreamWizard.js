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
import Fab from '@material-ui/core/Fab';
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
import gatewayClient from '../../helper/GatewayClient';

const VALIDATION_QUERY = `
	query ValidateStream($provider: String!, $type: String!, $streamConfig: JSON!) {
		validateStream(provider: $provider, type: $type, streamConfig: $streamConfig) {
			valid
			fieldErrors
			fieldUpdates
		}
	}
`;

/**
 * usage: validate('@cedalo/stream-mqtt', 'consumer', {topic: 'test'});
 */
const validate = async (provider, type, streamConfig) => {
	try {
		const { validateStream } = await gatewayClient.graphql(VALIDATION_QUERY, { provider, type, streamConfig });
		return validateStream;
	} catch (error) {
		console.error(error);
	}
	return { valid: true, fieldErrors: {}, fieldUpdates: {} };
};

const styles = () => ({
	progress: {
		width: '60%'
	}
});

class StreamWizard extends React.Component {
	static propTypes = {
		open: PropTypes.bool.isRequired,
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
			connector: undefined,
			fieldErrors: undefined,
			newConnector: true,
			selectedProvider: { id: '' },
			activeStep: undefined,
			error: '',
			connectorName: '',
			consumerName: '',
			sortQuery: 'name_asc',
			filter: '',
			step: 1,
			showAdvanced: false,
			validating: false,
		};
	}

	static getDerivedStateFromProps(props, state) {
		if (state.activeStep === undefined) {
			const name = StreamWizard.createUniqueConsumerName(props.connector, props)

			return {...state, activeStep: props.initialStep, connector: props.connector, consumerName: name};
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
			connector: undefined,
			newConnector: true,
			fieldErrors: undefined,
			selectedProvider: { id: '' },
			activeStep: undefined,
			error: '',
			connectorName: '',
			consumerName: '',
			step: 1,
			showAdvanced: false,
			validating: false,
		});
	};

	static createUniqueConsumerName(connector, props) {
		let name;

		if (connector) {
			if (connector.name.indexOf('Connector') !== -1) {
				name = connector.name.replace('Connector', 'Consumer')
			} else {
				const provider = props.streams[AdminConstants.CONFIG_TYPE.ProviderConfiguration]
					.find(p => p.id === connector.provider.id);
				name = provider.name.replace('Provider', 'Consumer')
			}
		} else {
			name = ''
		}

		let i = 1;
		let finalName = name;

		while (props.streams[AdminConstants.CONFIG_TYPE.ConsumerConfiguration]
			// eslint-disable-next-line no-loop-func
			.find(p => p.name === finalName)) {
			finalName = name + i;
			i += 1;
		}

		return finalName;
	}

	static createUniqueConnectorName(provider, props) {
		let name;

		if (provider) {
			name =  StreamWizard.onUpdateName(provider.name.replace('Provider', 'Connector'));
		} else {
			name = 'Connector'
		}

		let i = 1;
		let finalName = name;

		while (props.streams[AdminConstants.CONFIG_TYPE.ConnectorConfiguration]
			// eslint-disable-next-line no-loop-func
			.find(p => p.name === finalName)) {
			finalName = name + i;
			i += 1;
		}

		return finalName;
	}

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

		const newValue = StreamWizard.onUpdateName(event.target.value);
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

	static onUpdateName = (name) => name.replace(' ', '_').replace(/[^a-zA-Z0-9_]/, '');

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

	isNameUnique = (name) => {
		const equalName = (s) => s.name.toLowerCase() === name.toLowerCase();
		const { consumers, producers, connectors } = this.props.streams;
		return !consumers.some(equalName) && !producers.some(equalName) && !connectors.some(equalName);
	};

	validateName = (name) => {
		if (!name || name.length < 1) {
			return this.ERROR_MESSAGES.EMPTY;
		}
		if (!this.isNameUnique(name)) {
			return this.ERROR_MESSAGES.DUPLICATE;
		}
		return '';
	};

	handleProviderSelection = (selectedProvider) => () => {
		this.setState({
			selectedProvider,
		});
	};

	handleConnectorSelection = (connector) => () => {
		const name = StreamWizard.createUniqueConsumerName(connector, this.props)

		this.setState({
			connector,
			newConnector: connector === undefined,
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

	getSteps() {
		const steps = [];

		if (this.props.type === 'consumer') {
			if (this.props.initialStep === 'connector') {
				steps.push('connector');
				if (this.state.newConnector) {
					steps.push('provider');
					steps.push('connectorname');
					steps.push('connectorsettings');
				}
			}
			steps.push('consumername');
			steps.push('consumersettings');
		} else {
			steps.push('provider');
			steps.push('connectorname');
			steps.push('connectorsettings');
		}

		return steps;
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
			return false;
		case 'connectorname':
			return this.state.error !== '';
		case 'connectorsettings':
			return this.state.validating;
		case 'consumername':
			return this.state.error !== '';
		case 'consumersettings':
			return this.state.validating;
		default:
			return ''
		}
	}

	getBackDisabled() {
		const steps = this.getSteps();

		return (this.state.activeStep === steps[0]);
	}

	handleNext = () => {
		switch (this.state.activeStep) {
		case 'connector':
			// if no connector selected, create new
			this.setState({
				activeStep: this.state.connector === undefined ? 'provider' : 'consumername',
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
				connectorName: StreamWizard.createUniqueConnectorName(this.state.selectedProvider, this.props),
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
		case 'connectorsettings': {

			const model = this.state.connector;
			const provider = this.state.connector.provider;

			if (provider) {
				this.setState({validating: true})
				validate(provider.id, 'connector', model.toJSON()).then(result => {
					if (result.valid) {
						this.setState({fieldErrors: undefined})
						Object.entries(result.fieldUpdates).forEach(([key, value]) => model.setFieldValue(key, value))
						if (this.props.type === 'consumer') {
							this.setState({
								activeStep: 'consumername',
								backDisabled: false,
								step: this.state.step + 1,
								consumerName: this.state.consumerName === '' ?
									StreamWizard.createUniqueConsumerName(model, this.props) :
									this.state.consumerName,
							});
							this.setState({validating: false})
						} else {
							this.props.saveConfiguration(model);
							this.handleClose();
						}
					} else {
						this.setState({fieldErrors: result.fieldErrors})
					}
				});
			}

			break;
		}
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
		case 'consumersettings': {
			const model = this.state.consumer;
			const provider = this.state.consumer.provider;

			if (provider) {
				this.setState({validating: true})
				validate(provider.id, 'consumer', model.toJSON()).then(result => {
					if (result.valid) {
						Object.entries(result.fieldUpdates).forEach(([key, value]) => model.setFieldValue(key, value))
						this.setState({fieldErrors: undefined})
						if (this.props.initialStep === 'connector') {
							this.props.saveConfiguration(this.state.connector);
						}
						this.props.saveConfiguration(validModel);
						this.handleClose();
					} else {
						this.setState({fieldErrors: result.fieldErrors})
					}
				});
			}
			this.handleClose();
			break;
		}
		default:
		}
	};

	handleBack = () => {
		switch (this.state.activeStep) {
		case 'provider':
			this.setState({
				activeStep: 'connector',
				step: this.state.step - 1,
				connector: undefined,
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

	getProgress() {
		const addButton = (label, color) => {
			return <Fab
				variant="extended"
				size="small"
				color={color}
				aria-label="add"
				style={{
					boxShadow: 'none',
					width: '140px',
					lineHeight: 'normal',
				}}
			>
				{this.props.intl.formatMessage({
					id: `StreamStep.${label}`,
					defaultMessage: 'Step'
				})}
			</Fab>
		};
		const addLine = () => {
			return <div
				style = {{
					height: '20px',
					width: '1px',
					borderLeft: '1px solid grey',
					marginLeft: '70px',
				}}
			/>
		}

		const elements = [];

		const steps = this.getSteps();

		steps.forEach(step => {
			elements.push(addButton(step, this.state.activeStep === step ? 'primary' : 'default'));
			elements.push(addLine());
		});
		elements.push(addButton('finish', 'default'));

		return elements;
	}

	getStreamFields(fc, advanced) {
		let config;

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

		return advanced ?
			fc.getComponents(config, false).advanced :
			fc.getComponents(config, false).main
	}

	onUpdateConfiguration = (config) => {
		switch (this.state.activeStep) {
		case 'connectorsettings':
			this.setState({ connector: config, fieldErrors: undefined, validating: false });
			break;
		case 'consumersettings':
			this.setState({ consumer: config, fieldErrors: undefined , validating: false});
			break;
		default:
		}
	};


	toggleAdvanced = () => {
		this.setState({ showAdvanced: !this.state.showAdvanced });
	};

	render() {
		const {open, onClose} = this.props;
		if (!open) {
			return <div/>
		}
		const {selectedProvider, connector, consumerName, connectorName, error, filter, activeStep, fieldErrors} = this.state;
		const sortObj = SortSelector.parseSortQuery(this.state.sortQuery);
		const modelProps = {
			locale: this.props.intl.locale,
			handleChange: this.onUpdateConfiguration,
			...this.props,
		};

		const fc = new StreamFieldComponents(modelProps, fieldErrors);
		const advancedFields = activeStep === 'consumersettings' || activeStep === 'connectorsettings' ? this.getStreamFields(fc,true) : undefined;

		return (
			<Dialog open={open} onClose={onClose} maxWidth={false}>
				<DialogTitle>
					<FormattedMessage id="Stream.Wizard" defaultMessage="Stream Wizard"/>
				</DialogTitle>
				<DialogContent
					style={{
						height: '480px',
						minWidth: '700px'
					}}
				>
					<div
						style={{
							display: 'flex',
						}}
					>
					<div
						style={{
							minWidth: '180px',
							marginTop: '10px',
						}}
					>
						<Typography style={{fontSize: '0.85rem', marginBottom: '12px', marginTop: '6px'}}>
							<FormattedMessage id="Stream.Steps" defaultMessage="Steps"/>
						</Typography>
						{this.getProgress()}
					</div>
					<div
						style={{
							width: '100%',
						}}
					>
					{activeStep === 'connector' ? (
						<div>
							<div>
								<div
									style={{
										width: '100%',
										marginTop: '10px',
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
										<FormattedMessage id="Stream.ListConnectors" defaultMessage="List"/>
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
												onClick={this.handleConnectorSelection()}
												selected={connector === undefined}
												tabIndex={-1}
												key="connector-new"
											>
												<TableCell component="th" scope="row" padding="none">
													<FormattedMessage id="Stream.CreateNewConnector" defaultMessage="Create"/>
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
									marginTop: '10px',
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
									<FormattedMessage id="Stream.ListProviders" defaultMessage="Providers"/>
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
								label={<FormattedMessage id="Stream.DescriptionField" defaultMessage="Please enter a Description" />}
								id="description"
								name="description"
								fullWidth
								multiline
								margin="normal"
								value={activeStep === 'connectorname' ? this.state.connectorDescription : this.state.consumerDescription}
								onChange={this.handleDescriptionChange}
							/>
						</div>
					) : null}
					{activeStep === 'consumersettings' || activeStep === 'connectorsettings' ? (
						<div>
							<Typography style={{fontSize: '0.85rem', marginTop: '16px', marginBottom: '10px'}}>
								{this.getStreamInfo()}
							</Typography>
							{this.getStreamFields(fc, false)}
							{/* eslint-disable-next-line no-nested-ternary */}
							{advancedFields.length ? !this.state.showAdvanced ?
								<Button style={{marginTop:'15px', border: 'none'}} variant="outlined" size="small" fullWidth
										onClick={this.toggleAdvanced}>
									<ExpandMore/>
									<FormattedMessage id="Stream.ShowExtendedSettings" defaultMessage="Show Extended Settings"/>
								</Button> :
								<Button style={{marginTop:'15px', border: 'none'}} variant="outlined" size="small" fullWidth
										onClick={this.toggleAdvanced}>
									<ExpandLess/>
									<FormattedMessage id="Stream.HideExtendedSettings" defaultMessage="Hide Extended Settings"/>
								</Button> : null
							}
							{this.state.showAdvanced ? advancedFields : null}
						</div>
					) : null}
					</div>
					</div>
				</DialogContent>
				<DialogActions>
					<Button color="primary" onClick={() => this.handleCancel()}>
						<FormattedMessage id="Cancel" defaultMessage="Cancel" />
					</Button>
					<Button size="small" onClick={this.handleBack} disabled={this.getBackDisabled()}>
						{<KeyboardArrowLeft />}
						<FormattedMessage id="Setup.Back" defaultMessage="Back"/>
					</Button>
					<Button size="small" onClick={this.handleNext} disabled={this.getNextDisabled()}>
						<FormattedMessage id="Setup.Next" defaultMessage="Next"/>
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

