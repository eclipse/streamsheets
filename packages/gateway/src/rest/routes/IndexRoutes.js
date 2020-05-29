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
