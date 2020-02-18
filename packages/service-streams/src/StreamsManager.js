/* eslint-disable global-require */
const { LoggerFactory } = require('@cedalo/logger');
const { Topics } = require('@cedalo/protocols');
const sdk = require('@cedalo/sdk-streams');
const CONFIG = require('./config');
const StreamsMonitor = require('./StreamsMonitor');
const ConfigurationsManager = require('./ConfigurationsManager');
const ProvidersManager = require('./ProvidersManager');
const StreamsManagerHandler = require('./StreamsManagerHandler');
const { createAndConnect } = require('@cedalo/messaging-client');

const logger = LoggerFactory.createLogger(
	'Streams Service - Streams Manager',
	process.env.STREAMSHEETS_STREAMS_SERVICE_LOG_LEVEL
);

class StreamsManager {
	constructor(config) {
		this.repo = config.repo;
		this._started = false;
		this._messagingClient = null;
		this.managerHandler = new StreamsManagerHandler();
		this.streamsMonitor = new StreamsMonitor();
		this.configsManager = new ConfigurationsManager(config);
		this.providersManager = new ProvidersManager({
			repo: this.repo,
			managerHandler: this.managerHandler
		});
	}

	async init() {
		if (!this._started) {
			this._messagingClient = await createAndConnect();
			await this.managerHandler.init();
			await this.streamsMonitor.init();
		}
	}

	async start() {
		return this.reloadAll();
	}

	async reloadAll(streams) {
		await this.configsManager.loadConfigurations();
		if (Array.isArray(streams) && streams.length > 0) {
			return this.reloadStreams(streams);
		}
		logger.info('Starting reloadAll');
		try {
			await this.init();
			if (this._started) {
				this.streamsMonitor.disposeAll();
				await this.disposeAll();
			}
			if (!this._started) {
				logger.info('Define Providers');
				await this.defineProviders(CONFIG.providers);
				logger.info('Publish Functions');
				await this.publishFunctions();
			}
			this.loadStreams();
			logger.info('Finish reloadAll');
			this._started = true;
		} catch (error) {
			logger.error(error);
			throw new Error('failed to load streams');
		}
		return true;
	}

	reloadStreams(streams) {
		logger.info(`Starting reload ${streams}`);
		if (Array.isArray(streams)) {
			streams.forEach(this.reloadStream.bind(this));
		}
	}

	async reloadStream(name) {
		if (name) {
			name = name.trim();
			const stream = this.findStream(name);
			if (stream) {
				await stream._dispose(true);
			}
			const connector = this.configsManager.findConnector(name);
			if (connector) {
				return this.reloadStreamsByConnectorId(connector.id);
			}
			const config = await this.configsManager.loadConfigurationByNameOrId(
				name
			);
			if (
				config &&
				config.disabled !== true &&
				ConfigurationsManager.configIsConsumerOrProducer(config)
			) {
				return this.loadStream(config);
			}
			return false;
		}
		return false;
	}

	async updateStream(config) {
		const stream = this.getStreamById(config.id);
		if (stream) {
			if(config.$set && config.$set.connector) {
				const connector = this.configsManager.getConnectorbyId(config.$set.connector.id);
				await stream.update({
					...config,
					$set: {
						...config.$set,
						connector
					}
				});
			} else {
				await stream.update(config);
			}
			return stream.config;
		}
		return false;
	}

	async updateConnector(config) {
		const connectorId = config.id;
		const relStreams = this.configsManager
			.getActiveStreamConfigsByConnectorId(connectorId, true)
			.filter((f) => !!f.id);
		const updates = relStreams.map(async (f) => {
			const streamConfig = await this.updateStream({
				...config,
				type: f.className,
				id: f.id
			});
			if (typeof config.$set.disabled !== 'undefined') {
				await this.repo.updateConfiguration(f.id, config.$set);
				this.managerHandler.onConfigUpdate({
					...f.toJSON(),
					disabled: config.$set.disabled
				});
			}
			if (streamConfig) {
				await this.repo.saveConfiguration(streamConfig.connector);
			}
		});
		await Promise.all(updates).catch((e) => logger.error(e));
		await this.repo.updateConfiguration(config.id, config.$set);
		return this.repo.findConfigurationById(config.id);
	}

	async runStreamCommand(cmd) {
		const { value, cmdId, streamId } = cmd;
		const stream = this.findStream(streamId);
		if (!stream) {
			return {
				error: 'NO_STREAM'
			};
		}
		if (typeof stream[cmdId] !== 'function') {
			return {
				error: 'CMD_FUNC_INVALID'
			};
		}
		return stream[cmdId](value);
	}

