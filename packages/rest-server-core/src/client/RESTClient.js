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
const request = require('request');

module.exports = class RESTClient {
	send(options, { baseUrl, user, pass } = {}) {
		options.baseUrl = baseUrl;
		if (options.json !== false) {
			options.json = true;
		}
		if (user && pass) {
			options.auth = {
				user,
				pass
			};
		}
		return new Promise((resolve, reject) => {
			request(options, (error, response, body) => {
				if (error) {
					reject(error);
				} else {
					resolve(body);
				}
			});
		});
	}
};
