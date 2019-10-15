'use strict';

const httpError = require('http-errors');

module.exports = class IndexRoute {
	static index(request, response, next) {
		switch (request.method) {
		case 'GET':
			response.format({
				'application/json': () => {
					response.status(200).json({
						message: 'StreamSheets Repository API index page'
					});
				},
				default: () => { next(new httpError.NotAcceptable()); }
			});
			break;
		case 'HEAD':
			response.format({
				'application/json': () => {
					response.status(200).end();
				},
				default: () => { next(new httpError.NotAcceptable()); }
			});
			break;
		case 'POST':
		case 'CONNECT':
		case 'DELETE':
		case 'OPTIONS':
		case 'PUT':
		case 'TRACE':
		default:
			response.set('allow', 'GET, HEAD');
			next(new httpError.MethodNotAllowed());
			break;
		}
	}
};
