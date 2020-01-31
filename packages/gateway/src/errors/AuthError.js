const ERROR_CODES = require('./ErrorCodes');

const notAllowed = (message) => ({ message, code: ERROR_CODES.NOT_ALLOWED, own: true });

module.exports = {
	notAllowed
};
