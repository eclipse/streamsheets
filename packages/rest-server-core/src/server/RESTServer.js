const http = require('http');
const https = require('https');
const DefaultApp = require('../DefaultApp');
const { LoggerFactory } = require('@cedalo/logger');

const logger = LoggerFactory.createLogger(
	'rest-server-core',
	process.env.STREAMSHEETS_LOG_LEVEL
);

const pkg = require('../../package.json');
const DEFAULT_CONFIG = require('../../config/start.json');

module.exports = class RESTServer {
	constructor(config = {}) {
		const configuration = this._initializeConfiguration(config);
		if (configuration.http.secure) {
			https.globalAgent.maxSockets = 16384;
			https.globalAgent.options.agent = false;
		} else {
			http.globalAgent.maxSockets = 16384;
			http.globalAgent.options.agent = false;
		}
		this._application = new DefaultApp(pkg, configuration);
		this._isStarted = false;
	}

	_initializeConfiguration(config) {
		let configuration = Object.assign({}, DEFAULT_CONFIG, config);
		configuration.http.port = process.env.RESTSERVER_PORT || configuration.http.port;
		configuration = this._postConfig(configuration);
		return configuration;
	}

	async start() {
		if (this._isStarted) {
			logger.info('REST server already started');
			return true;
		}
		logger.info('Starting REST server');
		this._isStarted = true;
		await this._application.start();
		return true;
	}

	stop() {
		if (!this._isStarted) {
			logger.info('REST server already stopped');
			return Promise.resolve();
		}
		logger.info('Stopping REST server');
		return this._application.stop()
			.then(() => {
				this._isStarted = false;
			});
	}

	/**
	 * Override in subclasses in order to change server configuration.
	 */
	_postConfig(config) {
		return config;
	}

	get application() {
		return this._application;
	}
};
