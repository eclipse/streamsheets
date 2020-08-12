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
import {
	ProviderConfiguration,
	ConnectorConfiguration,
	ConsumerConfiguration,
	ProducerConfiguration,
} from '@cedalo/sdk-streams';
import ConfigManager from '../helper/ConfigManager';
import gatewayClient from '../helper/GatewayClient';
import AdminConstants from '../constants/AdminConstants';

const CONFIG = ConfigManager.config.gatewayClientConfig;

const classConfigTypeMapping = {
	ProviderConfiguration: 'providers',
	ConnectorConfiguration: 'connectors',
	ConsumerConfiguration: 'consumers',
	ProducerConfiguration: 'producers',
}

export default class StreamHelper {

	static getStreamState(stream) {
		return stream.state;
	}
	static getStreamStateIcon(stream) {
		return StreamHelper.getIconForState(StreamHelper.getStreamState(stream));
	}

	static getIconForState(state) {
		switch (state) {
			case 'connected':
				return "resources/connected.svg";
			case 'disconnected':
				return 'resources/disconnected.svg';
			default:
				if (state === undefined || state === '') {
					return null;
				}
				return 'resources/connected.svg';
		}
	}

	static async executeStreamCommand(scope, cmd) {
		return new Promise((resolve, reject) => {
			gatewayClient.connect(CONFIG)
				.then(() => gatewayClient.executeStreamCommand(scope, cmd))
				.then((res) => {
					resolve(res);
				})
				.catch(e => reject(e));
		});
	}

	static isConfigClass(config) {
		return (config instanceof ConsumerConfiguration
				|| config instanceof ProducerConfiguration
				|| config instanceof ConnectorConfiguration);
	}

	static isConnector(resource) {
		return resource.className === 'ConnectorConfiguration';
	};

	static async save(scope, configuration, props) {
		let json = {};
		if (configuration) {
			if (StreamHelper.isConfigClass(configuration) || configuration.className) {
				if (!StreamHelper.isConfigClass(configuration)) {
					configuration = StreamHelper.getInstanceFromObject(configuration, props);
				}
				if (typeof configuration.isValid === 'function') {
					if (!configuration.isValid()) {
						return false;
					}
				}
				json = configuration.toJSON();
				json._id = configuration.id;
			} else {
				json = { ...configuration };
				if(json.error) return false;
				if(json.$set.name) {
					json.$set.name= json.$set.name.trim();
				}
			}
			return new Promise((resolve, reject) => {
				gatewayClient.connect(CONFIG)
					.then(() => gatewayClient.saveDSConfiguration(scope, json))
					.then((res) => {
						resolve(res);
					})
					.catch(e => reject(new Error(e)));
			});
		}
		return false;
	}

	static async remove(scope, id) {
		try {
			await gatewayClient.connect(CONFIG);
			const result = await gatewayClient.deleteDSConfiguration(scope, id);
			return result;
		} catch (error) {
			throw new Error(error);
		}
	}

	static async reloadAllOnMachineServer(scope, sources = []) {
		return new Promise((resolve, reject) => {
			gatewayClient.connect(CONFIG)
				.then(() => (gatewayClient.reloadStreams(scope, sources)))
				.then((res) => {
					resolve(res);
				})
				.catch(e => reject(new Error(e)));
		});
	}

	static createNewConfiguration(configType, baseClassJson, props) {
		let newConfiguration = {};
		let providerConfiguration = {};
		let connectorConfiguration = {};
		if (baseClassJson.className === ProviderConfiguration.name) {
			providerConfiguration = new ProviderConfiguration(baseClassJson);
			newConfiguration = new ConnectorConfiguration({}, providerConfiguration);
		} else if (baseClassJson.className === ConnectorConfiguration.name) {
			const provider = this.getProviderOfConnector(baseClassJson, props);
			providerConfiguration = new ProviderConfiguration(provider);
			connectorConfiguration = new ConnectorConfiguration(baseClassJson, providerConfiguration);
			if (configType === AdminConstants.CONFIG_TYPE.ConsumerConfiguration) {
				newConfiguration = new ConsumerConfiguration({}, connectorConfiguration, providerConfiguration);
			} else {
				newConfiguration = new ProducerConfiguration({}, connectorConfiguration, providerConfiguration);
			}
		}
		const timestamp = new Date().getUTCMilliseconds();
		newConfiguration.name = `New_${StreamHelper.getPageFromClass(newConfiguration.className).slice(0, -1)}_${timestamp}`;
		newConfiguration.disabled = false;
		return newConfiguration;
	}

