const IdGenerator = require('@cedalo/id-generator');
const { ERRORS, EVENTS, STREAM_TYPES } = require('./Constants');
const Stream = require('./Stream');
const ConnectorConfiguration = require('./configurations/ConnectorConfiguration');
const Field = require('./configurations/Field');
const Utils = require('./helpers/Utils');

const DEF_CONF = {
	type: STREAM_TYPES.CONNECTOR,
	notifyOnceDelay: 10000
};

const DEF_RETRY_OPTS = {
	forever: true,
	factor: 2,
	minTimeout: 1 * 1000,
	maxTimeout: 20 * 1000,
	randomize: true,
};

class Connector extends Stream {
	constructor(cfg = {}) {
		cfg = Object.assign({}, DEF_CONF, cfg);
		super(cfg);
		this._retryOpts = {
			forever: process.env.STREAMSHEETS_STREAM_RETRY_FOREVER || DEF_RETRY_OPTS.forever,
			factor: process.env.STREAMSHEETS_STREAM_RETRY_FACTOR || DEF_RETRY_OPTS.factor,
			minTimeout: process.env.STREAMSHEETS_STREAM_RETRY_MIN_TIMEOUT || DEF_RETRY_OPTS.minTimeout,
			maxTimeout: process.env.STREAMSHEETS_STREAM_RETRY_MAX_TIMEOUT || DEF_RETRY_OPTS.maxTimeout,
			randomize: process.env.STREAMSHEETS_STREAM_RETRY_RANDOMIZE || DEF_RETRY_OPTS.randomize,
		};
		this.config = cfg;
		this._notifyErrorTimeout = null;
		this._notifyWarningTimeout = null;
		this._connectTimeout = process.env.STREAM_CONNECT_TIMEOUT || 10000;
		this._reconnectPeriod = process.env.STREAM_RECONNECT_PERIOD || 10000;
		this._attempt = 0;
		if (this._reconnectPeriod < this._connectTimeoutId) {
			this._reconnectPeriod = this._connectTimeoutId;
			this.logger.warn(
				'reconnectPeriod cannot be smaller than connectTimeout. Assuming equals to connectTimeOut'
			);
		}
		this._connecting = false;
		this._connected = false;
		this._connectTimeoutId = null;
		this._reconnectTimeoutId = null;
		this._disconnecting = false;
		this.onClose = this.onClose.bind(this);
		this.handleError = this.handleError.bind(this);
		this.handleWarning = this.handleWarning.bind(this);
		this.ready = false;
		if (typeof this.defineLifeCycle === 'function') {
			this.defineLifeCycle();
		}
		this.on(Connector.EVENTS.UPDATE, (/* configDiff */) => {
			if (this.config.disabled !== true) {
				this.logger.debug(`SelfReloading ${this.toString()}`);
				this._reload();
			}
		});
	}

	setLogger(newLogger) {
		this.logger = newLogger;
	}

	async _connect() {
		this._disconnecting = false;
		if(!this._connecting) {
			this._connecting = true;
			this.logger.debug(`Connecting ${this.toString()}`);
			return new Promise(async (resolve, reject) => {
				this.on('connect', () => {
					this.clearTimers();
					return resolve(this);
				});
				this.on('error', (e) => {
					this.handleError(e);
					reject(e);
				});
				if(!this._reconnectTimeoutId) {
					this._connectTimeoutId = setTimeout(async () => {
						this.handleError(new Error(ERRORS.TIMEOUT_ERROR));
						clearTimeout(this._connectTimeoutId);
						this._connectTimeoutId = null;
					}, this._connectTimeout);
				}
				try {
					await this.connect();
				} catch (e) {
					this.clearTimers();
					this.handleError(e);
					reject(e);
				}
			});
		}
		return false;
	}

	clearTimers() {
		clearTimeout(this._reconnectTimeoutId);
		this._reconnectTimeoutId = null;
		clearTimeout(this._connectTimeoutId);
		this._connectTimeoutId = null;
	}

