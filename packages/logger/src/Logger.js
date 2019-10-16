const BunyanLoggerAdapter = require('./adapter/BunyanLoggerAdapter');

const LOG_LEVEL = process.env.STREAMSHEETS_LOG_LEVEL || 'warn';

module.exports = class Logger {
	constructor({ name = 'Default Logger', level = LOG_LEVEL } = {}) {
		this._loggerAdapter = new BunyanLoggerAdapter({ name, level });
	}

	info(message, ...optionals) {
		this._loggerAdapter.info(message, ...optionals);
	}

	error(message, ...optionals) {
		this._loggerAdapter.error(message, ...optionals);
	}

	warn(message, ...optionals) {
		this._loggerAdapter.warn(message, ...optionals);
	}

	debug(message, ...optionals) {
		this._loggerAdapter.debug(message, ...optionals);
	}

	trace(message, ...optionals) {
		this._loggerAdapter.trace(message, ...optionals);
	}

	fatal(message, ...optionals) {
		this._loggerAdapter.fatal(message, ...optionals);
	}

	set loggerAdapter(loggerAdapter) {
		this._loggerAdapter = loggerAdapter;
	}

};
