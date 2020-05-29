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
const { LoggerFactory } = require('@cedalo/logger');
const {
	ProviderConfiguration,
	ConnectorConfiguration,
	ProducerConfiguration,
	ConsumerConfiguration
} = require('@cedalo/sdk-streams');
const { ArrayUtil } = require('@cedalo/util');

const logger = LoggerFactory.createLogger(
	'Streams Service - Configurations Manager',
	process.env.STREAMSHEETS_STREAMS_SERVICE_LOG_LEVEL
);

class ConfigurationsManager {
	constructor(config) {
		this.repo = config.repo;
		this.providerConfigs = new Map();
		this.connectorConfigs = new Map();
		this.consumerConfigs = new Map();
		this.producerConfigs = new Map();
		this.queueConfigs = new Map();
		this.setConfiguration = this.setConfiguration.bind(this);
	}

	getConfigurationById(id) {
		return (
			this.providerConfigs.get(id) ||
			this.connectorConfigs.get(id) ||
			this.consumerConfigs.get(id) ||
			this.producerConfigs.get(id)
		);
	}

	async getConfigurationsByName(name) {
		return this.repo.findConfigurationsByName(name);
	}

	removeConfiguration(id) {
		this.providerConfigs.delete(id);
		this.connectorConfigs.delete(id);
		this.consumerConfigs.delete(id);
		this.producerConfigs.delete(id);
	}

	get providers() {
		return [...this.providerConfigs.keys()];
	}

	static orderConfigs(configs = []) {
		const connectors = [];
		const streams = [];
		configs.forEach((c) => {
			if (ConfigurationsManager.configIsConnector(c)) {
				connectors.push(c);
			} else {
				streams.push(c);
			}
		});
		return [...connectors, ...streams];
	}

	static configIsConsumerOrProducer(config) {
		return config.className === ConsumerConfiguration.name || config.className === ProducerConfiguration.name;
	}

	static configIsConsumer(config) {
		return config.className === ConsumerConfiguration.name;
	}

	static configIsProducer(config) {
		return config.className === ProducerConfiguration.name;
	}

	static configIsConnector(config) {
		return config && config.className === ConnectorConfiguration.name;
	}

	getActiveConsumersByConnectorId(connectorId, inclDisabled = false) {
		const allConfigs = [];
		this.consumerConfigs.forEach((c) => {
			if (c.connector && c.connector.id === connectorId) {
				if (inclDisabled || (!inclDisabled && !c.disabled)) {
					allConfigs.push(this.getDeepConfiguration(c));
				}
			}
		});
		return allConfigs;
	}

	getActiveProducersByConnectorId(connectorId, inclDisabled = false) {
		const allConfigs = [];
		this.producerConfigs.forEach((c) => {
			if (c.connector && c.connector.id === connectorId) {
				if (inclDisabled || (!inclDisabled && !c.disabled)) {
					allConfigs.push(this.getDeepConfiguration(c));
				}
			}
		});
		return allConfigs;
	}

	getActiveStreamConfigsByConnectorId(connectorId, inclDisabled = false) {
		return [
			...this.getActiveConsumersByConnectorId(connectorId, inclDisabled),
			...this.getActiveProducersByConnectorId(connectorId, inclDisabled)
		];
	}

	getDeepConsumerConfiguration(config) {
		const connectorConfig_ = this.connectorConfigs.get(config.connector._id || config.connector.id);
		const connectorConfig = this.getDeepConnectorConfiguration(connectorConfig_);
		const providerConfig = this.providerConfigs.get(connectorConfig.provider.id);
		return new ConsumerConfiguration(config, connectorConfig, providerConfig);
	}

	getDeepProducerConfiguration(config) {
		const connectorConfig_ = this.connectorConfigs.get(config.connector._id || config.connector.id);
		const connectorConfig = this.getDeepConnectorConfiguration(connectorConfig_);
		const providerConfig = this.providerConfigs.get(connectorConfig.provider.id);
		return new ProducerConfiguration(config, connectorConfig, providerConfig);
	}