	setupReconnect() {
		if(!this._disconnecting) {
			clearTimeout(this._reconnectTimeoutId);
			this._reconnectTimeoutId = null;
			const reconnect = () => {
				const nextTimeout = this._nextAttemptTimeOut();
				if(!this._connecting) {
					if(nextTimeout<0) {
						this.clearTimers();
						this.logger.info(`Max number of attempts (${this._attempt}) reached for ${this.toString()}`);

						return;
					}
					this.logger.info(`Next attempt (${this._attempt}) for ${this.toString()} in ${nextTimeout} ms`);
					if(!this.isConnected) {
						this._reconnect();
						this._reconnectTimeoutId = setTimeout(reconnect, nextTimeout);
					} else {
						this.clearTimers();
					}
				} else {
					this.logger.info(`Attempt ignored as still trying. Next attempt (${this._attempt}) for ${this.toString()} in ${nextTimeout} ms`);
					this._reconnectTimeoutId = setTimeout(reconnect, nextTimeout);
				}

			};
			if(!this._reconnectTimeoutId) {
				this._reconnectTimeoutId = setTimeout(reconnect.bind(this), this._nextAttemptTimeOut());
			}
		}

	}

	async _reconnect() {
		this._connected = false;
		this.ready = false;
		if (typeof this.reconnect === 'function' && !this._disconnecting) {
			return this.reconnect();
		}
		return this._reload(false);
	}

	async _reload(force=true) {
		this._connected = false;
		this.ready = false;
		if(this.isConnected) {
			await this._dispose(force);
		}
		this._connecting = false;
		return this._connect();
	}

	async update(configDiff, handlers = new Map()) {
		const { type, $set } = configDiff;
		const definition = this.config.connector.provider.definition;
		if (type === ConnectorConfiguration.name) {
			Object.keys($set).forEach((id) => {
				this.config.connector[id] = $set[id];
				const field = definition.connector.find((def) => def.id === id);
				if (field && field.onUpdate) {
					handlers.set(
						field.onUpdate,
						this[field.onUpdate].bind(this)
					);
				}
			});
		}
		if ($set && $set['connector.id'] !== undefined) {
			this.config.connector.id = $set['connector.id'];
			this.config.connector._id = $set['connector.id'];
		}
		if ($set.connector && $set.connector.id !== undefined) {
			this.config.connector.id = $set.connector.id;
			this.config.connector._id = $set.connector.id;
		}
		if ($set.disabled !== undefined) {
			this.config.disabled =
				$set.disabled === true ||
				$set.disabled === 'true' ||
				$set.disabled === 'on';
			if (this.config.disabled === true && this.isConnected) {
				this.stop();
			} else {
				this.start();
			}
		}
		if ($set.samplePayloads !== undefined) {
			this.config.samplePayloads = $set.samplePayloads;
		}
		if ($set.mimeType !== undefined) {
			this.config.mimeType = $set.mimeType;
		}
		if (handlers.size > 0) {
			Array.from(handlers.values()).map(async (handler) => {
				try {
					await handler();
				} catch (e) {
					this.handleError(
						`Error update() for handler ${handler}`,
						e
					);
				}
			});
		}
		this._emitter.emit(Connector.EVENTS.UPDATE, configDiff);
	}

	async validateMessage(message) {
		if(typeof message !== 'undefined') {
			return { error: undefined};
		}
		return {error: 'UNDEFINED'}
	}

	getConfigById(id, source = 'consumer', type = Field.TYPES.TEXT) {
		let value;
		if (source === 'consumer') {
			if (this.config && this.config) {
				value = this.config[id];
			}
		} else if (source === 'connector') {
			if (this.config && this.config.connector) {
				value = this.config.connector[id];
			}
		} else {
			throw Error('INVALID_CONFIG_SOURCE');
		}
		try {
			switch (type) {
				case Field.TYPES.INT:
					value = Utils.getAsInt(value);
					break;
				case Field.TYPES.POSINT:
					value = Utils.getAsInt(value);
					break;
				case Field.TYPES.SELECT_NUM:
					value = Utils.getAsNumber(value);
					break;
				default:
			}
		} catch (e) {
			this.logger.warn(e);
		}
		return value;
	}

