const logger = require('../../utils/logger').create({ name: 'Error' });

const { HttpErrors } = require('@cedalo/error-codes');

module.exports = class Error {
	static logger(error, request, response, next) {
		request.app.locals.logger(error.message);
		next(error);
	}
	/* eslint no-unused-vars: "warn" */
	static renderer(error, request, response /* , next */) {
		response.charset = 'utf-8';
		if (error.isSemantic) {
			logger.error(`Semantic error occured: ${error.code}`);
			error = HttpErrors.createFromInternal(error);
		}
		if (!response.statusCode || response.statusCode < 400) {
			if (error.status) {
				response.status(error.status);
			} else {
				response.status(500);
			}
		}
		response.json({ error: error.message });
	}
};