	getDeepConnectorConfiguration(config) {
		const connectorConfig = this.connectorConfigs.get(config._id || config.id);
		const providerConfig = this.providerConfigs.get(connectorConfig.provider.id);
		if (!providerConfig) {
			throw Error('INVALID_PROVIDER');
		}
		return new ConnectorConfiguration(config, providerConfig);
	}

	getDeepConsumerConfigs(onlyActive = true) {
		const allConfigs = [];
		this.consumerConfigs.forEach((c) => {
			try {
				allConfigs.push(this.getDeepConfiguration(c));
			} catch (e) {
				logger.error(e);
			}
		});
		if (onlyActive) {
			return allConfigs.filter((c) => !c.disabled);
		}
		return allConfigs;
	}

	getDeepProducerConfigs(onlyActive = true) {
		const allConfigs = [];
		this.producerConfigs.forEach((c) => {
			try {
				allConfigs.push(this.getDeepConfiguration(c));
			} catch (e) {
				logger.error(e);
			}
		});
		if (onlyActive) {
			return allConfigs.filter((c) => !c.disabled);
		}
		return allConfigs;
	}

	getDeepConfiguration(config) {
		switch (config.className) {
			case ConsumerConfiguration.name:
				return this.getDeepConsumerConfiguration(config);
			case ProducerConfiguration.name:
				return this.getDeepProducerConfiguration(config);
			case ConnectorConfiguration.name:
				return this.getDeepConnectorConfiguration(config);
			case ProviderConfiguration.name:
				return new ProviderConfiguration(config);
			default:
				throw Error('INVALID_CONFIG');
		}
	}

	setConfiguration(config) {
		switch (config.className) {
			case ProviderConfiguration.name:
				this.providerConfigs.set(config._id || config.id, config);
				break;
			case ConnectorConfiguration.name:
				this.connectorConfigs.set(config._id || config.id, config);
				break;
			case ConsumerConfiguration.name:
				this.consumerConfigs.set(config._id || config.id, config);
				break;
			case ProducerConfiguration.name:
				this.producerConfigs.set(config._id || config.id, config);
				break;
			default:
				break;
		}
	}

	async loadConfigurationById(configId) {
		const config = await this.repo.findConfigurationById(configId);
		if (config) {
			this.setConfiguration(config);
			return config;
		}
		logger.error(`no config for ${configId}`);
		return null;
	}

	async loadConfigurations() {
		this.providerConfigs.clear();
		this.connectorConfigs.clear();
		this.consumerConfigs.clear();
		this.producerConfigs.clear();
		const configurations = await this.repo.findAllConfigurations();
		const configsByType = ArrayUtil.partition(configurations, (config) => config.className);
		if(!configsByType[ProviderConfiguration.name]) {
			return []
		}
		configsByType[ProviderConfiguration.name].forEach(this.setConfiguration);
		configsByType[ConnectorConfiguration.name].forEach((config) => {
			if (this.providerConfigs.has(config.provider.id)) {
				this.setConfiguration(config);
			} else {
				logger.warn(`Missing Provider#${config.provider.id} referenced by Conncetor#${config.id}`);
			}
		});
		[...configsByType[ProducerConfiguration.name], ...configsByType[ConsumerConfiguration.name]].forEach(
			(config) => {
				if (this.connectorConfigs.has(config.connector.id)) {
					this.setConfiguration(config);
				} else {
					logger.warn(`Missing Connector#${config.connector.id} referenced by Stream#${config.id}`);
				}
			}
		);

		return [
			...this.providerConfigs.values(),
			...this.connectorConfigs.values(),
			...this.consumerConfigs.values(),
			...this.producerConfigs.values()
		];
	}

	findConnector(id) {
		return this.getConnectorbyId(id);
	}

	getConnectorbyId(id) {
		return this.connectorConfigs.get(id);
	}
}

module.exports = ConfigurationsManager;
