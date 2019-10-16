const bunyan = require('bunyan');
const LoggerAdapter = require('./LoggerAdapter');

module.exports = class BunyanLoggerAdapter extends LoggerAdapter {
	constructor({ name = 'Bunyan Logger Adapter', level = 'debug' } = {}) {
		super();
		this._logger = bunyan.createLogger({
			name,
			level
		});
	}

	info(message, ...optionals) {
		this._logger.info(message, ...optionals);
	}

	error(message, ...optionals) {
		this._logger.error(message, ...optionals);
	}

	warn(message, ...optionals) {
		this._logger.warn(message, ...optionals);
	}

	debug(message, ...optionals) {
		this._logger.debug(message, ...optionals);
	}

	trace(message, ...optionals) {
		this._logger.trace(message, ...optionals);
	}

	fatal(message, ...optionals) {
		this._logger.fatal(message, ...optionals);
	}

	get logger() {
		return this._logger;
	}

};
