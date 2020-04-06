const { STREAM_TYPES, EVENTS, ERRORS } = require('./Constants');
const Field = require('./configurations/Field');
const Utils = require('./helpers/Utils');
const MessageParser = require('./helpers/MessageParser');
const Message = require('./helpers/Message');
const ConsumerConfiguration = require('./configurations/ConsumerConfiguration');

const DEF_CONF = {
	type: STREAM_TYPES.CONSUMER
};

const ConsumerMixin = (Connector) =>
	class Consumer extends Connector {
		constructor(cfg = {}) {
			cfg = Object.assign({}, DEF_CONF, cfg);
			super(cfg);
			this._readyTimeOut = this.config.readyTimeOut || 50000;
			this.ready = false;
			this.initialize = this.initialize
				? this.initialize.bind(this)
				: undefined;
			this.onMessage = this.onMessage.bind(this);
			this.onMessageBeforeEmit = this.onMessageBeforeEmit.bind(this);
			this.onMessageBeforeMeta = this.onMessageBeforeMeta.bind(this);
		}

		defineLifeCycle() {
			this.on(Connector.EVENTS.CONNECT, async () => {
				this._connecting = false;
				if (this.ready === false) {
					try {
						this.logger.debug(
							`Stream ${this.toString()} initialize() start`
						);
						if (typeof this.initialize === 'function') {
							await this.initialize();
						}
						this.ready = true;
						this.logger.debug(
							`Stream ${this.toString()} initialize() done`
						);
						this._emitter.emit(Connector.EVENTS.READY);
					} catch (err) {
						this.handleError(
							err,
							ERRORS.FAILEDTOINITIALIZE,
							this
						);
					}
				}
			});
			if (typeof this.test === 'function' && process.env.DL_CONSUMER_TEST) {
				this.on(Connector.EVENTS.READY, async () => {
					try {
						this.logger.info(
							`Starting test() for ${this.config.name}`
						);
						const result = await this._test();
						if (!result) {
							throw new Error(ERRORS.FAILEDTOTEST);
						}
						this.logger.info(`test() for ${this.config.name} pass`);
						this._emitter.emit(Connector.EVENTS.TEST, result);
					} catch (error) {
						this._emitter.emit(Connector.EVENTS.TEST, error);
						this.handleError(error, ERRORS.FAILEDTOTEST, this);
					}
				});
			}
		}

		async _respond(config) {
			this._emitter.emit(Consumer.EVENTS.RESPOND, config);
			try {
				return this.respond(config);
			} catch (e) {
				return this.handleError(e);
			}
		}

		async onMessage(source, m, meta) {
			// this.logger.debug(
			// 	`Consumer ${this.toString()} onMessage() from ${source}`
			// );
			let msg = {};
			try {
				msg = Utils.transformToJSONObject(m, this.config.mimeType);
			} catch (err) {
				msg.error = err.message;
			}
			let message = Message.fromJSON({
				Data: msg,
				Metadata: meta
			});
			message.metadata.error = msg.error;
			// this.logger.debug(
			// 	`Consumer ${
			// 		this.config.name
			// 	} to ${source} message received: ${JSON.stringify(msg)}`
			// );
			message.source = source;
			message.metadata.source = source;
			try {
				message = await this.onMessageBeforeMeta(source, message);
			} catch (err) {
				return this.handleErrorOnce(
					err,
					`onMessageBeforeMeta() error${err.message}`,
					this
				);
			}
			try {
				this.applyMetaData(message);
			} catch (e) {
				this.logger.error(
					`failed interpreting message ${JSON.stringify(
						message
					)} with error ${e}`
				);
			}
			try {
				message = await this.onMessageBeforeEmit(source, message);
			} catch (err) {
				return this.handleErrorOnce(
					err,
					`onMessageBeforeMeta() error${err.message}`,
					this
				);
			}
			this._emitter.emit(EVENTS.CONSUMER.MESSAGE, source, message, this.id);
			return message;
		}

		applyMetaData(message, samplePayload = false) {
			const metadata = {};
			const payload = message.data;
			metadata.samplePayload = samplePayload;
			try {
				if (this.config && this.config.labelAttribute) {
					metadata.label = MessageParser.parse(
						this.config.labelAttribute,
						payload
					);
				}
				if (this.config && this.config.idAttribute) {
					metadata.idAttribute = MessageParser.parse(
						this.config.idAttribute,
						payload
					);
				}
				metadata.provider = this.config.connector.provider.name;
				metadata.connector = this.config.connector.name;
				metadata.consumer = this.config.name;
				Object.keys(metadata).forEach((key) => {
					message.metadata[key] = metadata[key];
				});
			} catch (error) {
				this.logger.warn(`problem setting the metadata : ${error.message}`);
			}
		}

		getConsumerConfigById(id, type = Field.TYPES.TEXT) {
			return this.getConfigById(id, 'consumer', type);
		}

		toJSON() {
			return {
				id: this.config.id,
				name: this.config.name,
				type: this.config.type
			};
		}

		// Hooks

		async onMessageBeforeEmit(source, message) {
			return message;
		}

		async onMessageBeforeMeta(source, message) {
			return message;
		}

		async update(configDiff) {
			const { type, $set } = configDiff;
			const handlers = new Map();
			const definition = this.config.connector.provider.definition;
			if (type === ConsumerConfiguration.NAME) {
				Object.keys($set).forEach((id) => {
					if (id !== 'connector' && !id.includes('.')) {
						this.config[id] = $set[id];
						if (definition) {
							const field = definition.consumer.find(
								(def) => def.id === id
							);
							if (field && field.onUpdate) {
								handlers.set(
									field.onUpdate,
									this[field.onUpdate].bind(this)
								);
							}
						}
					}
				});
				if ($set.filter !== undefined) {
					this.config.filter = $set.filter;
				}
				if ($set.labelAttribute !== undefined) {
					this.config.labelAttribute = $set.labelAttribute;
				}
				if ($set.idAttribute !== undefined) {
					this.config.idAttribute = $set.idAttribute;
				}
			}
			return super.update(configDiff, handlers);
		}
	};

ConsumerMixin.EVENTS = {
	...EVENTS.CONNECTOR,
	...EVENTS.CONSUMER
};
module.exports = ConsumerMixin;
