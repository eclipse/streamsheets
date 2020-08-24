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
import { ProducerConfiguration, ConsumerConfiguration, ProviderConfiguration } from '@cedalo/sdk-streams';
import { bindActionCreators } from 'redux';
import * as Actions from '../../actions/actions';
import { connect } from 'react-redux';
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
		open: PropTypes.bool.isRequired
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
		this.providerMap = Object.fromEntries(this.props.streams.providers.map((p) => [p.id, p]));
		this.state = {
			connector: undefined,
			fieldErrors: undefined,
			newConnector: true,
			selectedProvider: { id: '' },
			activeStep: undefined,
			error: '',
			connectorName: '',
			streamName: '',
			sortQuery: 'name_asc',
			filter: '',
			step: 1,
			showAdvanced: false,
			validating: false
		};
	}

	static getDerivedStateFromProps(props, state) {
		if (state.activeStep === undefined) {
			return {
				...state,
				activeStep: props.initialStep,
				newConnector: props.initialStep === 'connector',
				connector: props.connector,
				fieldErrors: undefined,
				selectedProvider: { id: '' },
				error: '',
				connectorName: '',
				step: 1,
				showAdvanced: false,
				validating: false,
				streamName: props.type === 'consumer' ?
					StreamWizard.createUniqueConsumerName(props.connector, props) :
					StreamWizard.createUniqueProducerName(props.connector, props)
			};
		}
		return { ...state };
	}

	componentDidUpdate() {
		if (this.nameRef && this.start) {
			this.nameRef.selectionStart = this.start;
			this.nameRef.selectionEnd = this.start;
		}
	}

	static createUniqueConsumerName(connector, props) {
		let name;

		if (connector) {
			if (connector.name.indexOf('Connector') !== -1) {
				name = connector.name.replace('Connector', 'Consumer');
			} else {
				const provider = props.streams[AdminConstants.CONFIG_TYPE.ProviderConfiguration].find(
					(p) => p.id === connector.provider.id
				);
				name = provider.name.replace('Provider', 'Consumer');
			}
		} else {
			name = '';
		}

		let i = 1;
		let finalName = name;

		while (
			props.streams[AdminConstants.CONFIG_TYPE.ConsumerConfiguration]
				// eslint-disable-next-line no-loop-func
				.find((p) => p.name === finalName)
		) {
			finalName = name + i;
			i += 1;
		}

		return finalName;
	}

	static createUniqueProducerName(connector, props) {
		let name;

		if (connector) {
			if (connector.name.indexOf('Connector') !== -1) {
				name = connector.name.replace('Connector', 'Producer');
			} else {
				const provider = props.streams[AdminConstants.CONFIG_TYPE.ProviderConfiguration].find(
					(p) => p.id === connector.provider.id
				);
				name = provider.name.replace('Provider', 'Producer');
			}
		} else {
			name = '';
		}

		let i = 1;
		let finalName = name;

		while (
			props.streams[AdminConstants.CONFIG_TYPE.ProducerConfiguration]
				// eslint-disable-next-line no-loop-func
				.find((p) => p.name === finalName)
		) {
			finalName = name + i;
			i += 1;
		}

		return finalName;
	}

	static createUniqueConnectorName(provider, props) {
		let name;

		if (provider) {
			name = StreamWizard.onUpdateName(provider.name.replace('Provider', 'Connector'));
		} else {
			name = 'Connector';
		}

		let i = 1;
		let finalName = name;

		while (
			props.streams[AdminConstants.CONFIG_TYPE.ConnectorConfiguration]
				// eslint-disable-next-line no-loop-func
				.find((p) => p.name === finalName)
		) {
			finalName = name + i;
			i += 1;
		}

		return finalName;
	}

	getRelevantProviders = () => {
		switch (this.props.type) {
			case 'consumer':
				return this.props.streams.providers.filter((p) => p.canConsume);
			case 'producer':
				return this.props.streams.providers.filter((p) => p.canProduce);
			default:
				return this.props.streams.providers;
		}
	};

	getRelevantConnectors = () => {
		switch (this.props.type) {
			case 'consumer':
				return this.props.streams.connectors.filter((c) => this.providerMap[c.provider.id].canConsume);
			case 'producer':
				return this.props.streams.connectors.filter((c) => this.providerMap[c.provider.id].canProduce);
			default:
				return this.props.streams.connectors;
		}
	};

	getProviders = () => SortSelector.sort(this.getRelevantProviders(), this.state.sortQuery, this.state.filter);
	getConnectors = () => SortSelector.sort(this.getRelevantConnectors(), this.state.sortQuery, this.state.filter);

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

		switch (this.state.activeStep) {
			case 'connectorname':
				this.setState({
					connectorName: newValue,
					error
				});
				break;
			case 'consumername':
			case 'producername':
				this.setState({
					streamName: newValue,
					error
				});
				break;
			default:
		}
	};

	static onUpdateName = (name) => name.replace(' ', '_').replace(/[^a-zA-Z0-9_]/, '');

	handleDescriptionChange = (event) => {
		event.preventDefault();

		const newValue = event.target.value;

		switch (this.state.activeStep) {
			case 'consumername':
			case 'producername':
				this.setState({
					streamDescription: newValue
				});
				break;
			case 'connectorname':
				this.setState({
					connectorDescription: newValue
				});
				break;
			default:
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
			selectedProvider
		});
	};

	handleConnectorSelection = (connector) => () => {
		this.setState({
			connector,
			newConnector: connector === undefined,
			streamName: this.props.type === 'consumer' ?
				StreamWizard.createUniqueConsumerName(connector, this.props):
				StreamWizard.createUniqueProducerName(connector, this.props),
		});
	};

	handleCancel = () => {
		this.props.onClose();
	};

	handleClose = () => {
		switch (this.props.type) {
			case 'consumer':
				this.props.onClose(this.state.consumer);
				break;
			case 'connector':
				this.props.onClose(this.state.connector);
				break;
			default:
				this.props.onClose();
				break;
		}
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
		} else if (this.props.type === 'producer') {
			if (this.props.initialStep === 'connector') {
				steps.push('connector');
				if (this.state.newConnector) {
					steps.push('provider');
					steps.push('connectorname');
					steps.push('connectorsettings');
				}
			}
			steps.push('producername');
			steps.push('producersettings');
		} else {
			steps.push('provider');
			steps.push('connectorname');
			steps.push('connectorsettings');
		}

		return steps;
	}

	getStreamInfo() {
		const title = this.props.intl.formatMessage({
			id: 'Stream.Wizard',
			defaultMessage: 'Stream Wizard'
		});

		if (this.state.connector === undefined) {
			return title;
		}
		const provider = this.props.streams[AdminConstants.CONFIG_TYPE.ProviderConfiguration].find(
			(p) => p.id === this.state.connector.provider.id
		);

		switch (this.state.activeStep) {
			case 'connectorname':
			case 'connectorsettings':
				return `${title} - Provider: ${provider.name}`;
			case 'producername':
			case 'producersettings':
			case 'consumername':
			case 'consumersettings':
				return `${title} - Provider: ${provider.name} - Connector ${this.state.connector.name}`;
			default:
				return title;
		}
	}

	getNextDisabled() {
		switch (this.state.activeStep) {
			case 'provider':
				return this.state.selectedProvider.id === '';
			case 'connector':
				return false;
			case 'connectorname':
			case 'consumername':
			case 'producername':
				return this.state.error !== '';
			case 'connectorsettings':
			case 'producersettings':
			case 'consumersettings':
				return this.state.validating;
			default:
				return '';
		}
	}

	getBackDisabled() {
		const steps = this.getSteps();

		return this.state.activeStep === steps[0];
	}

	handleNext = () => {
		switch (this.state.activeStep) {
			case 'connector':
				// if no connector selected, create new
				this.setState({
					activeStep: this.state.connector === undefined ? 'provider' : `${this.props.type}name`,
					selectedProvider: { id: '' },
					backDisabled: false,
					consumer: undefined,
					step: this.state.step + 1
				});
				break;
			case 'provider': {
				this.setState({
					activeStep: 'connectorname',
					backDisabled: false,
					connector: StreamHelper.createNewConfiguration(
						'connectors',
						this.state.selectedProvider,
						this.props.streams
					),
					connectorName: StreamWizard.createUniqueConnectorName(this.state.selectedProvider, this.props),
					consumer: undefined,
					step: this.state.step + 1
				});
				break;
			}
			case 'connectorname':
				this.setState({
					activeStep: 'connectorsettings',
					backDisabled: false,
					step: this.state.step + 1
				});
				this.state.connector.name = this.state.connectorName;
				this.state.connector.description = this.state.connectorDescription;
				break;
			case 'connectorsettings': {
				const model = this.state.connector;
				const provider = this.state.connector.provider;

				if (provider) {
					this.setState({ validating: true });
					validate(provider.id, 'connector', model.toJSON()).then((result) => {
						if (result.valid) {
							this.setState({ fieldErrors: undefined });
							Object.entries(result.fieldUpdates).forEach(([key, value]) =>
								model.setFieldValue(key, value)
							);
							if (this.props.type === 'consumer') {
								this.setState({
									activeStep: 'consumername',
									backDisabled: false,
									step: this.state.step + 1,
									streamName:
										this.state.streamName === ''
											? StreamWizard.createUniqueConsumerName(model, this.props)
											: this.state.streamName,
									validating: false
								});
							} else if (this.props.type === 'producer') {
								this.setState({
									activeStep: 'producername',
									backDisabled: false,
									step: this.state.step + 1,
									streamName:
										this.state.streamName === ''
											? StreamWizard.createUniqueProducerName(model, this.props)
											: this.state.streamName,
									validating: false
								});
							} else {
								this.props.saveConfiguration(model);
								this.handleClose();
							}
						} else {
							this.setState({ fieldErrors: result.fieldErrors });
						}
					});
				}

				break;
			}
			case 'consumername': {
				const provider = this.props.streams[AdminConstants.CONFIG_TYPE.ProviderConfiguration].find(
					(p) => p.id === this.state.connector.provider.id
				);

				const consumer =
					this.state.consumer === undefined
						? new ConsumerConfiguration({}, this.state.connector, new ProviderConfiguration(provider))
						: this.state.consumer;
				consumer.name = this.state.streamName;
				consumer.description = this.state.streamDescription;
				this.setState({
					activeStep: 'consumersettings',
					backDisabled: false,
					consumer,
					step: this.state.step + 1
				});
				break;
			}
			case 'consumersettings': {
				const model = this.state.consumer;
				const provider = this.state.consumer.provider;

				if (provider) {
					this.setState({validating: true});
					validate(provider.id, 'consumer', model.toJSON()).then((result) => {
						if (result.valid) {
							Object.entries(result.fieldUpdates).forEach(([key, value]) =>
								model.setFieldValue(key, value)
							);
							this.setState({fieldErrors: undefined});
							if (this.state.newConnector) {
								this.saveStreamWithConnector(model, this.state.connector);
							} else {
								this.props.saveConfiguration(model);
							}
							this.handleClose();
						} else {
							this.setState({fieldErrors: result.fieldErrors});
						}
					});
				}
				break;
			}
			case 'producername': {
					const provider = this.props.streams[AdminConstants.CONFIG_TYPE.ProviderConfiguration].find(
						(p) => p.id === this.state.connector.provider.id
					);

					const producer =
						this.state.producer === undefined
							? new ProducerConfiguration({}, this.state.connector, new ProviderConfiguration(provider))
							: this.state.producer;
					producer.name = this.state.streamName;
					producer.description = this.state.streamDescription;
					this.setState({
						activeStep: 'producersettings',
						backDisabled: false,
						producer,
						step: this.state.step + 1
					});
					break;
				}
			case 'producersettings': {
					const model = this.state.producer;
					const provider = this.state.producer.provider;

					if (provider) {
						this.setState({ validating: true });
						validate(provider.id, 'producer', model.toJSON()).then((result) => {
							if (result.valid) {
								Object.entries(result.fieldUpdates).forEach(([key, value]) =>
									model.setFieldValue(key, value)
								);
								this.setState({ fieldErrors: undefined });
								if (this.state.newConnector) {
									this.saveStreamWithConnector(model, this.state.connector);
								} else {
									this.props.saveConfiguration(model);
								}
								this.handleClose();
							} else {
								this.setState({ fieldErrors: result.fieldErrors });
							}
						});
					}
					break;
				}
			default:
		}
	};

	async saveStreamWithConnector(stream, connector) {
		const resp = await this.props.saveConfiguration(connector);
		if (!resp.error) {
			await this.props.saveConfiguration(stream);
		}
	}

	handleBack = () => {
		switch (this.state.activeStep) {
			case 'provider':
				this.setState({
					activeStep: 'connector',
					step: this.state.step - 1,
					connector: undefined
				});
				break;
			case 'connectorname':
				this.setState({
					activeStep: 'provider',
					step: this.state.step - 1
				});
				break;
			case 'consumername':
			case 'producername':
				this.setState({
					activeStep: this.state.selectedProvider.id === '' ? 'connector' : 'connectorsettings',
					step: this.state.step - 1
				});
				break;
			case 'consumersettings':
				this.setState({
					activeStep: 'consumername',
					step: this.state.step - 1
				});
				break;
			case 'producersettings':
				this.setState({
					activeStep: 'producername',
					step: this.state.step - 1
				});
				break;
			case 'connectorsettings':
				this.setState({
					activeStep: 'connectorname',
					step: this.state.step - 1
				});
				break;
			default:
		}
	};

	getStepDesciption() {
		switch (this.state.activeStep) {
			case 'connector':
				return <FormattedMessage id="StreamStep.connectorDesc" defaultMessage="Steps" />;
			case 'provider':
				return <FormattedMessage id="StreamStep.providerDesc" defaultMessage="Steps" />;
			case 'connectorname':
				return <FormattedMessage id="StreamStep.connectorNameDesc" defaultMessage="Steps" />;
			case 'consumername':
				return <FormattedMessage id="StreamStep.consumerNameDesc" defaultMessage="Steps" />;
			case 'producername':
				return <FormattedMessage id="StreamStep.producerNameDesc" defaultMessage="Steps" />;
			case 'consumersettings':
				return <FormattedMessage id="StreamStep.consumerSettingsDesc" defaultMessage="Steps" />;
			case 'producersettings':
				return <FormattedMessage id="StreamStep.producerSettingsDesc" defaultMessage="Steps" />;
			case 'connectorsettings':
				return <FormattedMessage id="StreamStep.connectorSettingsDesc" defaultMessage="Steps" />;
			default:
		}

		return null;
	};

	getProgress() {
		const addButton = (label, color) => {
			return (
				<Fab
					variant="extended"
					size="small"
					disabled
					disableRipple
					disableFocusRipple
					aria-label="add"
					style={{
						boxShadow: 'none',
						color: color === 'primary' ? 'white' : undefined,
						width: '196px',
						backgroundColor: color === 'primary' ? this.props.theme.palette.primary.main : undefined,
						lineHeight: 'normal'
					}}
				>
					{this.props.intl.formatMessage({
						id: `StreamStep.${label}`,
						defaultMessage: 'Step'
					})}
				</Fab>
			);
		};
		const addLine = () => {
			return (
				<div
					style={{
						height: '20px',
						width: '1px',
						borderLeft: '1px solid grey',
						marginLeft: '98px'
					}}
				/>
			);
		};

		const elements = [];

		const steps = this.getSteps();

		steps.forEach((step) => {
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

		return advanced ? fc.getComponents(config, false).advanced : fc.getComponents(config, false).main;
	}

	onUpdateConfiguration = (config) => {
		switch (this.state.activeStep) {
			case 'connectorsettings':
				this.setState({ connector: config, fieldErrors: undefined, validating: false });
				break;
			case 'consumersettings':
				this.setState({ consumer: config, fieldErrors: undefined, validating: false });
				break;
			case 'producersettings':
				this.setState({ producer: config, fieldErrors: undefined, validating: false });
				break;
			default:
		}
	};

	toggleAdvanced = () => {
		this.setState({ showAdvanced: !this.state.showAdvanced });
	};

	render() {
		const { open, onClose } = this.props;
		if (!open) {
			return <div />;
		}
		const {
			selectedProvider,
			connector,
			streamName,
			connectorName,
			error,
			filter,
			activeStep,
			fieldErrors
		} = this.state;
		const sortObj = SortSelector.parseSortQuery(this.state.sortQuery);
		const modelProps = {
			locale: this.props.intl.locale,
			handleChange: this.onUpdateConfiguration,
			...this.props
		};

		const fc = new StreamFieldComponents(modelProps, fieldErrors);
		const advancedFields =
			activeStep === 'consumersettings' || activeStep === 'connectorsettings' || activeStep === 'producersettings'
				? this.getStreamFields(fc, true)
				: undefined;

		return (
			<Dialog open={open} onClose={onClose} maxWidth={false}>
				<DialogTitle>
					{this.getStreamInfo()}
				</DialogTitle>
				<DialogContent
					style={{
						height: '480px',
						minWidth: '700px'
					}}
				>
					<div
						style={{
							display: 'flex'
						}}
					>
						<div
							style={{
								minWidth: '220px',
								marginTop: '10px'
							}}
						>
							<Typography style={{ fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '12px', marginTop: '6px' }}>
								<FormattedMessage id="Stream.Steps" defaultMessage="Steps" />
							</Typography>
							{this.getProgress()}
						</div>
						<div
							style={{
								width: '100%',
								marginTop: '10px'
							}}
						>
							<Typography style={{ fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '12px', marginTop: '6px' }}>
								{this.getStepDesciption()}
							</Typography>
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
												<FormattedMessage id="Stream.ListConnectors" defaultMessage="List" />
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
												height: '380px',
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
															height: '35px',
															cursor: 'pointer',
														}}
														hover
														onClick={this.handleConnectorSelection()}
														selected={connector === undefined}
														tabIndex={-1}
														key="connector-new"
													>
														<TableCell component="th" scope="row" padding="none">
															<FormattedMessage
																id="Stream.CreateNewConnector"
																defaultMessage="Create"
															/>
														</TableCell>
													</TableRow>
													{this.getConnectors().map((resource) => (
														<TableRow
															style={{
																height: '35px',
																cursor: 'pointer',
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
											<FormattedMessage id="Stream.ListProviders" defaultMessage="Providers" />
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
											height: '380px',
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
															height: '35px',
															cursor: 'pointer',
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
							{activeStep === 'connectorname' || activeStep === 'consumername' || activeStep === 'producername' ? (
								<div
									style={{
										height: '85px'
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
										value={activeStep === 'connectorname' ? connectorName : streamName}
										onChange={this.handleNameChange}
										error={typeof error === 'string' && error.length > 0}
										helperText={error}
									/>
									<TextField
										label={
											<FormattedMessage
												id="Stream.DescriptionField"
												defaultMessage="Please enter a Description"
											/>
										}
										id="description"
										name="description"
										fullWidth
										multiline
										margin="normal"
										value={
											activeStep === 'connectorname'
												? this.state.connectorDescription
												: this.state.streamDescription
										}
										onChange={this.handleDescriptionChange}
									/>
								</div>
							) : null}
							{activeStep === 'consumersettings' || activeStep === 'connectorsettings'  || activeStep === 'producersettings'? (
								<div>
									<div
										style={{marginBottom: '10px' }}
									/>
									{this.getStreamFields(fc, false)}
									{/* eslint-disable-next-line no-nested-ternary */}
									{advancedFields.length ? (
										!this.state.showAdvanced ? (
											<Button
												style={{ marginTop: '15px', border: 'none' }}
												variant="outlined"
												size="small"
												fullWidth
												onClick={this.toggleAdvanced}
											>
												<ExpandMore />
												<FormattedMessage
													id="Stream.ShowExtendedSettings"
													defaultMessage="Show Extended Settings"
												/>
											</Button>
										) : (
											<Button
												style={{ marginTop: '15px', border: 'none' }}
												variant="outlined"
												size="small"
												fullWidth
												onClick={this.toggleAdvanced}
											>
												<ExpandLess />
												<FormattedMessage
													id="Stream.HideExtendedSettings"
													defaultMessage="Hide Extended Settings"
												/>
											</Button>
										)
									) : null}
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
					<Button color="primary" size="small" onClick={this.handleBack} disabled={this.getBackDisabled()}>
						{<KeyboardArrowLeft />}
						<FormattedMessage id="Setup.Back" defaultMessage="Back" />
					</Button>
					<Button color="primary" size="small" onClick={this.handleNext} disabled={this.getNextDisabled()}>
						{(this.props.type === 'connector' && this.state.activeStep === 'connectorsettings') ||
						(this.props.type !== 'connector' && this.state.activeStep === 'consumersettings') ?
						<FormattedMessage id="StreamStep.finish" defaultMessage="Finish" /> :
						<FormattedMessage id="Setup.Next" defaultMessage="Next" />}
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
