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
const events = require('events');
const IdGenerator = require('@cedalo/id-generator');
const Consumer = require('./Consumer');
const Connector = require('./Connector');
const Producer = require('./Producer');
const { ERRORS } = require('./Constants');
const DefaultLogger = require('./DefaultLogger');

const ProviderConfiguration = require('./configurations/ProviderConfiguration');
const ConnectorConfiguration = require('./configurations/ConnectorConfiguration');
const ConsumerConfiguration = require('./configurations/ConsumerConfiguration');
const ProducerConfiguration = require('./configurations/ProducerConfiguration');

class Provider {
	constructor(providerConfig, logger) {
		this.logger = logger || new DefaultLogger();
		this._emitter = new events.EventEmitter();
		this._config = {
			name: 'Abstract Consumer Provider'
		};
		if (providerConfig) {
			if (providerConfig instanceof ProviderConfiguration) {
				this._config = providerConfig;
			} else {
				this._config = new ProviderConfiguration(providerConfig);
			}
			this._name = providerConfig.name || 'Abstract Consumer Provider';
		}
		this._id = this._id || IdGenerator.generate();
		this._consumers = new Map();
		this._producers = new Map();
		this._defConfigConnectorsMap = new Map();
		this._defConfigConsumersMap = new Map();
	}

	toJSON() {
		return this.config.toJSON();
	}

	addDefConfig(config) {
		if (config instanceof ConnectorConfiguration) {
			this._defConfigConnectorsMap.set(config.id, config);
		} else if (config instanceof ConsumerConfiguration) {
			this._defConfigConsumersMap.set(config.id, config);
		} else if (config.className === ConnectorConfiguration.NAME) {
			const config_ = new ConnectorConfiguration(config);
			this._defConfigConnectorsMap.set(config_.id, config_);
		} else if (config.className === ConsumerConfiguration.NAME) {
			const config_ = new ConsumerConfiguration(config);
			this._defConfigConsumersMap.set(config_.id, config_);
		}
	}

	get defConfigConnectorsMap() {
		return this._defConfigConnectorsMap;
	}

	get defConfigConsumersMap() {
		return this._defConfigConnectorsMap;
	}

	get allDefConfigs() {
		return [
			...Array.from(this._defConfigConnectorsMap.values()),
			...Array.from(this._defConfigConsumersMap.values())
		];
	}

	setLogger(newLogger) {
		this.logger = newLogger;
	}

	async provide(config_) {
		if (!config_) {
			return this.handleError(
				new Error('No Stream config'),
				ERRORS.FAILEDTOINITIALIZE,
				config_
			);
		}
		let config = Object.assign({}, config_);
		if(typeof config_.toJSON === 'function') {
			const connector = typeof config_.connector.toJSON === 'function' ? config_.connector.toJSON() : config_.connector;
			config = {
				...config_.toJSON(),
				connector
			}
		}
		if (
			(config.className === ConsumerConfiguration.name ||
				config.className === ProducerConfiguration.name) &&
			config.connector.disabled
		) {
			return this.handleError(
				new Error(`CONNECTOR_DISABLED ${config.connector.name}`),
				'CONNECTOR_DISABLED',
				config_
			);
		}
		if (config.className === ConsumerConfiguration.name) {
			return this.provideConsumer(config);
		}
		if (config.className === ProducerConfiguration.name) {
			return this.provideProducer(config);
		}
		return this.handleError(
			new Error('Invalid Stream config'),
			ERRORS.FAILEDTOINITIALIZE,
			config_
		);
	}

	async provideProducer(config) {
		if (
			config.connector.provider &&
			config.connector.provider.canProduce === false
		) {
			this.logger.warn(
				`Provider ${
					config.connector.provider.name
				} cannot produde for ${config.name}`
			);
			//		return this.handleError(
			//				new Error('PROVIDER_NOT_PRODUCING')
			//		);
		}
		const producer = new this.Producer(config);
		producer.setLogger(this.logger);
		if (this.producersMap.has(producer.id)) {
			const existing = this.producersMap.get(producer.id);
			if(existing && typeof existing._dispose === 'function' ) {
				await existing._dispose();
				this.producersMap.delete(producer.id);
			}
		}
		try {
			this.producersMap.set(producer.id, producer);
			producer.on(Connector.EVENTS.CONNECT, async (p) => {
				if (p.type !== Connector.TYPE.CONSUMER) {
					this.producersMap.set(p.id, p);
				}
			});
			producer.on(Connector.EVENTS.DISPOSED, async (c) => {
				if(c.force) {
					Array.from(this._consumers.values()).forEach(async (f) => {
						const connectorId = f.config.connector.id;
						if (connectorId === c.id && f.isConnected) {
							await f._dispose();
						}
					});
					Array.from(this._producers.values())
					.filter((p) => p.config.id !== p.config.connector.id)
					.forEach(async (f) => {
						const connectorId = f.config.connector.id;
						if (connectorId === c.id && f.isConnected) {
							await f._dispose();
						}
					});
					this.removeProducerById(c.id);
				}
			});
			this._emitter.emit(Provider.EVENTS.PROVIDE, producer.id);
			return producer;
		} catch (err) {
			return this.handleError(
				err,
				ERRORS.FAILEDTOINITIALIZE,
				producer.config
			);
		}
	}

