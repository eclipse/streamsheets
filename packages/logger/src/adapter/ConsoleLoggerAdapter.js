const BaseLoggerAdapter = require('./BaseLoggerAdapter');

module.exports = class ConsoleLoggerAdapter extends BaseLoggerAdapter {

	get logger() {
		return console;
	}

	debug(message, ...optionals) {
		this.info(message, ...optionals);
	}

	fatal(message, ...optionals) {
		this.error(message, ...optionals);
	}

};
