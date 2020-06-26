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

const http = require('http');

module.exports = class ErrorRoute {
	/* eslint no-unused-vars: "warn" */
	static _404(request, response /* , next */) {
		response.charset = 'utf-8';
		response.status(404);
		response.format({
			'application/json': () => { response.json({ error: http.STATUS_CODES[404] }); },
			default: () => { response.type('text/plain').send(http.STATUS_CODES[404]); }
		});
	}
};
