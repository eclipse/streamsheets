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
const { AsyncRequest, runFunction, terms: { hasValue } } = require('../../utils');
const { getInstance } = require('@cedalo/http-client');
const { FunctionErrors } = require('@cedalo/error-codes');
const { Message } = require('@cedalo/machine-core');

const ERROR = FunctionErrors.code;

const asString = (value) => value ? convert.toString(value) : '';

const defaultCallback = (context, response, error) => {
	const term = context.term;
	const err = error || response.error;
	if (err) {
		const errorMessage = new Message(err);
		message.metadata.label = `Error: ${term.name}`;
		context.term.scope.streamsheet.inbox.put(errorMessage);
	} else {
		const message = new Message(response.data);
		message.metadata.label = `${term.name}`;
		context.term.scope.streamsheet.inbox.put(message);
	}
	if (term && !term.isDisposed) {
		term.cellValue = err ? ERROR.RESPONSE : undefined;
	}
	return err ? AsyncRequest.STATE.REJECTED : undefined;
};

const request = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.onSheetCalculation()
		.withMinArgs(2)
		.withMaxArgs(2)
		.mapNextArg((url) => asString(url.value, ERROR.VALUE))
		.mapNextArg((method) => asString(method.value, ERROR.VALUE))
		.run((url, method) =>
			AsyncRequest.create(sheet, request.context)
				.request(() => getInstance().request({
					url,
					method
				}))
				.response(defaultCallback)
				.reqId()
		);
request.displayName = true;

const get = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.onSheetCalculation()
		.withMinArgs(1)
		.withMaxArgs(2)
		.mapNextArg((url) => asString(url.value, ERROR.VALUE))
		.mapNextArg((config) => hasValue(config) ? asString(config.value, ERROR.VALUE) : '')
		.run((url, config) =>
			AsyncRequest.create(sheet, get.context)
				.request(() => getInstance().get(url, config = {}))
				.response(defaultCallback)
				.reqId()
		);
get.displayName = true;

const post = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.onSheetCalculation()
		.withMinArgs(1)
		.withMaxArgs(3)
		.mapNextArg((url) => asString(url.value, ERROR.VALUE))
		.mapNextArg((data) => hasValue(data) ? asString(data.value, ERROR.VALUE) : '')
		.mapNextArg((config) => hasValue(config) ? asString(config.value, ERROR.VALUE) : {})
		.run((url, data, config) =>
			AsyncRequest.create(sheet, post.context)
				.request(() => getInstance().post(url, data = '', config = {}))
				.response(defaultCallback)
				.reqId()
		);
post.displayName = true;

const put = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.onSheetCalculation()
		.withMinArgs(1)
		.withMaxArgs(3)
		.mapNextArg((url) => asString(url.value, ERROR.VALUE))
		.mapNextArg((data) => hasValue(data) ? asString(data.value, ERROR.VALUE) : '')
		.mapNextArg((config) => hasValue(config) ? asString(config.value, ERROR.VALUE) : {})
		.run((url, data, config) =>
			AsyncRequest.create(sheet, put.context)
				.request(() => getInstance().put(url, data = '', config = {}))
				.response(defaultCallback)
				.reqId()
		);
put.displayName = true;

const patch = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.onSheetCalculation()
		.withMinArgs(1)
		.withMaxArgs(3)
		.mapNextArg((url) => asString(url.value, ERROR.VALUE))
		.mapNextArg((data) => hasValue(data) ? asString(data.value, ERROR.VALUE) : '')
		.mapNextArg((config) => hasValue(config) ? asString(config.value, ERROR.VALUE) : {})
		.run((url, data, config) =>
			AsyncRequest.create(sheet, patch.context)
				.request(() => getInstance().patch(url, data = '', config = {}))
				.response(defaultCallback)
				.reqId()
		);
patch.displayName = true;

const deleteFunction = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.onSheetCalculation()
		.withMinArgs(1)
		.withMaxArgs(2)
		.mapNextArg((url) => asString(url.value, ERROR.VALUE))
		.mapNextArg((config) => hasValue(config) ? asString(config.value, ERROR.VALUE) : '')
		.run((url, config) =>
			AsyncRequest.create(sheet, deleteFunction.context)
				.request(() => getInstance().delete(url, config = {}))
				.response(defaultCallback)
				.reqId()
		);
deleteFunction.displayName = true;

const trace = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.onSheetCalculation()
		.withMinArgs(1)
		.withMaxArgs(1)
		.mapNextArg((url) => asString(url.value, ERROR.VALUE))
		.run((url) =>
			AsyncRequest.create(sheet, trace.context)
				.request(() => getInstance().request({
					url,
					method: 'TRACE'
				}))
				.response(defaultCallback)
				.reqId()
		);
trace.displayName = true;

const head = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.onSheetCalculation()
		.withMinArgs(1)
		.withMaxArgs(2)
		.mapNextArg((url) => asString(url.value, ERROR.VALUE))
		.mapNextArg((config) => hasValue(config) ? asString(config.value, ERROR.VALUE) : '')
		.run((url, config) =>
			AsyncRequest.create(sheet, head.context)
				.request(() => getInstance().head(url, config = {}))
				.response(defaultCallback)
				.reqId()
		);
head.displayName = true;

const options = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.onSheetCalculation()
		.withMinArgs(1)
		.withMaxArgs(2)
		.mapNextArg((url) => asString(url.value, ERROR.VALUE))
		.mapNextArg((config) => hasValue(config) ? asString(config.value, ERROR.VALUE) : '')
		.run((url, config) =>
			AsyncRequest.create(sheet, options.context)
				.request(() => getInstance().options(url, config = {}))
				.response(defaultCallback)
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
