/* eslint-disable react/prop-types */
import React from 'react';
// eslint-disable-next-line
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Field } from '@cedalo/sdk-streams';
import { injectIntl, FormattedMessage } from 'react-intl';
import Card from '@material-ui/core/Card';
import FormControlLabel
	from '@material-ui/core/es/FormControlLabel/FormControlLabel';
import Switch from '@material-ui/core/Switch';
import CardContent from '@material-ui/core/CardContent';
import AdminConstants from '../../../constants/AdminConstants';
import loadingImage from '../../../loading.svg';
import StreamHelper from '../../../helper/StreamHelper';
import StreamToolBar from './StreamToolBar';
import AdminForm from '../AdminForm';
import * as Actions from '../../../actions/actions';
import StreamDeleteDialog from './StreamDeleteDialog';
import StreamForm from './StreamForm';
import StreamStatus from './StreamStatus';
import FieldComponents from './FieldComponents';
import NameField from './NameField';
import { accessManager } from '../../../helper/AccessManager';

const { RESOURCE_ACTIONS, RESOURCE_TYPES } = accessManager;

class StreamFormContainer extends React.Component {
	static getDerivedStateFromProps(props, state) {
		const { tempConfiguration } = props.streams;
		let progressing = false;
		if (state.model) {
			const configuration = StreamHelper.getConfiguration(props,
				state.model.id);
			progressing = configuration ? configuration.progressing : false;
		}
		if (state.model && !props.streams.tempConfiguration) {
			return {
				...state,
				model: {
					...state.model,
					name: state.model.name.trim(),
					status: undefined,
					state: props.streams.statusMap[state.model.id],
					progressing,
				},
			};
		}
		if (state.model && tempConfiguration) {
			return {
				...state,
				model: {
					...tempConfiguration,
					status: undefined,
					state: props.streams.statusMap[tempConfiguration.id],
				},
			};
		}
		return { ...state};
	}

	constructor(props) {
		super(props);
		this.state = {
			model: null,
			showParent: false,
		};
		this.debug = window.DLDEBUG;
	}

	componentDidMount() {
		const {
			match: {
				params: {
					configId,
				},
			},
		} = this.props;
		if (configId) {
			this.configurationId = configId;
			this.props.setConfigurationActive(configId);
		}
	}

	componentDidUpdate(prevProps, prevState) {
		if (!prevState.model && this.props.providers.length > 0 &&
			!this.props.streams.fetching && this.configurationId) {
			const configuration = StreamHelper.getConfiguration(this.props,
				this.configurationId);
			if (configuration && configuration.className) {
				this.props.setInitialConfiguration(configuration);
				// eslint-disable-next-line react/no-did-update-set-state
				this.setState({ ...prevState, model: configuration });
			}
		}
	}

	componentWillUnmount() {
		this.configurationId = null;
	}

	onUpdateConfiguration = (model) => {
		this.setState({ model });
	};

	onSaveConfiguration = async (configDiff) => {
		// eslint-disable-next-line react/prop-types
		if (configDiff.$set && Object.keys(configDiff.$set).length > 0) {
			if (typeof configDiff.$set.disabled !== 'undefined') {
				const resp = await this.props.saveConfiguration(configDiff,
					this.props);
				const { result } = resp && resp.response;
				if (result === true || result.ok) {
					this.props.reloadAllStreams([configDiff.id]);
					// const page = StreamHelper.getPageFromClass(props.tempConfig.type);
					// props.openPage(`/administration/${page}`);
				}

			} else {
				const pageSelected = StreamHelper.getPageFromClass(
					configDiff.type);
				this.props.updateConfiguration(configDiff, pageSelected);
				if (configDiff.$set['connector.id'] && this.state.showParent) {
					this.toggleShowParent();
					this.toggleShowParent();
				}
			}
		}
	};

	getResources = () => [
		...this.props[AdminConstants.CONFIG_TYPE.ConnectorConfiguration],
		...this.props[AdminConstants.CONFIG_TYPE.ProducerConfiguration],
		...this.props[AdminConstants.CONFIG_TYPE.ConsumerConfiguration],
	].filter(r => r.id !== this.props.activeConfigurationId);