	async executeCommand(cmd) {
		const { cmdType, streamId, className } = cmd;
		if (cmdType !== 'custom') {
			return {
				error: 'CMD_FUNC_INVALID_TYPE'
			};
		}
		const isConnector = ConfigurationsManager.configIsConnector({
			className
		});
		if (isConnector) {
			const streamConfigs = this.configsManager.getActiveStreamConfigsByConnectorId(
				streamId
			);
			const cmdRuns = streamConfigs.map(async (config) => {
				try {
					await this.runStreamCommand(
						Object.assign({}, cmd, { streamId: config.id })
					);
				} catch (e) {
					this.managerHandler.handleProviderError(e);
				}
			});
			return Promise.all(cmdRuns);
		}
		return this.runStreamCommand(cmd);
	}

	async saveConfiguration(config) {
		if(Array.isArray(config)) {
			const configs = ConfigurationsManager.orderConfigs(config);
			const saveConfigs = configs.map(this.saveConfiguration.bind(this));
			try {
				return Promise.all(saveConfigs);
			} catch (e) {
				return this.managerHandler.handleProviderError(e);
			}
		}
		if (config.$set) {
			const { id } = config;
			const configuration = this.configsManager.getConfigurationById(id);
			if (configuration) {
				if (config.$set.name) {
					const trimed = config.$set.name.trim();
					if (trimed.length < config.$set.name.length) {
						config.$set.name = trimed;
						this.managerHandler.handleProviderNotification(
							{ message: 'NAME_TRIMMED', type: 'popUp' },
							configuration
						);
					}
				}
				if (
					ConfigurationsManager.configIsConsumerOrProducer(
						configuration
					)
				) {
					const mergeConfigs = (out, $set) => {
						Object.keys(config.$set).forEach((key) => {
							if (key === 'connector') {
								out.connector._id = $set[key]._id;
								out.connector.id = $set[key].id;
							} else if (key === 'connector.id') {
								out.connector._id = $set[key];
								out.connector.id = $set[key];
							} else {
								out[key] = $set[key];
							}
						});
						out.isRef = false;
						return out;
					};
					// TODO
					let outConfiguration;
					if (
						ConfigurationsManager.configIsConsumerOrProducer(
							configuration
						)
					) {
						const streamConfig =
							(await this.updateStream(config)) ||
							mergeConfigs(configuration, config.$set);
						outConfiguration = this.configsManager.getDeepConfiguration(
							streamConfig
						);
					}
					this.setConfiguration(outConfiguration.toJSON());
					this.managerHandler.onConfigUpdate(
						outConfiguration.toJSON()
					);
					const result = await this.repo.saveConfiguration(
						outConfiguration.toJSON()
					);
					if(config.$set.connector && config.$set.connector.id) {
						this.reloadStream(config.id);
					}
					return result;
				} else if (
					ConfigurationsManager.configIsConnector(configuration)
				) {
					const newConfig = await this.updateConnector(config);
					this.managerHandler.onConfigUpdate(newConfig);
					this.setConfiguration(newConfig);
					this.reloadStream(newConfig.name);
					return true;
				}
				return true;
			}
		}
		try {
			if (!this.configsManager.getConfigurationById(config.id)) {
				const result = await this.repo.saveConfiguration(config);
				this.managerHandler.onConfigUpdate(config);
				this.configsManager.setConfiguration(config);
				this.configurations.push(config);
				this.reloadStream(config.name);
				return result;
			}
			config = this.configsManager.getDeepConfiguration(config);
			const result = await this.repo.saveConfiguration(config.toJSON());
			this.managerHandler.onConfigUpdate(config.toJSON());
			this.configsManager.setConfiguration(config.toJSON());
			this.configurations.push(config.toJSON());
			this.reloadStream(config.name);
			return result;
		} catch (e) {
			logger.error(e);
			this.managerHandler.handleProviderNotification(
				{ message: `ERROR_SAVING: ${e.message}`, type: 'popUp' },
				config
			);
			return {
				error: e.message
			};
		}
	}

	async deleteConfiguration(configId) {
		const stream = this.getStreamById(configId);
		if(stream) {
			await stream._dispose(true);
		}
		this.configsManager.removeConfiguration(configId);
		this.managerHandler.onConfigDelete(configId, !!stream);
		return this.repo.deleteConfiguration(configId);
	}

	loadConsumers() {
		logger.info('Start loading consumers');
		const activeConsumers = this.configsManager.getDeepConsumerConfigs(
			true
		).map(config => config.toJSON());
		activeConsumers.forEach(this.loadStream.bind(this));
	}

	loadProducers() {
		logger.info('Start loading producers');
		const activeProducers = this.configsManager.getDeepProducerConfigs(
			true
		).map(config => config.toJSON());
		activeProducers.forEach(this.loadStream.bind(this));
	}

	loadStreams() {
		this.loadConsumers();
		this.loadProducers();
	}

