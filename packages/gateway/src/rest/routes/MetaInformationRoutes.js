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
const httpError = require('http-errors');

module.exports = class MetaInformationRoutes {
	static getMetaInformation(request, response, next) {
		const { gatewayService } = request.app.locals;
		switch (request.method) {
		case 'GET':
			// response.status(200).json(gatewayService.services);
			response.status(200).json(gatewayService.getMetaInfo());
			break;
		default:
			response.set('allow', 'GET');
			next(new httpError.MethodNotAllowed());
			break;
		}
	}
};
