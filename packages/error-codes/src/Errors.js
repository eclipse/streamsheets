const { LoggerFactory } = require('@cedalo/logger');

const logger = LoggerFactory.createLogger(
	'error-codes',
	process.env.STREAMSHEETS_LOG_LEVEL
);
const CODES = require('./codes');

function createInternal(key, optionalMessage) {
	if (!CODES[key]) {
		logger.error('error CODES[key]:', key);
	}
	const errorObject = {
		isSemantic: true,
		code: CODES[key] || 'UNKNOWN'
	};

	if (optionalMessage) {
		errorObject.message = optionalMessage;
	}

	return errorObject;
}

module.exports = {
	createInternal
};