	toggleShowParent = () => {
		this.setState({ showParent: !this.state.showParent });
	};

	isConnnector = () => {
		const { model } = this.state;
		return model.className === 'ConnectorConfiguration';
	};

	validate = async (model, name /* value */) => {
		let errors = [];
		switch (name) {
			case 'name': {
				const configurations = [
					...this.props[AdminConstants.CONFIG_TYPE.ConnectorConfiguration],
					...this.props[AdminConstants.CONFIG_TYPE.ProducerConfiguration],
					...this.props[AdminConstants.CONFIG_TYPE.ConsumerConfiguration],
				];
				const existing = configurations.filter(
					c => c.name.toLowerCase() === model.name.toLowerCase());
				errors = (existing.length > 0) ? [
					this.props.intl.formatMessage({
						id: 'Admin.duplicateName',
						defaultMessage: 'Name already taken, please select unique name',
					})] : [];
				this.props.setAppState({
					errors,
				});
				break;
			}
			default:
				this.props.setAppState({
					errors: [],
				});
		}
		return errors;
	};

	handleDelete = (res) => {
		if (res === true) {
			const pageSelected = StreamHelper.getPageFromClass(this.state.model.className);
			this.props.openPage(`/administration/${pageSelected}`);
		}
	};

	isDirty = () => {
		const { tempConfiguration, initialConfig, tempConfig } = this.props.streams;
		if(!tempConfig) {
			return false;
		}
		if(!initialConfig) {
			return !!tempConfiguration;
		}
		const IGNORE = ['progressing', 'status', 'state', 'disabled', '_id', 'id', 'owner', 'connector', 'lastAccessed', 'lastModified', 'provider', 'className'];
		const diffs = Object.keys(this.state.model).filter(k => {
			if(!IGNORE.includes(k)) {
				if(Array.isArray(initialConfig[k]) && this.state.model[k]) {
					if(initialConfig[k].length !== this.state.model[k].length) {
						return true;
					}
					return !!initialConfig[k].find(e => !this.state.model[k].includes(e));
				}
				return initialConfig[k] !== this.state.model[k]
			}

			return false;
		});
		if(initialConfig.connector && this.state.model.connector && initialConfig.connector.id !== this.state.model.connector.id) {
			diffs.push('connector');
		}
		return diffs.length>0;
	};

