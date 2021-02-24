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
const { AsyncRequest, runFunction, terms: { hasValue } } = require('../../utils');
const { addResultToTarget } = require('./utils');

const DATA = ['data'];
const ERRORDATA = ['code', 'message'];
const METADATA = ['headers', 'status', 'statusText'];
const REQUESTDATA = ['data', 'headers', 'method', 'url'];

const addValue = (fromObj) => (toObj, key) => {
	toObj[key] = fromObj[key];
	return toObj;
};
const extract = (keys, fromObj) => keys.reduce(addValue(fromObj), {});

const defaultCallback = (context, response, error) => {
	const term = context.term;
	if (term && !term.isDisposed) term.cellValue = error ? ERROR.RESPONSE : undefined;
	return error ? AsyncRequest.STATE.REJECTED : undefined;
};

const createResult = (obj, dataFields, requestId) => {
	const data = extract(dataFields, obj);
	const metadata = extract(METADATA, obj);
	if (obj.config) metadata.request = { requestId, ...extract(REQUESTDATA, obj.config) };
	return { data, metadata };
};
const createRequestCallback = (sheet, target) => (context, response, error) => {
	const term = context.term;
	const reqId = context._reqId;
	const resobj = error ? createResult(error, ERRORDATA, reqId) : createResult(response, DATA, reqId);
	resobj.metadata.label = error ? `Error: ${context.term.name}` : context.term.name;
	if (target) addResultToTarget(sheet, target, resobj);
	if (term && !term.isDisposed) {
		term.cellValue = error ? ERROR.RESPONSE : undefined;
	}
	return error ? AsyncRequest.STATE.REJECTED : undefined;
};

const request = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.onSheetCalculation()
		.withMinArgs(2)
		.withMaxArgs(4)
		.mapNextArg((url) => convert.toString(url.value, ERROR.VALUE))
		.mapNextArg((method) => convert.toString(method.value, ERROR.VALUE))
		.mapNextArg((config) => (hasValue(config) ? config.value : {}))
		.mapNextArg((target) => target)
		.run((url, method, config, target) => {
			config.url = url;
			config.method = method;
			return AsyncRequest.create(sheet, request.context)
				.request(() => getInstance().request(config))
				.response(createRequestCallback(sheet, target))
				.reqId();
		});
request.displayName = true;

const get = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.onSheetCalculation()
		.withMinArgs(1)
		.withMaxArgs(3)
		.mapNextArg((url) => convert.toString(url.value, ERROR.VALUE))
		.mapNextArg((config) => (hasValue(config) ? config.value : {}))
		.mapNextArg((target) => target)
		.run((url, config, target) =>
			AsyncRequest.create(sheet, get.context)
				.request(() => getInstance().get(url, config))
				.response(createRequestCallback(sheet, target))
				.reqId()
		);
get.displayName = true;

const head = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.onSheetCalculation()
		.withMinArgs(1)
		.withMaxArgs(3)
		.mapNextArg((url) => convert.toString(url.value, ERROR.VALUE))
		.mapNextArg((config) => (hasValue(config) ? config.value : {}))
		.mapNextArg((target) => target)
		.run((url, config, target) =>
			AsyncRequest.create(sheet, head.context)
				.request(() => getInstance().head(url, config))
				.response(createRequestCallback(sheet, target))
				.reqId()
		);
head.displayName = true;

const post = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.onSheetCalculation()
		.withMinArgs(1)
		.withMaxArgs(4)
		.mapNextArg((url) => convert.toString(url.value, ERROR.VALUE))
		.mapNextArg((data) => (hasValue(data) ? data.value : ''))
		.mapNextArg((config) => (hasValue(config) ? config.value : {}))
		.mapNextArg((target) => target)
		.run((url, data, config, target) =>
			AsyncRequest.create(sheet, post.context)
				.request(() => getInstance().post(url, data, config))
				.response(createRequestCallback(sheet, target))
				.reqId()
		);
post.displayName = true;

const put = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.onSheetCalculation()
		.withMinArgs(1)
		.withMaxArgs(4)
		.mapNextArg((url) => convert.toString(url.value, ERROR.VALUE))
		.mapNextArg((data) => (hasValue(data) ? data.value : ''))
		.mapNextArg((config) => (hasValue(config) ? config.value : {}))
		.mapNextArg((target) => target)
		.run((url, data, config, target) =>
			AsyncRequest.create(sheet, put.context)
				.request(() => getInstance().put(url, data, config))
				.response(createRequestCallback(sheet, target))
				.reqId()
		);
put.displayName = true;

const patch = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.onSheetCalculation()
		.withMinArgs(1)
		.withMaxArgs(4)
		.mapNextArg((url) => convert.toString(url.value, ERROR.VALUE))
		.mapNextArg((data) => (hasValue(data) ? data.value : ''))
		.mapNextArg((config) => (hasValue(config) ? config.value : {}))
		.mapNextArg((target) => target)
		.run((url, data, config, target) =>
			AsyncRequest.create(sheet, patch.context)
				.request(() => getInstance().patch(url, data, config))
				.response(createRequestCallback(sheet, target))
				.reqId()
		);
patch.displayName = true;

const deleteFunction = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.onSheetCalculation()
		.withMinArgs(1)
		.withMaxArgs(3)
		.mapNextArg((url) => convert.toString(url.value, ERROR.VALUE))
		.mapNextArg((config) => (hasValue(config) ? config.value : {}))
		.mapNextArg((target) => target)
		.run((url, config, target) =>
			AsyncRequest.create(sheet, deleteFunction.context)
				.request(() => getInstance().delete(url, config))
				.response(createRequestCallback(sheet, target))
				.reqId()
		);
deleteFunction.displayName = true;

const trace = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.onSheetCalculation()
		.withMinArgs(1)
		.withMaxArgs(3)
		.mapNextArg((url) => convert.toString(url.value, ERROR.VALUE))
		.mapNextArg((config) => (hasValue(config) ? config.value : {}))
		.mapNextArg((target) => target)
		.run((url, config, target) => {
			config.url = url;
			config.method = 'TRACE';
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
		.withMaxArgs(3)
		.mapNextArg((url) => convert.toString(url.value, ERROR.VALUE))
		.mapNextArg((config) => (hasValue(config) ? config.value : {}))
		.mapNextArg((target) => target)
		.run((url, config, target) =>
			AsyncRequest.create(sheet, options.context)
				.request(() => getInstance().options(url, config))
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