	getConnectorConfigById(id, type = Field.TYPES.TEXT) {
		return this.getConfigById(id, 'connector', type);
	}

	onClose(reason) {
		this._connected = false;
		this._connecting = false;
		this.logger.debug(`stream ${this.toString()} initialize onClose()`);
		this._emitter.emit(Connector.EVENTS.CLOSE, this.id);
		if(reason) {
			this.handleError(reason);
			this._dispose();
		} else {
			this._emitter.emit(Connector.EVENTS.DISPOSED, {
				...this.config
			});
			this.setupReconnect();
		}
		// this.logger.info(`stream ${this.config.name} closes`);
	}

	handleError(error) {
		this.logger.debug(`stream ${this.toString()} initialize handleError()`);
		const code = error.code || IdGenerator.generate();
		this._errors.set(code, error);
		this.logger.error(
			`Stream ${this.toString()} error: ${error.message || error}`
		);
		this._emitter.emit(Connector.EVENTS.ERROR, error);
	}

	handleWarning(warning) {
		this.logger.debug(
			`Stream ${this.toString()} initialize handleWarning()`
		);
		this._warnings.push(warning);
		this.logger.warn(warning);
		this._emitter.emit(Connector.EVENTS.WARNING, warning);
	}

	sendUserFeedback(message, context) {
		const feedback = {
			message,
			context
		};
		this._emitter.emit(Connector.EVENTS.FEEDBACK, feedback);
	}

	persist(c) {
		this._emitter.emit(Connector.EVENTS.PERSIST, c || this.config);
	}

	handleErrorOnce(error) {
		if(!this._notifyErrorTimeout) {
			this._notifyErrorTimeout = setTimeout(() => {
				clearTimeout(this._notifyErrorTimeout);
				this._notifyErrorTimeout = null;
			}, this.config.notifyOnceDelay);
			this.handleError(error);
		}
	}

	handleWarningOnce(warning) {
		if(!this._notifyWarningTimeout) {
			this._notifyWarningTimeout = setTimeout(() => {
				clearTimeout(this._notifyWarningTimeout);
				this._notifyWarningTimeout = null;
			}, this.config.notifyOnceDelay);
			this.handleWarning(warning);
		}
	}

	async _test(config) {
		this._emitter.emit(Connector.EVENTS.TEST, config);
		try {
			return this.test(config);
		} catch (e) {
			return this.handleError(e);
		}
	}

	async test() {
		throw new Error('stream.test() must be implemented by subclass!');
	}

	async _dispose(force = false) {
		this._disconnecting = true;
		this._connecting = false;
		if(force === true) {
			this.clearTimers();
		}
		this._emitter.emit(Connector.EVENTS.DISPOSED, {
			...this.config,
			force
		});
		try {
			this._connected = false;
			return this.dispose();
		} catch (e) {
			return this.handleError(e);
		}
	}

	async dispose() {
		this.logger.warn(`dispose() not implemented for ${this.toString()}`);
	}

	toString() {
		return `${this.name}(${this.id})`;
	}

	get connected() {
		return this._connected;
	}

	get isConnected() {
		return this._connected;
	}

	get name() {
		return this.config.name;
	}

	setConnected() {
		this.clearTimers();
		this.logger.debug(`Stream ${this.toString()} setConnected() done`);
		this._connected = true;
		this._connecting = false;
		this._attempt = 0;
		this._emitter.emit(Connector.EVENTS.CONNECT, this);
	}

	stop() {
		return this._dispose(true);
	}

	start() {
		return this._connect();
	}

	_nextAttemptTimeOut() {
		const {random, minTimeout, factor, maxTimeout = 10000, retries, forever} = this._retryOpts;
		const random_ = typeof random === 'undefined' ? Math.random() : 1;
		this._attempt = this._attempt + 1;
		if(!forever && this._attempt > retries) {
			return -1;
		}
		return Math.min(random_ * minTimeout * factor ** this._attempt, maxTimeout);
	}
}

Connector.EVENTS = EVENTS.CONNECTOR;
Connector.TYPE = STREAM_TYPES;
Connector.ERRORS = ERRORS;

module.exports = Connector;
