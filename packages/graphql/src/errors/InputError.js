const ERROR_CODES = require('./ErrorCodes');

const conflict = (message, fieldErrors) => ({ message, code: ERROR_CODES.CONFLICT, fieldErrors, own: true });
const notFound = (message, code) => ({ message, code, own: true });
const invalid = (message, fieldErrors) => ({ message, code: ERROR_CODES.INVALID, fieldErrors, own: true });

module.exports = {
	conflict,
	notFound,
	invalid
};
