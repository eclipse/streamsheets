const logger = require('@cedalo/logger').create({ name: 'Mongo' });

const unexpected = (error) => {
	logger.error('Unexpected Error', error);
	error.type = 'INTERNAL';
	return error;
};

const isInternal = (error) => error && error.type === 'INTERNAL';

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
