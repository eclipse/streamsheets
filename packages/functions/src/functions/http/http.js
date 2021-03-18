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
const { convert } = require('@cedalo/commons');
const { FunctionErrors: { code: ERROR } } = require('@cedalo/error-codes');
const { getInstance } = require('@cedalo/http-client');
const {
	AsyncRequest,
	httprequest: { createRequestCallback },
	runFunction,
	terms: { hasValue }
} = require('../../utils');

const request = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.onSheetCalculation()
		.withMinArgs(2)
		.withMaxArgs(6)
		.mapNextArg((url) => convert.toString(url.value, ERROR.VALUE))
		.mapNextArg((method) => convert.toString(method.value, ERROR.VALUE))
		.mapNextArg((body) => (hasValue(body) ? body.value : ''))
		.mapNextArg((headers) => (hasValue(headers) ? headers.value : {}))
		.mapNextArg((config) => (hasValue(config) ? config.value : {}))
		.mapNextArg((target) => target)
		.run((url, method, body, headers, config, target) => {
			config.url = url;
			config.method = method;
			return AsyncRequest.create(sheet, request.context)
				.request(() => getInstance().request(body, headers, config))
				.response(createRequestCallback(sheet, target))
				.reqId();
		});
request.displayName = true;

const get = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.onSheetCalculation()
		.withMinArgs(1)
		.withMaxArgs(4)
		.mapNextArg((url) => convert.toString(url.value, ERROR.VALUE))
		.mapNextArg((headers) => (hasValue(headers) ? headers.value : {}))
		.mapNextArg((config) => (hasValue(config) ? config.value : {}))
		.mapNextArg((target) => target)
		.run((url, headers, config, target) =>
			AsyncRequest.create(sheet, get.context)
				.request(() => getInstance().get(url, headers, config))
				.response(createRequestCallback(sheet, target))
				.reqId()
		);
get.displayName = true;

const head = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.onSheetCalculation()
		.withMinArgs(1)
		.withMaxArgs(4)
		.mapNextArg((url) => convert.toString(url.value, ERROR.VALUE))
		.mapNextArg((headers) => (hasValue(headers) ? headers.value : {}))
		.mapNextArg((config) => (hasValue(config) ? config.value : {}))
		.mapNextArg((target) => target)
		.run((url, headers, config, target) =>
			AsyncRequest.create(sheet, head.context)
				.request(() => getInstance().head(url, headers, config))
				.response(createRequestCallback(sheet, target))
				.reqId()
		);
head.displayName = true;

const post = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.onSheetCalculation()
		.withMinArgs(1)
		.withMaxArgs(5)
		.mapNextArg((url) => convert.toString(url.value, ERROR.VALUE))
		.mapNextArg((body) => (hasValue(body) ? body.value : ''))
		.mapNextArg((headers) => (hasValue(headers) ? headers.value : {}))
		.mapNextArg((config) => (hasValue(config) ? config.value : {}))
		.mapNextArg((target) => target)
		.run((url, body, headers, config, target) =>
			AsyncRequest.create(sheet, post.context)
				.request(() => getInstance().post(url, body, headers, config))
				.response(createRequestCallback(sheet, target))
				.reqId()
		);
post.displayName = true;

const put = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.onSheetCalculation()
		.withMinArgs(1)
		.withMaxArgs(5)
		.mapNextArg((url) => convert.toString(url.value, ERROR.VALUE))
		.mapNextArg((body) => (hasValue(body) ? body.value : ''))
		.mapNextArg((headers) => (hasValue(headers) ? headers.value : {}))
		.mapNextArg((config) => (hasValue(config) ? config.value : {}))
		.mapNextArg((target) => target)
		.run((url, body, headers, config, target) =>
			AsyncRequest.create(sheet, put.context)
				.request(() => getInstance().put(url, body, headers, config))
				.response(createRequestCallback(sheet, target))
				.reqId()
		);
put.displayName = true;

const patch = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.onSheetCalculation()
		.withMinArgs(1)
		.withMaxArgs(5)
		.mapNextArg((url) => convert.toString(url.value, ERROR.VALUE))
		.mapNextArg((body) => (hasValue(body) ? body.value : ''))
		.mapNextArg((headers) => (hasValue(headers) ? headers.value : {}))
		.mapNextArg((config) => (hasValue(config) ? config.value : {}))
		.mapNextArg((target) => target)
		.run((url, body, headers, config, target) =>
			AsyncRequest.create(sheet, patch.context)
				.request(() => getInstance().patch(url, body, headers, config))
				.response(createRequestCallback(sheet, target))
				.reqId()
		);
patch.displayName = true;

const deleteFunction = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.onSheetCalculation()
		.withMinArgs(1)
		.withMaxArgs(4)
		.mapNextArg((url) => convert.toString(url.value, ERROR.VALUE))
		.mapNextArg((headers) => (hasValue(headers) ? headers.value : {}))
		.mapNextArg((config) => (hasValue(config) ? config.value : {}))
		.mapNextArg((target) => target)
		.run((url, headers, config, target) =>
			AsyncRequest.create(sheet, deleteFunction.context)
				.request(() => getInstance().delete(url, headers, config))
				.response(createRequestCallback(sheet, target))
				.reqId()
		);
deleteFunction.displayName = true;

const trace = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.onSheetCalculation()
		.withMinArgs(1)
		.withMaxArgs(4)
		.mapNextArg((url) => convert.toString(url.value, ERROR.VALUE))
		.mapNextArg((headers) => (hasValue(headers) ? headers.value : {}))
		.mapNextArg((config) => (hasValue(config) ? config.value : {}))
		.mapNextArg((target) => target)
		.run((url, headers, config, target) => {
			config.url = url;
			config.method = 'TRACE';
			config.headers = headers;
			return AsyncRequest.create(sheet, request.context)
				.request(() => getInstance().request(config))
				.response(createRequestCallback(sheet, target))
				.reqId();
		});
trace.displayName = true;

const options = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.onSheetCalculation()
		.withMinArgs(1)
		.withMaxArgs(4)
		.mapNextArg((url) => convert.toString(url.value, ERROR.VALUE))
		.mapNextArg((headers) => (hasValue(headers) ? headers.value : {}))
		.mapNextArg((config) => (hasValue(config) ? config.value : {}))
		.mapNextArg((target) => target)
		.run((url, headers, config, target) =>
			AsyncRequest.create(sheet, options.context)
				.request(() => getInstance().options(url, headers, config))
				.response(createRequestCallback(sheet, target))
				.reqId()
		);
options.displayName = true;

module.exports = {
	'HTTP.REQUEST2': request,
	'HTTP.GET': get,
	'HTTP.POST': post,
	'HTTP.PUT': put,
	'HTTP.PATCH': patch,
	'HTTP.DELETE': deleteFunction,
	'HTTP.TRACE': trace,
	'HTTP.HEAD': head,
	'HTTP.OPTIONS': options
};
