'use strict';

const { logger } = require('@cedalo/logger');
const fs = require('fs');
const httpError = require('http-errors');
const path = require('path');
const WebpageHelper = require('../helper/WebpageHelper');

module.exports = class WebpageRoute {
	static handleMessage(request, response, next) {
		const targetPath = path.join(
			process.env.WEBPAGE_BASE || __dirname,
			request.path
		);
		const indexPath = path.join(targetPath, 'index.html');
		const content = request.body.html;
		const refresh = request.body.refresh;
		switch (request.method) {
			case 'POST':
				response.format({
					'application/json': () => {
						logger.info('Handling message');
						WebpageHelper.saveWebpage({
							content,
							targetPath,
							indexPath,
							refresh
						})
							.then(() => {
								logger.info('Webpage saved');
								response.status(200).json({
									response: 'Directory and file created',
									request: {
										content,
										refresh
									}
								});
							})
							.catch((error) => {
								next(error);
							});
					},
					default: () => {
						next(new httpError.NotAcceptable());
					}
				});
				break;
			case 'GET':
				if (fs.existsSync(targetPath)) {
					response.sendFile(targetPath);
				} else {
					response.send('');
				}
				break;
			case 'CONNECT':
			case 'DELETE':
			case 'HEAD':
			case 'OPTIONS':
			case 'PUT':
			case 'TRACE':
			default:
				response.set('allow', 'GET, POST');
				next(new httpError.MethodNotAllowed());
				break;
		}
	}
};
