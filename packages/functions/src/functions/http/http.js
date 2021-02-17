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
const { convert, jsonpath } = require('@cedalo/commons');
const { FunctionErrors } = require('@cedalo/error-codes');
const { getInstance } = require('@cedalo/http-client');
const { isType, ErrorTerm, Message, ObjectTerm, SheetRange } = require('@cedalo/machine-core');
const { Term } = require('@cedalo/parser');
const { addHTTPResponseToInbox, addHTTPResponseToCell, addHTTPResponseToRange } = require('./utils');
const {
	arrayspread: { toRange },
	jsonflatten: { toArray2D },
	sheet: sheetutils,
	terms: { getCellRangeFromTerm, hasValue, isInboxTerm, isOutboxTerm },
	AsyncRequest,
	runFunction
} = require('../../utils');

const ERROR = FunctionErrors.code;

const DATA = ['data'];
const ERRORDATA = ['code', 'message'];
const METADATA = ['config', 'headers', 'status', 'statusText'];
const CONFIGDATA = ['headers', 'method', 'url'];
const addValue = (fromObj) => (toObj, key) => {
	toObj[key] = fromObj[key];
	return toObj;
};
const extract = (keys, fromObj) => keys.reduce(addValue(fromObj), {});

// const asString = (value) => value ? convert.toString(value) : '';
const asBoolean = (value) => value ? convert.toBoolean(value) : false;
// TODO: move to function utils:
const termFromValue = (value) => (isType.object(value) ? new ObjectTerm(value) : Term.fromValue(value));


const createMessage = (resobj, id, requestId) => {
	const { data, metadata } = resobj;
	const message = new Message(data, id);
	// add metadata:
	Object.assign(message.metadata, metadata);
	message.metadata.type = 'response';
	message.metadata.requestId = requestId;
	return message;
};
const addToMessageBox = (box, resobj, msgId) => {
	if (box) {
		const message = createMessage(resobj, msgId);
		if (msgId && box.peek(msgId)) box.replaceMessage(message);
		else box.put(message);
	}
};
// TODO: general? setValueCell() add flag to keep formula? or function? or...?
const addToCell = (sheet, index, resobj) => {
	if (resobj == null) sheet.setCellAt(index, undefined);
	else {
		const cell = sheet.cellAt(index, true);
		cell.term = termFromValue(resobj);
	}
};
// TODO: general? spreadValueToCellRange
const addToCellRange = (range, resobj) => {
	if (range.width === 1 && range.height === 1) {
		addToCell(range.sheet, range.start, resobj);
	} else {
		const lists = toArray2D(resobj, 'json');
		toRange(lists, range, false, addToCell);
	}
};
// TODO: general?
const putToTarget = (sheet, target, resobj) => {
	if (isOutboxTerm(target)) addToMessageBox(sheet.machine.outbox, resobj);
	else if (isInboxTerm(target)) {
		const inboxref = jsonpath(target.value || '');
		addToMessageBox(sheetutils.getInbox(sheet, inboxref.shift()), resobj, inboxref.shift());
	} else {
		const range = getCellRangeFromTerm(target);
		addToCellRange(range, resobj);
	}
};
const createResult = (obj, dataFields) => {
	const data = extract(dataFields, obj);
	const metadata = extract(METADATA, obj);
	// TODO: review, further split config or remove it from metadata completely
	if (metadata.config) metadata.config = extract(CONFIGDATA, metadata.config);
	return { data, metadata };
};
// getInstance()
// 	.get('https://google.de', {})
// 	.then((response) => {
// 		const resobj = createResult(response, DATA);
// 		console.log(resobj);
// 	})
// 	.catch((error) => {
// 		const resobj = createResult(error, DATA);
// 		console.log(resobj);
// 	});

// TODO: parse response
const createDefaultCallback = (sheet, target, parse = false) => (context, response, error) => {
	const term = context.term;
	const resobj = error ? createResult(error, ERRORDATA) : createResult(response, DATA);
	if (target) putToTarget(sheet, target, resobj);
	if (term && !term.isDisposed) {
		term.cellValue = error ? ERROR.RESPONSE : undefined;
	}
	return error ? AsyncRequest.STATE.REJECTED : undefined;
};

const request = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.onSheetCalculation()
		.withMinArgs(2)
		.withMaxArgs(5)
		.mapNextArg((url) => convert.toString(url.value, ERROR.VALUE))
		.mapNextArg((method) => convert.toString(method.value, ERROR.VALUE))
		.mapNextArg((config) => hasValue(config) ? config.value : {})
		.mapNextArg((target) => hasValue(target) ? target.value : {})
		.mapNextArg((parse) => asBoolean(parse && parse.value))
		.run((url, method, config, target, parse) => {
			config.url = url;
			config.method = method;
			return AsyncRequest.create(sheet, request.context)
				.request(() => getInstance().request(config))
				.response(createDefaultCallback(sheet, target, parse))
				.reqId();
		});
