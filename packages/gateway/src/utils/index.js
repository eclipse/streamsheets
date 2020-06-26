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
const querystring = require('querystring');
const url = require('url');

const fns = {
	// getInitialWebsocketPayload: (request) => {
	// 	const actionType = request.get('X-DL_AT');
	// 	const additionalDlKeys = request.get('X-DL_ADDITIONAL_KEYS');
	// 	const additionalWebsocketPayload = {};
	// 	if (additionalDlKeys) {
	// 		additionalDlKeys.split(',').forEach((dlKey) => {
	// 			additionalWebsocketPayload[dlKey] = request.get(`X-DL_${dlKey}`);
	// 		});
	// 	}

	// 	const websocketPayload = {
	// 		type: actionType
	// 	};
	// 	websocketPayload.data = additionalWebsocketPayload;
	// 	return websocketPayload;
	// },
	getUserFromWebsocketRequest(request, tokenKey, tokenParser) {
		const reqUrl = request.url;
		const token = querystring.parse(url.parse(reqUrl).query)[tokenKey];
		return tokenParser(token);
	}
};

module.exports = fns;
