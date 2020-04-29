const logger = require('@cedalo/logger').create({ name: 'Internal' });

const unexpected = (error) => {
	logger.error('Unexpected Error', error);
	error.type = 'INTERNAL';
	return error;
};

const isInternal = (error) => (error && error.type === 'INTERNAL') || !error.code;

const catchUnexpected = (func) => async (...args) => {
	try {
		const result = await func(...args);
		return result;
	} catch (error) {
		if (error.own) {
			throw error;
		}
		throw unexpected(error);
	}
};

module.exports = {
	unexpected,
	isInternal,
	catchUnexpected
};
