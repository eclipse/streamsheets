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
const { AsyncRequest, runFunction } = require('../../utils');
const { getInstance } = require('@cedalo/http-client');
const { FunctionErrors } = require('@cedalo/error-codes');
const { Message } = require('@cedalo/machine-core');

const ERROR = FunctionErrors.code;

const asString = (value) => value ? convert.toString(value) : '';

const defaultCallback = (context, response, error) => {
	context.term.scope.streamsheet.inbox.put(new Message(response.data))
	const term = context.term;
	const err = error || response.error;
	if (term && !term.isDisposed) {
		term.cellValue = err ? ERROR.RESPONSE : undefined;
	}
	return err ? AsyncRequest.STATE.REJECTED : undefined;
};

const request = (sheet, ...terms) =>
	runFunction(sheet, terms)
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
		.withMinArgs(1)
		.withMaxArgs(1)
		.mapNextArg((url) => asString(url.value, ERROR.VALUE))
		.run((url) =>
			AsyncRequest.create(sheet, get.context)
				.request(() => getInstance().get(url, {}))
				.response(defaultCallback)
				.reqId()
		);
get.displayName = true;

const post = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMinArgs(1)
		.withMaxArgs(1)
		.mapNextArg((url) => asString(url.value, ERROR.VALUE))
		.run((url) =>
			AsyncRequest.create(sheet, post.context)
				.request(() => getInstance().post(url, {}))
				.response(defaultCallback)
				.reqId()
		);
post.displayName = true;

module.exports = {
	'HTTP.REQUEST2': request,
	'HTTP.GET': get,
	'HTTP.POST': post
};
