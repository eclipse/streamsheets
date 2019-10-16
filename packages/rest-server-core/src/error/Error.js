const http = require('http');

module.exports = class Error {
	static logger(error, request, response, next) {
		request.app.locals.logger(error.message);
		next(error);
	}

	// eslint-disable-next-line
	static renderer(error, request, response, next) {
		response.charset = 'utf-8';
		if (!response.statusCode || response.statusCode < 400) {
			if (error.status) {
				response.status(error.status);
			} else {
				response.status(500);
			}
		}
		response.format({
			'text/plain': () => {
				response.type('text/plain').send(error.message);
			},
			'text/html': () => {
				response.render('_error', {
					menu_name: '',
					header: `HTTP error status code: ${response.statusCode}`,
					uri: request.originalUrl,
					status: `${response.statusCode} (${http.STATUS_CODES[response.statusCode]})`,
					message: error.message
				});
			},
			'application/xhtml+xml': () => {
				response.render('_error', {
					menu_name: '',
					header: `HTTP error status code: ${response.statusCode}`,
					uri: request.originalUrl,
					status: `${response.statusCode} (${http.STATUS_CODES[response.statusCode]})`,
					message: error.message
				});
			},
			'application/json': () => {
				response.json({ error: error.message });
			},
			default: () => {
				response.type('text/plain').send(error.message);
			}
		});
	}
};