	async provideConsumer(config) {
		if (this.canConsume === false) {
			return false;
		}
		const consumer = new this.Consumer(config);
		consumer.setLogger(this.logger);
		if (this.consumersMap.has(consumer.id)) {
			const existing = this.consumersMap.get(consumer.id);
			if(existing && typeof existing._dispose === 'function' ) {
				await existing._dispose();
				this.consumersMap.delete(consumer.id);
			}
		}
		try {
			this.consumersMap.set(consumer.id, consumer);
			// consumer.on(Connector.EVENTS.CONNECT, async (f) => {
				// if (f.config.className === ConsumerConfiguration.NAME) {
					// this.consumersMap.set(f.id, f);
				// }
			// });
			consumer.on(Connector.EVENTS.DISPOSED, async (c) => {
				if(c.force) {
					this.removeConsumerById(c.id);
				}
			});
			this._emitter.emit(Provider.EVENTS.PROVIDE, consumer.id);
			return consumer;
		} catch (err) {
			return this.handleError(
				err,
				ERRORS.FAILEDTOINITIALIZE,
				consumer.config
			);
		}
	}

	removeProducerById(id) {
		this._producers.delete(id);
	}

	removeConsumerById(id) {
		this._consumers.delete(id);
	}

	set name(name) {
		this._config.name = name;
	}

	get config() {
		return this._config;
	}

	get Consumer() {
		return Consumer(this.Connector);
	}

	get Producer() {
		return Producer(this.Connector);
	}

	get Connector() {
		return Connector;
	}

	get canConsume() {
		return true;
	}

	get canProduce() {
		return true;
	}

	get definition() {
		return this._config.definition;
	}

	get labels() {
		return this._config.definition.fields.map((f) => f.label);
	}

	getConsumerById(id) {
		return this.consumersMap.get(id);
	}

	getConsumerByName(name) {
		return this.consumersList.find((f) => f.name === name);
	}

	getProducerById(id) {
		return this.producersMap.get(id);
	}

	getProducerByName(name) {
		return this.producersList.find((f) => f.name === name);
	}

	getConnectorById(id) {
		return this.getConsumerById(id) || this.getProducerById(id);
	}

	getConnectorByName(name) {
		return this.getConsumerByName(name) || this.getProducerByName(name);
	}

	async disposeConsumerById(id) {
		const consumer = this.consumersMap.get(id);
		if (consumer && consumer.dispose) {
			await consumer.dispose();
			this._emitter.emit(Provider.EVENTS.DISPOSED, id);
		}
		return consumer;
	}

	async disposeProducerById(id) {
		const producer = this.producersMap.get(id);
		if (producer && producer.dispose) {
			await producer.dispose();
			this._emitter.emit(Provider.EVENTS.DISPOSED, id);
		}
		return producer;
	}

	async disposeAll() {
		await Promise.all(
			this.consumersList.map(async (f) => this.disposeConsumerById(f.id))
		);
		await Promise.all(
			this.producersList.map(async (f) => this.disposeProducerById(f.id))
		);
		this._producers.clear();
		this._consumers.clear();
	}

	clear() {
		this.consumersList().clear();
		this.producersList().clear();
	}

	get consumersList() {
		return Array.from(this._consumers.values());
	}

	get consumersMap() {
		return this._consumers;
	}

	get producersList() {
		return Array.from(this._producers.values());
	}

	get producersMap() {
		return this._producers; // filter
	}

	get list() {
		return [...this.consumersList, ...this.producersList];
	}

	handleError(error, errorId, stream) {
		this._emitter.emit(Provider.EVENTS.ERROR, error, errorId, stream);
		this.logger.error(error);
		throw new Error(error);
	}

	on(event, fn) {
		this._emitter.on(event, fn);
	}

	off(event, fn) {
		this._emitter.off(event, fn);
	}

	validateConsumer(configuration) {
		throw new Error('Not implemented');
	}

	validateProducer(configuration) {
		throw new Error('Not implemented');
	}

	validateConnector(configuration) {
		throw new Error('Not implemented');
	}
}

Provider.EVENTS = {
	ERROR: 'error',
	PROVIDE: 'provide',
	DISPOSED: 'dispose'
};
module.exports = Provider;