	render() {
		const { fetching } = this.props;
		const { model } = this.state;
		if (fetching) {
			return (
				<div style={{ textAlign: 'center' }} className="loader">
					<img src={loadingImage} alt="loading"/><br/>
					<FormattedMessage
						id="Admin.loading"
						defaultMessage="Loading..."
					/>
				</div>);
		}
		if (!model) return null;
		const pageSelected = StreamHelper.getPageFromClass(model.className);
		if (!pageSelected) {
			return null;
		}
		const canEdit = accessManager.can(RESOURCE_TYPES.STREAM,
			RESOURCE_ACTIONS.EDIT);
		const conflicts = StreamHelper.getConficts(this.props);
		const alternatives = StreamHelper.getBaseAlternatives(
			this.props, model);
		const modelProps = {
			model,
			locale: this.props.locale,
			handle: this.onUpdateConfiguration,
			validate: this.validate,
			save: this.onSaveConfiguration,
			...this.props,
		};
		const fc = new FieldComponents(modelProps, model);
		const fcConnector = !this.isConnnector() ? new FieldComponents(
			modelProps, model) : undefined;
		const modelConnector = !this.isConnnector()
			? StreamHelper.getConnectorOf(model, this.props.connectors)
			: undefined;
		const { headerBackgroundColor, icon } = AdminConstants.GRID_CONFIG[model.className];
		return (
			<div>
				<StreamDeleteDialog onDelete={this.handleDelete}/>
				<AdminForm
					resource={model}
					headerBackgroundColor={headerBackgroundColor}
					icon={icon}
					isDirty={this.isDirty()}
					cardHeader={<StreamToolBar
						model={model}
						isDirty={this.isDirty()}
						match={this.props.match}
						headerBackgroundColor={headerBackgroundColor}
						icon={icon}
						listingPage={pageSelected}
						toggleResourceProgress={(res) => this.props.timeoutStreamControlEvent(
							res)}
					/>}
				>
					<StreamStatus model={model}/>

					{fc.getCheckBox(new Field({
						id: 'disabled',
						label: {
							en: 'Disabled',
							de: 'Deaktiviert',
						},
					}), model.disabled || !canEdit)}

					<NameField
						getResources={this.getResources}
						value={model.name}
						onNameChange={(event) => fc.handler(event)}
						disabled={!canEdit}
					/>

					{this.isConnnector() ? null : <div
						style={{ display: 'flex' }}>
						<div style={{ width: 'calc(100% - 150px)' }}>
							{fc.getSelect(
								new Field({
									id: 'connector.id',
									label: {
										en: 'Connector',
										de: 'Konnektor',
									},
									options: alternatives,
								}),
								model.connector.id,
								!canEdit,
							)}
						</div>
						<div style={{
							display: 'inline',
							marginTop: '15px',
							marginLeft: '15px',
							width: '150px',
						}}>
							<FormControlLabel
								control={
									<Switch
										checked={!!this.state.showParent}
										onChange={this.toggleShowParent}
									/>
								}
								label={!this.state.showParent ?
									<FormattedMessage id="More"
									                  defaultMessage="More"/> :
									<FormattedMessage id="Less"
									                  defaultMessage="Less"/>}
							/>
						</div>
					</div>}

					{!this.state.showParent || this.isConnnector() ? null :
						<div style={{
							borderStyle: 'ridge',
							padding: '20px',
							marginLeft: '10px',
							maxHeight: '200px',
							overflowY: 'scroll',
						}}>
							<StreamForm
								disabled
								fc={fcConnector}
								getResources={() => []}
								model={modelConnector}
								{...this.props}
							/>
						</div>
					}
					<StreamForm
						fc={fc}
						getResources={this.getResources}
						model={model}
						conflicts={conflicts}
						alternatives={alternatives}
						{...modelProps}
					/>
				</AdminForm>

				{!this.debug ? null : (
					<Card
						style={{ maxHeight: '300px', overflowY: 'scroll' }}
					>
						<CardContent>
							{this.props.streams.controlEvents.map(event => (
								<p>
									<code>
										{event.timestamp}: {event.streamName} ({event.streamId}):
										{event.streamEventType}
										{event.data && event.data.error &&
										event.data.error.code ?
											event.data.error.code : ''} :
										{event.data && event.data.error &&
										event.data.error.message ?
											event.data.error.message : ''}
									</code>
								</p>))}
						</CardContent>
					</Card>
				)}
			</div>);
	}
}

StreamFormContainer.propTypes = {};

StreamFormContainer.defaultProps = {};

function mapStateToProps(state) {
	return {
		appState: state.appState,
		locale: state.locales.locale,
		streams: state.streams,
		fetching: state.streams.fetching,
		activeConfigurationId: state.streams.activeConfigurationId,
		providers: state.streams.providers,
		connectors: state.streams.connectors,
		consumers: state.streams.consumers,
		producers: state.streams.producers,
		addDialogOpen: state.streams.addDialogOpen,
		tempConfig: state.streams.tempConfig,
		popupMenuE: state.streams.popupMenuE,
		dirty: state.streams.dirty,
		reloadResponse: state.streams.reloadResponse,
		reloadStreamsPending: state.streams.reloadStreamsPending,
		machines: state.machines.data,
		user: state.user,
	};
}

function mapDispatchToProps(dispatch) {
	return bindActionCreators({ ...Actions }, dispatch);
}

export default injectIntl(
	connect(mapStateToProps, mapDispatchToProps)(StreamFormContainer));
