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
const logger = require('../../utils/logger').create({ name: 'Error' });

const { HttpErrors } = require('@cedalo/error-codes');

module.exports = class Error {
	static logger(error, request, response, next) {
		request.app.locals.logger(error.message);
		next(error);
	}
	/* eslint-disable-next-line */
	static renderer(error, request, response , next) {
		response.charset = 'utf-8';
		if (error.isSemantic) {
			logger.error(`Semantic error occured: ${error.code}`);
			error = HttpErrors.createFromInternal(error);
		}
		if (!response.statusCode || response.statusCode < 400) {
			if (error.status) {
				response.status(error.status);
			} else {
				response.status(500);
			}
		}
		response.json({ error: error.message });
	}
};
