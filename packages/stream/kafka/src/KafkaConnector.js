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
const { Connector } = require('@cedalo/sdk-streams');
const { Kafka, logLevel, CompressionTypes, CompressionCodecs } = require('kafkajs');
const SnappyCodec = require('kafkajs-snappy')
const Utils = require('./Utils');
const KSQLHelper = require('./KSQLHelper');

CompressionCodecs[CompressionTypes.Snappy] = SnappyCodec
module.exports = class KafkaConnector extends Connector {
	constructor(config) {
		super(config);
		this._client = null;
		this._sslOptions = {};
		this._saslOptions = {};
		// this._handler = null;
	}

	get ksqlRESTUrl() {
		let ksqlRESTUrl =
			this.config.connector.ksqlRESTUrl &&
			this.config.connector.ksqlRESTUrl.length > 0
				? this.config.connector.ksqlRESTUrl
				: process.env.KSQL_REST_URL;
		ksqlRESTUrl =
			ksqlRESTUrl && ksqlRESTUrl.length > 0
				? ksqlRESTUrl
				: '';
		return ksqlRESTUrl;
	}

	async connect() {
		try {
			this._sslOptions = undefined;
			const getBufferCert = (val) => {
				if (!val) return '';
				return Buffer.from(Utils.decodeCert(val));
			};
			if (
				this.config.connector.auth &&
				this.config.connector.auth.includes('ssl')
			) {
				this._sslOptions = {
					servername: 'localhost',
					cert: getBufferCert(this.config.connector.certPath),
					key: getBufferCert(this.config.connector.keyPath),
					ca: getBufferCert(this.config.connector.caCert),
					passphrase: this.config.connector.passphrase,
					rejectUnauthorized: false
				};
				this.logger.debug(
					`sslOptions for ${this.toString()}: ${JSON.stringify(
						this._sslOptions
					)}`
				);
			}
			this._saslOptions = undefined;
			if (
				this.config.connector.auth &&
				this.config.connector.auth.includes('sasl')
			) {
				this._saslOptions = {
					mechanism: this.config.connector.authMechanism, // plain,scram-sha-256 or scram-sha-512
					username: this.config.connector.userName,
					password: this.config.connector.password
				};
				this.logger.debug(
					`saslOptions for ${this.toString()}: ${JSON.stringify(
						this._saslOptions
					)}`
				);
			}
			return this.connectKafka();
		} catch (e) {
			return this.handleError(e);
		}
	}

	async connectKafka() {
		try {
			this.logger.debug('Connecting with kafka only with config:');
			// this.logger.debug(JSON.stringify(this.config));
			const connectionString =
				this.config.connector.connectionString || 'localhost:9092';
			const config = {
				clientId: this.config.clientId,
				brokers: connectionString.split(','),
				retry: { // disable
					retries: 1
				},
				logCreator: () => ({ namespace, level, log }) => {
					const prefix = namespace ? `[${namespace}] ` : '';
					switch (level) {
						case logLevel.INFO:
							return this.logger.info(`Stream ${this.toString()}: ${prefix}${log.message}`);
						case logLevel.ERROR:
							return this.logger.error(`Stream ${this.toString()}: ${prefix}${log.message}`);
						case logLevel.WARN:
							return this.logger.warn(`Stream ${this.toString()}: ${prefix}${log.message}`);
						case logLevel.DEBUG:
							return this.logger.debug(`Stream ${this.toString()}: ${prefix}${log.message}`);
						default:
							return this.logger.info(`Stream ${this.toString()}: ${prefix}${log.message}`);
					}
				},
				ssl: this._sslOptions,
				sasl: this._saslOptions
			};
			this._client = new Kafka(config);
		} catch (e) {
			this.logger.error(`Kafka Client Error: ${e}`);
			this.logger.error(e);
			this.onClose();
			this.handleError(e);
		}
	}

	async connectZoo() {
		// TODO
	}

	ksqlQuery(query, cb) {
		return KSQLHelper.query(this.ksqlRESTUrl, query, cb, this.logger);
	}

	async ksqlCommandRun() {
		return new Promise((res, rej) => {
			const { ksqlCommand } = this.config.connector;
			const cb = (error, msg) => {
				if (!error) {
					return res(msg);
				}
				this.handleError(error);
				return rej(error);
			};
			return KSQLHelper.command(
				this.ksqlRESTUrl,
				ksqlCommand,
				cb,
				this.logger
			);
		});
	}

	async dispose() {
		// await this._handler.dispose();
		this._connected = false;
	}
};