request.displayName = true;

const get = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.onSheetCalculation()
		.withMinArgs(1)
		.withMaxArgs(4)
		.mapNextArg((url) => convert.toString(url.value, ERROR.VALUE))
		.mapNextArg((config) => hasValue(config) ? config.value : {})
		.mapNextArg((target) => hasValue(target) ? target.value : {})
		.mapNextArg((parse) => asBoolean(parse && parse.value))
		.run((url, config, target, parse) => {
			return AsyncRequest.create(sheet, get.context)
				.request(() => getInstance().get(url, config))
				.response(createDefaultCallback(sheet, target, parse))
				.reqId();
		});
get.displayName = true;

const post = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.onSheetCalculation()
		.withMinArgs(1)
		.withMaxArgs(3)
		.mapNextArg((url) => convert.toString(url.value, ERROR.VALUE))
		.mapNextArg((data) => hasValue(data) ? data.value : '')
		.mapNextArg((config) => hasValue(config) ? config.value : {})
		.run((url, data, config) => {
			if (typeof data === 'object') {
				// handle JSON
			}
			return AsyncRequest.create(sheet, post.context)
				.request(() => getInstance().post(url, data, config))
				.response(createDefaultCallback(sheet))
				.reqId()
		});
post.displayName = true;

const put = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.onSheetCalculation()
		.withMinArgs(1)
		.withMaxArgs(3)
		.mapNextArg((url) => convert.toString(url.value, ERROR.VALUE))
		.mapNextArg((data) => hasValue(data) ? data.value : '')
		.mapNextArg((config) => hasValue(config) ? config.value : {})
		.run((url, data, config) => {
			return AsyncRequest.create(sheet, put.context)
				.request(() => getInstance().put(url, data, config))
				.response(createDefaultCallback(sheet))
				.reqId()
		});
put.displayName = true;

const patch = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.onSheetCalculation()
		.withMinArgs(1)
		.withMaxArgs(3)
		.mapNextArg((url) => convert.toString(url.value, ERROR.VALUE))
		.mapNextArg((data) => hasValue(data) ? data.value : '')
		.mapNextArg((config) => hasValue(config) ? config.value : {})
		.run((url, data, config) => {
			return AsyncRequest.create(sheet, patch.context)
				.request(() => getInstance().patch(url, data, config))
				.response(createDefaultCallback(sheet))
				.reqId()
		});
patch.displayName = true;

const deleteFunction = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.onSheetCalculation()
		.withMinArgs(1)
		.withMaxArgs(2)
		.mapNextArg((url) => convert.toString(url.value, ERROR.VALUE))
		.mapNextArg((config) => hasValue(config) ? config.value : {})
		.run((url, config) =>
			AsyncRequest.create(sheet, deleteFunction.context)
				.request(() => getInstance().delete(url, config))
				.response(createDefaultCallback(sheet))
				.reqId()
		);
deleteFunction.displayName = true;

const trace = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.onSheetCalculation()
		.withMinArgs(1)
		.withMaxArgs(2)
		.mapNextArg((url) => convert.toString(url.value, ERROR.VALUE))
		.mapNextArg((config) => hasValue(config) ? config.value : {})
		.run((url, config) => {
			config.url = url;
			config.method = 'TRACE';
			return AsyncRequest.create(sheet, request.context)
				.request(() => getInstance().request(config))
				.response(createDefaultCallback(sheet))
				.reqId();
		});
trace.displayName = true;

const head = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.onSheetCalculation()
		.withMinArgs(1)
		.withMaxArgs(2)
		.mapNextArg((url) => convert.toString(url.value, ERROR.VALUE))
		.mapNextArg((config) => hasValue(config) ? config.value : {})
		.run((url, config) =>
			AsyncRequest.create(sheet, head.context)
				.request(() => getInstance().head(url, config))
				.response(createDefaultCallback(sheet))
				.reqId()
		);
head.displayName = true;

const options = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.onSheetCalculation()
		.withMinArgs(1)
		.withMaxArgs(2)
		.mapNextArg((url) => convert.toString(url.value, ERROR.VALUE))
		.mapNextArg((config) => hasValue(config) ? config.value : {})
		.run((url, config) =>
			AsyncRequest.create(sheet, options.context)
				.request(() => getInstance().options(url, config))
				.response(createDefaultCallback(sheet))
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
