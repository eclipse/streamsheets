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
const { ERRORS, EVENTS, STREAM_TYPES } = require('./Constants');
const Stream = require('./Stream');
const ConnectorConfiguration = require('./configurations/ConnectorConfiguration');
const Field = require('./configurations/Field');
const Utils = require('./helpers/Utils');

const STREAMSHEETS_STREAM_SUCCESS_THRESHOLD_TIME =
	parseInt(process.env.STREAMSHEETS_STREAM_SUCCESS_THRESHOLD_TIME, 10) || 5000;

const DEF_CONF = {
	type: STREAM_TYPES.CONNECTOR,
	notifyOnceDelay: 10000
};

const DEF_RETRY_OPTS = {
	forever: true,
	factor: 2,
	minTimeout: 1 * 1000,
	maxTimeout: 300 * 1000
};

class Connector extends Stream {
	constructor(cfg = {}) {
		cfg = Object.assign({}, DEF_CONF, cfg);
		super(cfg);
		this._retryOpts = {
			forever: process.env.STREAMSHEETS_STREAM_RETRY_FOREVER || DEF_RETRY_OPTS.forever,
			factor: process.env.STREAMSHEETS_STREAM_RETRY_FACTOR || DEF_RETRY_OPTS.factor,
			minTimeout: process.env.STREAMSHEETS_STREAM_RETRY_MIN_TIMEOUT || DEF_RETRY_OPTS.minTimeout,
			maxTimeout: process.env.STREAMSHEETS_STREAM_RETRY_MAX_TIMEOUT || DEF_RETRY_OPTS.maxTimeout
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
				this.logger.info(`Stream ${this.toString()}: Reloading after update`);
				this._reload();
			}
		});
	}

	setLogger(newLogger) {
		this.logger = newLogger;
	}

	async _connect() {
		this._disconnecting = false;
		if (!this._connecting) {
			this._connecting = true;
			this.logger.info(`Stream ${this.toString()}: Connecting... `);
			return new Promise(async (resolve, reject) => {
				this.on('connect', () => {
					this.clearTimers();
					return resolve(this);
				});
				this.on('error', (e) => {
					this.handleError(e);
					reject(e);
				});
				if (!this._reconnectTimeoutId) {
					this._connectTimeoutId = setTimeout(async () => {
						if(!this._connected){
							this.handleError(new Error(ERRORS.TIMEOUT_ERROR));
						}
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
		if (!this._disconnecting) {
			clearTimeout(this._reconnectTimeoutId);
			this._reconnectTimeoutId = null;
			const nextTimeout = this._nextAttemptTimeOut();
			const reconnect = () => {
				if(!this.isConnected){
					if (this._connecting) {
						this.logger.debug(
							`Stream ${this.toString()}: Ignoring reconnect, still trying to reconnect...`
						);
						return;
					}
					this._reconnect();
				} else {
					this.clearTimers();
				}
			};
			if (nextTimeout < 0) {
				this.clearTimers();
				this.logger.info(`Stream ${this.toString()}: Max number of reconnect attempts reached`);
				return;
			}
			this.logger.info(
				`Stream ${this.toString()}: Next attempt (${this._attempt}) in ${Math.ceil(
					nextTimeout / 1000
				)}s`
			);
			this._reconnectTimeoutId = setTimeout(reconnect, nextTimeout);
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

	async _reload(force = false) {
		this.ready = false;
		if (this.isConnected) {
			this._connected = false;
			await this._dispose(force);
		}
		this._connecting = false;
		return this._connect();
	}

	async update(configDiff) {
		const { type, $set } = configDiff;
		if (type === ConnectorConfiguration.name) {
			Object.keys($set).forEach((id) => {
				this.config.connector[id] = $set[id];
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
			this.config.disabled = $set.disabled === true || $set.disabled === 'true' || $set.disabled === 'on';
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
		this._emitter.emit(Connector.EVENTS.UPDATE, configDiff);
	}

	async validateMessage(message) {
		if (typeof message !== 'undefined') {
			return { error: undefined };
		}
		return { error: 'UNDEFINED' };
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
		this.logger.info(`Stream ${this.toString()}: Connection closed`);
		// this._emitter.emit(Connector.EVENTS.CLOSE, this.id);
		if (reason) {
			this.handleError(reason);
			this._dispose();
		} else {
			this._emitter.emit(Connector.EVENTS.DISPOSED, {
				...this.config
			});
			clearTimeout(this._connectTimeoutId);
			clearTimeout(this._successThresholdTimerId);
			this.setupReconnect();
		}
		// this.logger.info(`stream ${this.config.name} closes`);
	}

	handleError(error) {
		this.logger.error(`Stream ${this.toString()}: ${error.message || error}`);
		this._emitter.emit(Connector.EVENTS.ERROR, error);
	}

	handleWarning(warning) {
		this.logger.warn(`Stream ${this.toString()}: ${warning}`);
		this._emitter.emit(Connector.EVENTS.WARNING, warning);
	}

	persist(c) {
		this._emitter.emit(Connector.EVENTS.PERSIST, c || this.config);
	}

	handleErrorOnce(error) {
		if (!this._notifyErrorTimeout) {
			this._notifyErrorTimeout = setTimeout(() => {
				clearTimeout(this._notifyErrorTimeout);
				this._notifyErrorTimeout = null;
			}, this.config.notifyOnceDelay);
			this.handleError(error);
		}
	}

	handleWarningOnce(warning) {
		if (!this._notifyWarningTimeout) {
			this._notifyWarningTimeout = setTimeout(() => {
				clearTimeout(this._notifyWarningTimeout);
				this._notifyWarningTimeout = null;
			}, this.config.notifyOnceDelay);
			this.handleWarning(warning);
		}
	}

	async _dispose(force = false) {
		this.logger.info(`Stream ${this.toString()}: Disposing...`);
		this._disconnecting = true;
		this._connecting = false;
		if (force === true) {
			this.clearTimers();
		}
		this._emitter.emit(Connector.EVENTS.DISPOSED, {
			...this.config,
			force
		});
		try {
			this._connected = false;
			const res = await this.dispose();
			this.logger.info(`Stream ${this.toString()}: Disposed succesfully`);
			return res;
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
		this.logger.info(`Stream ${this.toString()}: Connected successfully`);
		this._connected = true;
		this._connecting = false;
		// If we get disconnected immediatly we don't want to reset our attempts
		this._successThresholdTimerId = setTimeout(() => {
			this._attempt = 0;
		}, STREAMSHEETS_STREAM_SUCCESS_THRESHOLD_TIME);

		this._emitter.emit(Connector.EVENTS.CONNECT, this);
	}

	stop() {
		return this._dispose(true);
	}

	start() {
		return this._connect();
	}

	_nextAttemptTimeOut() {
		const { minTimeout, factor, maxTimeout = 10000, retries, forever } = this._retryOpts;
		this._attempt += 1;
		if (!forever && this._attempt > retries) {
			return -1;
		}
		const timeout = Math.min(minTimeout * factor ** this._attempt, maxTimeout);
		return timeout + (Math.random() * timeout) / 10;
	}
}

Connector.EVENTS = EVENTS.CONNECTOR;
Connector.TYPE = STREAM_TYPES;
Connector.ERRORS = ERRORS;

module.exports = Connector;