	 ConsumerConfiguration

	static getPageFromClass(name) {
		return classConfigTypeMapping[name];
	}

	static getActiveConfiguration(props) {
		const { activeConfigurationId } = props;
		const configurations = [];
		configurations.push(...props.providers);
		configurations.push(...props.connectors);
		configurations.push(...props.consumers);
		configurations.push(...props.producers);
		return configurations.find(c => c.id === activeConfigurationId);
	}

	static getConficts(props) {
		let conflicts = [];
		const stream = StreamHelper.getActiveConfiguration(props);
		if (!stream) {
			return conflicts;
		}
		if (stream.className === 'ConnectorConfiguration') {
			const consumers = StreamHelper.getConsumersUsingConnector(stream.id, props.consumers);
			const producers = StreamHelper.getProducersUsingConnector(stream.id, props.producers);
			conflicts = [...conflicts, ...consumers, ...producers];
		}
		return conflicts;
	}

	static getProviderOfConnector(connectorO, props) {
		let connector = { ...connectorO };
		if (connector.isRef) {
			connector = props[AdminConstants.CONFIG_TYPE.ConnectorConfiguration]
				.find(a => a.id === connector.id);
		}
		return props[AdminConstants.CONFIG_TYPE.ProviderConfiguration]
			.find(p => p.id === connector.provider.id);
	}

	static getBaseAlternatives(props, configuration) {
		let connectors = [];
		try {
			if (configuration.className === AdminConstants.CONFIG_CLASS.ConsumerConfiguration
					|| configuration.className === 'ProducerConfiguration') {
				const connector = props[AdminConstants.CONFIG_TYPE.ConnectorConfiguration]
					.filter(c => c.id === configuration.connector.id)[0];
				connectors = props[AdminConstants.CONFIG_TYPE.ConnectorConfiguration]
					.filter(p => p.provider.id === connector.provider.id)
					.map(a => ({ label: a.name, value: a.id }));
			}
		} catch (e) {
			console.error(e);
		}
		return connectors;
	}

	static getConsumersUsingConnector(connectorId, consumers) {
		return consumers ? consumers.filter(f => f.connector.id === connectorId) : [];
	}

	static getConnectorConfig(connector, connectors) {
		return connectors.find(f => f.id === connector.id);
	}

	static getProducersUsingConnector(connectorId, producers) {
		return producers ? producers.filter(f => f.connector.id === connectorId) : [];
	}

	static getInstanceFromObject(model, props) {
		if (model && model.className) {
			switch (model.className) {
			case ProviderConfiguration.name: {
				return new ProviderConfiguration(model);
			}
			case ConnectorConfiguration.name: {
				const connectorModel = props.connectors.find(a => a.id === model.id);
				const provider = StreamHelper.getProviderOfConnector(connectorModel, props);
				return new ConnectorConfiguration(model, provider);
			}
			case ConsumerConfiguration.name: {
				const connector = StreamHelper.getInstanceFromObject(model.connector, props);
				const connectorModel = props.connectors.find(a => a.id === connector.id);
				const provider = StreamHelper.getProviderOfConnector(connectorModel, props);
				return new ConsumerConfiguration(model, connector, provider);
			}
			case ProducerConfiguration.name: {
				const connector = StreamHelper.getInstanceFromObject(model.connector, props);
				const connectorModel = props.connectors.find(a => a.id === connector.id);
				const provider = StreamHelper.getProviderOfConnector(connectorModel, props);
				return new ProducerConfiguration(model, connector, provider);
			}
			default: {
				return undefined;
			}
			}
		}
		return undefined;
	}
}