	reloadStreamsByConnectorId(connectorId) {
		const streamConfigs = this.configsManager.getActiveStreamConfigsByConnectorId(
			connectorId
		);
		return this.reloadStreams(streamConfigs.map((config) => config.id));
	}

	async loadStream(config) {
		try {
			logger.info(`Loading stream: ${config.className} - ${config.name}`);
			const mergedConfig = this.configsManager.getDeepConfiguration(
				config
			);
			if (mergedConfig) {
				const providerId =
					mergedConfig.connector.provider._id ||
					mergedConfig.connector.provider.id;
				const provider = this.providers.get(providerId);
				if (!provider) {
					throw Error(`No provider for: ${providerId}`);
				}
				try {
					const stream = await provider.provide(mergedConfig);
					if (stream) {
						this.streamsMonitor.addStream(stream);
						stream.on(
							sdk.Connector.EVENTS.PERSIST,
							async (conf) => {
								conf = this.configsManager.getDeepConfiguration(conf);
								if(this.repo) {
									await this.repo.saveConfiguration(conf.toJSON());
								} else {
									logger.warn('could not save configuration after loading stream');
								}
								this.managerHandler.onConfigUpdate(conf.toJSON());
								this.configsManager.setConfiguration(conf.toJSON());
								this.configurations.push(conf.toJSON());
							}
						);
						return stream._connect();
					}
				} catch (e) {
					this.managerHandler.handleProviderNotification(
						{ message: 'PROVIDER_NOT_PRODUCE', type: 'hidden' },
						config
					);
				}
			}
			this.managerHandler.handleProviderNotification(
				{ message: 'NO_PROVIDER', type: 'hidden' },
				config
			);
			logger.warn(`No provider for stream ${config.id}`);
			return null;
		} catch (error) {
			return this.managerHandler.handleProviderError(
				error,
				StreamsManager.ERRORS.PROVIDE,
				config.id
			);
		}
	}

	async publishFunctions() {
		const providers = Array.from(this.providers.values());
		const functions = providers.reduce(
			(functionArray, provider) =>
				functionArray.concat(
					provider.toJSON().definition.functions || []
				),
			[]
		);
		const message = {
			type: 'event',
			event: {
				data: functions
			}
		};
		this._messagingClient.publish(
			`${Topics.SERVICES_STREAMS_EVENTS}/functions`,
			message,
			{ qos: 2, retain: true }
		);
	}

	async disposeAll() {
		return Promise.all(this.providersList.map((p) => p.disposeAll()));
	}

	async defineProviders(providers, save) {
		await this.providersManager.defineProviders(providers, save);
		this.providersManager.providersList.map((p) =>
			this.configsManager.setConfiguration(p.config.toJSON())
		);
	}

	get configurations() {
		return this.configsManager.configurations;
	}

	get providersList() {
		return this.providersManager.providersList;
	}

	get providers() {
		return this.providersManager.providers;
	}

	get consumerConfigs() {
		return this.configsManager.consumerConfigs;
	}

	setConfiguration(newConfig) {
		return this.configsManager.setConfiguration(newConfig);
	}

	get streams() {
		return [...this.consumersList, ...this.producersList];
	}

	get streamNames() {
		return this.streams.map(s => s.name);
	}

	get consumersList() {
		const list = [];
		this.providersList.forEach((p) => {
			p.consumersList.forEach((f) => list.push(f));
		});
		return list;
	}

	get producersList() {
		const list = [];
		this.providersList.forEach((p) => {
			p.producersList.forEach((f) => list.push(f));
		});
		return list;
	}

	findConfiguration(idOrName) {
		return this.configsManager.getConfigurationById(idOrName) || this.configsManager.getConfigurationByName(idOrName);
	}

	findStream(idOrName) {
		return this.getStreamById(idOrName) || this.getStreamByName(idOrName);
	}

	getStreamByName(name) {
		return this.getConsumerByName(name) || this.getProducerByName(name);
	}

	getStreamById(id) {
		return this.getConsumerById(id) || this.getProducerById(id);
	}

	getConsumerByName(name) {
		return this.consumersList.find((f) => f.config.name === name);
	}

	getConsumerById(id) {
		return this.consumersList.find((f) => f.id === id);
	}

	getProducerById(id) {
		return this.producersList.find((f) => f.id === id);
	}

	getProducerByName(name) {
		return this.producersList.find((f) => f.config.name === name);
	}
}

StreamsManager.ERRORS = {
	PROVIDE: 'PROVIDE_FAIL',
	DEFINE_PROVIDER: 'DEFINE_PROVIDER_FAIL',
	DEFINE_STRATERGY: 'DEFINE_FAIL',
	TEST: 'TEST'
};
module.exports = StreamsManager;
