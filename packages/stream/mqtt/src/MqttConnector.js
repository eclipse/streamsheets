const mqtt = require('mqtt');
const sdk = require('@cedalo/sdk-streams');
const Utils = require('./Utils');

module.exports = class MqttConnector extends sdk.Connector {
	constructor(consumerConfig) {
		super(consumerConfig);
		this._client = null;
	}

	get client() {
		return this._client;
	}

	hasUserProperties(userProperties) {
		return typeof userProperties === 'object' && Object.keys(userProperties).length > 0;
	}

	get clientId() {
		if(typeof this.config.clientId === 'string' && this.config.clientId.length<1) {
			return undefined;
		}
		return this.config.clientId;
	}

	async connect() {
		if(this.client && this.client.reconnecting) {
			return;
		}
		const url = Utils.getUrl(this.config.connector);
		const sslOptions = {
			rejectUnauthorized: false,
			cert: Utils.getBufferCert(this.config.connector.certPath),
			key: Utils.getBufferCert(this.config.connector.keyPath),
			ca: Utils.getBufferCert(this.config.connector.caCert)
		};
		const options = {
			protocolVersion: this.config.connector.protocolVersion || 5,
			properties: {
				maximumPacketSize: 2000
			},
			connectTimeout: 10 * 1000,
			keepalive: 10,
			reconnectPeriod: -1,
			clean: !!this.config.clean,
			clientId: this.clientId,
			username:
				this.config.connector.userName &&
				this.config.connector.userName.trim().length > 0
					? this.config.connector.userName
					: undefined,
			password:
				this.config.connector.password &&
				this.config.connector.password.trim().length > 0
					? this.config.connector.password
					: undefined,
			url,
			...sslOptions
		};
		if (
			this.hasUserProperties(this.config.connector.userPropertiesConnect)
		) {
			options.properties.userProperties = this.config.connector.userPropertiesConnect;
		}
		try {
			this._client = mqtt.connect(url, options);
			if(this._client && this._client.options.clientId!== this.config.clientId) {
				this.config.clientId = this._client.options.clientId;
				this.persist();
			}
			this.registerDefaultListeners();
		} catch (e) {
			this.handleError(e);
		}
	}

	registerDefaultListeners() {
		this._client.on('connect', () => this.setConnected());
		this._client.on('error', async (error) => {
			this.handleError(error);
			return this._dispose();
		});
		this._client.on('close', this.onClose);
		// this._client.on('offline', this.onClose);
		// this._client.on('disconnect', this.onClose);
		this.client.on('end', () => {
			this.logger(`${this.toString()} mqtt client ended`);
		});
	}

	async dispose() {
		return new Promise((res, rej) => {
			if (this.client) {
				try {
					this.client.end(true, (o) => res(o));
					this.client.removeAllListeners();
				} catch (e) {
					this.logger.error(e);
					rej(e);
				}
			} else {
				res(true);
			}
		});
	}
};
