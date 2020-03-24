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
