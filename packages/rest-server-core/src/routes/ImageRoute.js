/********************************************************************************
 * Copyright (c) 2020 Cedalo AG
 *
 * This program and the accompanying materials are made available under the 
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 ********************************************************************************/
'use strict';

const { logger } = require('@cedalo/logger');
const fs = require('fs');
const httpError = require('http-errors');
const path = require('path');
const ImageHelper = require('../helper/ImageHelper');

module.exports = class ImageRoute {
	static handleMessage(request, response, next) {
		const targetPath = path.join(
			process.env.IMAGE_BASE ||
				path.join(__dirname, '..', '..', 'images'),
			request.path
		);
		switch (request.method) {
			case 'POST': {
				const imagePath = path.join(targetPath, request.body.name);
				const content = request.body.content;
				response.format({
					'application/json': () => {
						logger.info('Handling message');
						ImageHelper.saveImage({
							content,
							targetPath,
							imagePath
						})
							.then(() => {
								logger.info('Image saved');
								const location = `/images${request.path}/${
									request.body.name
								}`;
								response.location(location);
								response.status(200).json({
									message: 'Image created',
									location
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
			}
			case 'GET': {
				if (fs.existsSync(targetPath)) {
					response.sendFile(targetPath);
				} else {
					response.send('');
				}
				break;
			}
			case 'CONNECT':
			case 'DELETE':
			case 'HEAD':
			case 'OPTIONS':
			case 'PUT':
			case 'TRACE':
			default: {
				response.set('allow', 'GET, POST');
				next(new httpError.MethodNotAllowed());
				break;
			}
		}
	}
};
