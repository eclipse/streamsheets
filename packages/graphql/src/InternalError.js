const logger = require('@cedalo/logger').create({ name: 'Mongo' });

const unexpected = (error) => {
	logger.error('Unexpected Error', error);
	error.type = 'INTERNAL';
	return error;
};

const isInternal = (error) => error && error.type === 'INTERNAL';

module.exports = {
	unexpected,
	isInternal
};
