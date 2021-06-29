/********************************************************************************
 * Copyright (c) 2021 Cedalo AG
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 ********************************************************************************/
const { jsonpath } = require('@cedalo/commons');
const { FunctionErrors: { code: ERROR } } = require('@cedalo/error-codes');
const { Message, RequestState } = require('@cedalo/machine-core');
const { toRange } = require('./arrayspread');
const { toArray2D } = require('./jsonflatten');
const { getInbox } = require('./sheet');
const { getCellRangeFromTerm, isInboxTerm, isOutboxTerm, termFromValue } = require('./terms');


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

const addToCell = (sheet, index, resobj) => {
	if (resobj == null) sheet.setCellAt(index, undefined);
	else {
		const cell = sheet.cellAt(index, true);
		cell.term = termFromValue(resobj);
	}
};

const addToCellRange = (range, resobj) => {
	if (range.width === 1 && range.height === 1) {
		addToCell(range.sheet, range.start, resobj);
	} else {
		const lists = toArray2D(resobj, 'json');
		toRange(lists, range, false, addToCell);
	}
};

const addResultToTarget = (sheet, target, resobj) => {
	if (isOutboxTerm(target) || isInboxTerm(target)) {
		const boxref = jsonpath.parse(target.value || '');
		const msgbox = isInboxTerm(target) ? getInbox(sheet, boxref.shift()) : sheet.machine.outbox;
		addToMessageBox(msgbox, resobj, boxref.shift());
	} else {
		const range = getCellRangeFromTerm(target);
		addToCellRange(range, resobj);
	}
};

const ERRORDATA = ['code', 'message'];
const METADATA = ['headers', 'status', 'statusText'];
const REQUESTDATA = ['data', 'headers', 'method', 'url'];

const addValue = (fromObj) => (toObj, key) => {
	toObj[key] = fromObj[key];
	return toObj;
};
const extract = (keys, fromObj) => keys.reduce(addValue(fromObj), {});
const getErrorData = (error) => extract(ERRORDATA, error);
const getResultData = (result) => result.data || {};
const createResult = (extractData) => (requestId, obj) => {
	const data = extractData(obj);
	const metadata = extract(METADATA, obj);
	if (obj.config) metadata.request = { requestId, ...extract(REQUESTDATA, obj.config) };
	return { data, metadata };
};
const createRequestCallback = (sheet, target, extractErrorData, extractResultData) => {
	const createErrorResult = createResult(extractErrorData || getErrorData);
	const createResponseResult = createResult(extractResultData || getResultData);
	return (context, response, error) => {
		const reqId = context._reqId;
		const resobj = error ? createErrorResult(reqId, error) : createResponseResult(reqId, response);
		resobj.metadata.label = error ? `Error: ${context.term.name}` : context.term.name;
		if (target) addResultToTarget(sheet, target, resobj);
	};
};

module.exports = {
	addResultToTarget,
	createRequestCallback
};
