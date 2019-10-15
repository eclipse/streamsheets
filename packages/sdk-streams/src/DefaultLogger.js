/* eslint-disable no-console */

class ConsoleLogger {
	info(message, ...optionals) {
		console.info(message, ...optionals);
	}

	error(message, ...optionals) {
		console.error(message, ...optionals);
	}

	warn(message, ...optionals) {
		console.warn(message, ...optionals);
	}

	debug(message, ...optionals) {
		console.info(message, ...optionals);
	}

	trace(message, ...optionals) {
		console.trace(message, ...optionals);
	}

	fatal(message, ...optionals) {
		console.info(message, ...optionals);
	}
}
module.exports = ConsoleLogger;
