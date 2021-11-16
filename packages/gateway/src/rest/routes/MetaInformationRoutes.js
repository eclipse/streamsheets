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
	static async getMetaInformation(request, response, next) {
		const { app, headers } = request;
		const { gatewayService } = app.locals;
		switch (request.method) {
		case 'GET': {
			// response.status(200).json(gatewayService.services);
			const metaInfo = await gatewayService.getMetaInfo({ id: headers.scope });
			response.status(200).json(metaInfo);
			break;
		}
		default:
			response.set('allow', 'GET');
			next(new httpError.MethodNotAllowed());
			break;
		}
	}
};
