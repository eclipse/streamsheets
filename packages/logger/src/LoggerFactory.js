const Logger = require('./Logger');

module.exports = class LoggerFactory {
	static createLogger(name, level) {
		return new Logger({ name, level });
	}
};
