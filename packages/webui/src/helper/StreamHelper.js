import {
	ProviderConfiguration,
	ConnectorConfiguration,
	ConsumerConfiguration,
	ProducerConfiguration,
} from '@cedalo/sdk-streams';
import statusok from '../resources/statusok.png';
import statuswarning from '../resources/statuswarning.png';
import statuserror from '../resources/statuserror.png';
import ConfigManager from '../helper/ConfigManager';
import gatewayClient from '../helper/GatewayClient';
import AdminConstants from '../constants/AdminConstants';

const CONFIG = ConfigManager.config.gatewayClientConfig;

export default class StreamHelper {
	static BUTTONS = {
		START: 101,
		STOP: 102,
		RELOAD: 103,
		DELETE: 104,
		SAVE: 200,
		CLOSE: 100,
	};

	static NO_STREAM = 'no_stream';

	static getAdminUser(props){
		return props.security.users.find(u => u._id === AdminConstants.ADMIN_SECURITY.ADMIN_USER__ID);
	}

	static getStreamState(stream) {
		return stream.state || StreamHelper.getStatusFor(stream.status ? stream.status.streamEventType : '');

	}
	static getStreamStateIcon(stream) {
		const state = StreamHelper.getStreamState(stream);
		switch (state) {
			case 'connected':
				return statusok;
			case 'disconnected':
				return statuserror;
			default:
				if (state === undefined || state === '' || state === StreamHelper.NO_STREAM) {
					return null;
				}
				return statuswarning;
		}
	}

	static getIconForState(state) {
		switch (state) {
			case 'connected':
				return statusok;
			case 'disconnected':
				return statuserror;
			default:
				if (state === undefined || state === '') {
					return null;
				}
				return statuswarning;
		}
	}
	static getStatusFor(signal = '') {
		signal = signal.toLowerCase();
		switch (signal) {
			case 'ready':
				return 'connected';
			case 'connect':
				return 'connected';
			case 'dispose':
				return 'disconnected';
			case 'warning':
				return 'connected'; // 'connected with warning'
			case 'feedback':
				return 'connected'; // 'message from stream';
			default:
				return 'disconnected';
		}
	}

	static toggleDSProgress(resourceId, props) {
		const config = StreamHelper.getConfiguration(props.streams, resourceId);
		const stream = { ...config, progressing: !config.progressing };
		props.updateConfiguration(stream, StreamHelper.getPageFromClass(stream.className));
		return stream;
	}

	static async handleDSMenuAction(optionIndex, resourceId, props) {
		switch (optionIndex) {
		case StreamHelper.BUTTONS.SAVE: {
			const stream = StreamHelper.toggleDSProgress(resourceId, props);
			if(props.tempConfig) {
				const resp = await props.saveConfiguration(props.tempConfig, props);
				if(resp && !resp.error) {
					const {result} = resp.response;
					if(result === true || result.ok === true) {
						props.reloadAllStreams([props.tempConfig.$set.name || stream.name]);
					}
				}
			}
			break;
		}
		case StreamHelper.BUTTONS.CLOSE: {
			const stream = StreamHelper.getConfiguration(props, resourceId);
			const page = StreamHelper.getPageFromClass(stream.className);
			props.openPage(`/administration/${page}`);
			break;
		}
		case StreamHelper.BUTTONS.START: {
			const stream = StreamHelper.toggleDSProgress(resourceId, props);
			StreamHelper.executeStreamCommand({
				cmdType: 'custom',
				value: undefined,
				cmdId: 'start',
				streamId: resourceId,
				className: stream.className
			}).then((r) => {
				console.log(r);
			}).catch((e) => {
				props.toggleStreamProgress(stream);
				console.error(e);
			});
			break;
		}
		case StreamHelper.BUTTONS.STOP: {
			const stream = StreamHelper.toggleDSProgress(resourceId, props);
			StreamHelper.executeStreamCommand({
				cmdType: 'custom',
				value: undefined,
				cmdId: 'stop',
				streamId: resourceId,
				className: stream.className
			}).then((r) => {
				console.log(r);
			}).catch((e) => {
				props.toggleStreamProgress(stream);
				console.error(e);
			});
			break;
		}
		case StreamHelper.BUTTONS.RELOAD: {
			const stream = StreamHelper.toggleDSProgress(resourceId, props);
			props.reloadAllStreams([stream.name]);
			break;
		}
		case StreamHelper.BUTTONS.DELETE: {
			const { deleteDialogOpen } = props.appState;
			props.setDeleteDialogOpen(!deleteDialogOpen);
			break;
		}
		default:
		}
	}

	static getResourceState(resource, statusMap, initial = false) {
		if(StreamHelper.isConnector(resource) && (typeof statusMap[resource.id] === 'undefined' || (!statusMap[resource.id] && !initial))){
			return StreamHelper.NO_STREAM;
		}
		const status = (resource.status && resource.status.streamEventType)
				|| statusMap[resource.id] || 'dispose';
		let state = resource.disabled ? 'disabled' : status;
		state = typeof status === 'string' ?
			status.toLowerCase().replace('consumer_', '').replace('connector_', '') : 'progress';
		// state = status === 'loading' ? 'progress' : state;
		// state = status === 'dispose' ? 'progress' : state;
		// state = status === 'ready' ? 'running' : state;
		return state;
	}

