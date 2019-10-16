const error = method => new Error(`Method ${method}() must be implemented by subclass.`);

module.exports = class LoggerAdapter {

	info(/* message, ...optionals */) {
		throw error('info');
	}

	error(/* message, ...optionals */) {
		throw error('error');
	}

	warn(/* message, ...optionals */) {
		throw error('warn');
	}

	debug(/* message, ...optionals */) {
		throw error('debug');
	}

	trace(/* message, ...optionals */) {
		throw error('trace');
	}

	fatal(/* message, ...optionals */) {
		throw error('fatal');
	}

};
