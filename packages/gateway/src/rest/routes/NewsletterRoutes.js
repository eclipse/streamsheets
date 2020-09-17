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
const axios = require('axios');
const logger = require('../../utils/logger').create({ name: 'Newsletter' });

const URL = 'https://api.cedalo.cloud/rest/api/v1.0/newsletter/subscribe';

module.exports = class NewsletterRoutes {
	static subscribe(request, response, next) {
		switch (request.method) {
			case 'POST': {
				const user = request.body;
				axios
					.post(URL, user)
					.then(() => {
						response.status(200).json({
							newsletter: true
						});
					})
					.catch((error) => {
						logger.error('Error when trying to subscribe for newsletter.');
						logger.error(error);
					});
				break;
			}
			default:
				response.set('allow', 'GET', 'POST');
				next(new httpError.MethodNotAllowed());
				break;
		}
	}
};