	static async executeStreamCommand(cmd) {
		return new Promise((resolve, reject) => {
			gatewayClient.connect(CONFIG)
				.then(() => gatewayClient.executeStreamCommand(cmd))
				.then((res) => {
					resolve(res);
				})
				.catch(e => reject(e));
		});
	}

	static async findAllByType(type) {
		const configClasses = {
			providers: 'ProviderConfiguration',
			connectors: 'ConnectorConfiguration',
			consumers: AdminConstants.CONFIG_CLASS.ConsumerConfiguration,
			producers: 'ProducerConfiguration',
		};
		return new Promise((resolve, reject) => {
			gatewayClient.connect(CONFIG)
				.then(() => gatewayClient.loadAllDSConfigurations())
				.then((configurations) => {
					resolve(configurations[configClasses[type]]);
				})
				.catch(e => reject(new Error(e)));
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

	static async save(configuration, props) {
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
					.then(() => gatewayClient.saveDSConfiguration(json))
					.then((res) => {
						resolve(res);
					})
					.catch(e => reject(new Error(e)));
			});
		}
		return false;
	}

	static async remove(id) {
		return new Promise((resolve, reject) => {
			gatewayClient.connect(CONFIG)
				.then(() => gatewayClient.deleteDSConfiguration(id))
				.then((res) => {
					resolve(res);
				})
				.catch(e => reject(new Error(e)));
		});
	}

	static async reloadAllOnMachineServer(sources = []) {
		return new Promise((resolve, reject) => {
			gatewayClient.connect(CONFIG)
				.then(() => (gatewayClient.reloadStreams(sources)))
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

	static getPageFromClass(name) {
		const classes = {
			providers: 'ProviderConfiguration',
			connectors: 'ConnectorConfiguration',
			consumers: AdminConstants.CONFIG_CLASS.ConsumerConfiguration,
			producers: 'ProducerConfiguration',
		};
		const page = Object.keys(classes).find(key => name === classes[key]);
		return page;
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

	static getAllConfigurations(props) {
		const configurations = [];
		configurations.push(...props.providers);
		configurations.push(...props.connectors);
		configurations.push(...props.consumers);
		configurations.push(...props.producers);
		return configurations;
	}

	static getConfiguration(props, id) {
		const configurations = StreamHelper.getAllConfigurations(props);
		return configurations.find(c => c.id === id);
	}

	static getProviderForModel(model, props) {
		if (model.className === AdminConstants.CONFIG_CLASS.ConsumerConfiguration || model.className === 'ProducerConfiguration') {
			return this.getProviderOfConsumer(model, props);
		} else if (model.className === 'ConnectorConfiguration') {
			return this.getProviderOfConnector(model, props);
		}
		return null;
	}

	static getProviderOfConsumer(stream, props) {
		const connector = props[AdminConstants.CONFIG_TYPE.ConnectorConfiguration]
			.find(a => a.id === stream.connector.id);
		return props[AdminConstants.CONFIG_TYPE.ProviderConfiguration]
			.find(p => p.id === connector.provider.id);
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

	static getConnectorOf(stream, connectors) {
		return connectors.find(f => f.id === stream.connector.id);
	}

	static getProducersUsingConnector(connectorId, producers) {
		return producers ? producers.filter(f => f.connector.id === connectorId) : [];
	}


	static getMachinesUsingStream(streamId, machines) {
		return machines ?
			machines.filter(machine => !!machine.streamsheets.find((t) => {
				if (t.inbox && t.inbox.stream && t.inbox.stream.id) {
					return t.inbox.stream.id === streamId;
				}
				return false;
			})) : [];
	}

	static getInstanceFromObject(model, props) {
		if (model && model.className) {
			switch (model.className) {
			case ProviderConfiguration.name: {
				return new ProviderConfiguration(model);
			}
			case ConnectorConfiguration.name: {
				if (model.isRef) {
					return new ConnectorConfiguration(model);
				}
				const connectorModel = props.connectors.find(a => a.id === model.id);
				const provider = StreamHelper.getProviderOfConnector(connectorModel, props);
				return new ConnectorConfiguration(model, provider);
			}
			case ConsumerConfiguration.name: {
				if (model.isRef) {
					return new ConsumerConfiguration(model);
				}
				const connector = StreamHelper.getInstanceFromObject(model.connector, props);
				const connectorModel = props.connectors.find(a => a.id === connector.id);
				const provider = StreamHelper.getProviderOfConnector(connectorModel, props);
				return new ConsumerConfiguration(model, connector, provider);
			}
			case ProducerConfiguration.name: {
				if (model.isRef) {
					return new ProducerConfiguration(model);
				}
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
