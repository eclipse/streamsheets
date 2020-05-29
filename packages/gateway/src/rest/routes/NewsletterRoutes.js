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
const FormData = require('form-data');
const logger = require('../../utils/logger').create({ name: 'Newsletter' });

// this URL is fixed and intentionally cannot be changed using environment variables
const URL = 'https://cedalo.us19.list-manage.com/subscribe/post';

module.exports = class NewsletterRoutes {
	static subscribe(request, response, next) {
		switch (request.method) {
			case 'POST': {
				const user = request.body;
				const formData = new FormData();
				formData.append('u', '4cb1e6d733caee48574fbc0b8');
				formData.append('id', '57d2a14720');
				formData.append('MERGE0', user.email);
				formData.append('MERGE1', user.firstName);
				formData.append('MERGE2', user.lastName);
				axios
					.create({
						headers: formData.getHeaders()
					})
					.post(URL, formData)
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
