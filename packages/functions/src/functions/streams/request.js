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
const array = require('../streamsheet/array');
const {
	sheet: sheetutils,
	terms: { getCellRangeFromTerm, isInboxTerm, isOutboxTerm, termAsNumber, termFromValue },
	validation: { ensure }
} = require('../../utils');
const { Term } = require('@cedalo/parser');
const { jsonpath } = require('@cedalo/commons');
const IdGenerator = require('@cedalo/id-generator');
const { FunctionErrors } = require('@cedalo/error-codes');
const { Cell, Message, SheetRange, Streams } = require('@cedalo/machine-core');

const ERROR = FunctionErrors.code;

// eslint-disable-next-line no-nested-ternary
const getPendingRequestInfo = (state) => (state === 'resolved' ? true : state === 'rejected' ? ERROR.ERR : false);

const setRequestId = (funcTerm, reqId) => {
	if (funcTerm) {
		funcTerm._pendingRequestId = reqId;
	}
};

const getRequestId = (funcTerm) => (funcTerm && funcTerm._pendingRequestId) || IdGenerator.generate();
const isMessageObject = (json) => json && json.Data && json.Metadata;

const putToMessageBox = (box, message, path) => {
	const msgId = path.shift();
	const msgExists = msgId && box.peek(msgId);
	if (message.error) {
		const errorMessage = new Message(message, msgId);
		errorMessage.metadata.type = 'response';
		box.put(errorMessage);
	} else {
		if (msgId) message.metadata.id = msgId;
		if (msgExists) box.replaceMessage(message);
		else box.put(message);
	}
};

const getResultKeys = (resultKeys, data) => {
	if (Array.isArray(resultKeys) && resultKeys.length > 0) {
		return resultKeys;
	}
	return Object.keys(data[0]);
};

const doInsertHeader = (resultKeys, range) => !resultKeys && range.height > 1;

const _putToCell = (index, data, sheet) => {
	if (data == null) sheet.setCellAt(index, undefined);
	else {
		const cell = sheet.cellAt(index, true);
		cell.term = termFromValue(data);
	}
};
const _putToRange = (range, resultKeys, data) => {
	const dataAsArray = Array.isArray(data) && typeof data[0] === 'object' ? data : [data];
	const keys = getResultKeys(resultKeys, dataAsArray);
	const insertHeader = doInsertHeader(resultKeys, range);
	let columnIndex = 0;
	let rowIndex = insertHeader ? -2 : -1;
	const sheet = range.sheet;
	const sheetOnUpdate = sheet.onUpdate;
	sheet.onUpdate = null;
	range.iterate((cell, index, nextcol) => {
		if (nextcol) {
			rowIndex += 1;
			columnIndex = 0;
		} else {
			columnIndex += 1;
		}
		if (rowIndex === -1) {
			const value = keys[columnIndex];
			const newCell = value != null ? new Cell(value, Term.fromValue(value)) : null;
			sheet.setCellAt(index, newCell);
		} else {
			const key = keys[columnIndex];
			const object = dataAsArray[rowIndex];
			const value = object ? jsonpath.getValueByPath(object, key) : null;
			const newCell = value != null ? new Cell(value, Term.fromValue(value)) : null;
			sheet.setCellAt(index, newCell);
		}
	});
	sheet.onUpdate = sheetOnUpdate;
	sheet._notifyUpdate();
};
const putToRange = (range, resultKeys, message) => {
	const { data } = message;
	if (range.width === 1 && range.height === 1) _putToCell(range.start, data, range.sheet);
	else _putToRange(range, resultKeys, data);
	return true;
};

const _putToRange2 = (range, data) => {
	let rowidx = 0;
	let colidx = -1;
	let newCell = null;
	const sheet = range.sheet;
	const entries = Object.entries(data);
	const sheetOnUpdate = sheet.onUpdate;
	sheet.onUpdate = null;
	range.iterateByCol((cell, index, nextcol) => {
		if (nextcol) {
			rowidx = 0;
			colidx += 1;
		}
		// fix colidx might be larger than available entries (DL-3764)
		if (colidx < entries.length) {
			const [key, values] = entries[colidx];
			// of course values array starts at 0 too :-)
			const value = rowidx === 0 ? key : values[rowidx - 1];
			if (value != null) newCell = new Cell(value, Term.fromValue(value));
		}
		sheet.setCellAt(index, newCell);
		rowidx += 1;
		newCell = null;
	});
	sheet.onUpdate = sheetOnUpdate;
	sheet._notifyUpdate();
};
const putToRange2 = (range, message) => {
	const { data } = message;
	if (range.width === 1 && range.height === 1) _putToCell(range.start, data, range.sheet);
	else _putToRange2(range, data);
	return false;
};

const putToTarget = (sheet, targetTerm, data) => {
	try {
		if (isInboxTerm(targetTerm) || isOutboxTerm(targetTerm)) {
			const target = targetTerm.value || '';
			const path = jsonpath.parse(target);
			const box = isInboxTerm(targetTerm)
				? sheetutils.getInbox(sheet, path.shift())
				: sheetutils.getOutbox(sheet);
			putToMessageBox(box, data, path);
		} else {
			putToMessageBox(sheetutils.getOutbox(sheet), data, ['']);
		}
	} catch (e) {
		putToMessageBox(sheetutils.getOutbox(sheet), data, ['']);
	}
};

const toPath = (key) => {
	const path = jsonpath.parse(key);
	if (path.length > 0) {
		return path;
	}
	return [key];
};

const project = (data, resultKeys) => {
	const isArray = Array.isArray(data);
	const dataArray = isArray ? data : [data];
	const projectedArray = dataArray.map((json) => {
		const projected = {};
		resultKeys.forEach((key) => {
			const path = toPath(key);
			const value = jsonpath.query(path, json);
			if (value !== undefined) {
				jsonpath.setAt(path, projected, value);
			}
		});
		return projected;
	});
	return isArray ? projectedArray : projectedArray[0];
};

const setCellInfo = (cell, info = {}) => {
	info.values = info.values || cell.info.values;
	Object.assign(cell.info, info); // { values, ...info });
};
const handleResponse = (handle, sheet, target, resultKeys, message, funcTerm) => {
	const { info = {}, resultsType, targets = [] } = handle;
	targets.some((trgt) => {
		switch (trgt) {
			case 'none':
				return true;
			case 'sheet':
				if (target && target.isSheetRange) {
					return resultsType
						? putToRange2(target, message, resultsType)
						: putToRange(target, resultKeys, message);
				}
				return false;
			case 'outbox':
				putToTarget(sheet, target, message);
				return true;
			case 'values':
				if (funcTerm.cell) {
					setCellInfo(funcTerm.cell, { ...info, values: message.data, marker: funcTerm._marker });
					return true;
				}
				return false;
			default:
				return false;
		}
	});
};
const createRequest = (sheet, funcTerm, oldReqId, target, resultKeys, promise) => {
	const reqId = IdGenerator.generate();
	sheet.removeRequest(oldReqId);
	sheet.registerRequest(reqId, 'pending');
	promise
		.then((json) => {
			if (sheet.hasRequest(reqId)) {
				const type = json && json.type;
				const responseHandle = type === 'response' && json.responseHandle;
				const messsageData = type === 'response' ? json.response : json;
				const message = isMessageObject(messsageData)
					? Message.fromJSON(messsageData)
					: new Message(messsageData);
				if (resultKeys) {
					message.data = project(message.data, resultKeys);
				}
				message.metadata.type = 'response';
				message.metadata.requestId = json.requestId;
				if (responseHandle) {
					// we need a general way to handle request response, this is rather :-/
					handleResponse(responseHandle, sheet, target, resultKeys, message, funcTerm);
				} else if (target instanceof SheetRange) {
					putToRange(target, resultKeys, message);
				} else {
					putToTarget(sheet, target, message);
				}
				sheet.setRequestState(reqId, 'resolved');
			}
		})
		.catch((error) => {
			if (sheet.hasRequest(reqId)) {
				if (target instanceof SheetRange) {
					// putToRange(sheet, target, resultKeys, { data: [] });
				} else {
					putToTarget(sheet, target, { error: error.message || 'Unknown error' });
				}
				sheet.setRequestState(reqId, 'rejected');
			}
		});
	return reqId;
};

const setDisposeHandler = (funcTerm, reqId, sheet) => {
	if (funcTerm) {
		funcTerm.dispose = () => {
			sheet.removeRequest(reqId);
			const proto = Object.getPrototypeOf(funcTerm);
			if (proto) proto.dispose.call(funcTerm);
		};
	}
};

const resultKeysTermToArray = (sheet, term) => {
	if (!term || !term.value) {
		return undefined;
	}
	if (Array.isArray(term.value)) {
		return term.value;
	}
	const keyArray = array(sheet, term, null, 'flat');
	if (FunctionErrors.isError(keyArray)) {
		return [term.value];
	}
	return keyArray;
};

const isRangeTerm = (targetRange) => !!targetRange;

const determinePageSize = (range, definedPageSize, resultKeys) => {
	const trueDefinedPageSize = !definedPageSize ? Infinity : definedPageSize;
	const headerRow = doInsertHeader(resultKeys, range) ? 1 : 0;
	const maxRows = range ? range.height - headerRow : Infinity;
	const pageSize = Math.min(maxRows, trueDefinedPageSize);
	return isFinite(pageSize) ? pageSize : definedPageSize;
};

const requestinternal = (funcTerm, s, ...t) =>
	ensure(s, t)
		.withSheet()
		.withArgs(3, ['streamTerm', 'message', 'internal'])
		.withProducer()
		.isProcessing()
		.check(({ message }) => FunctionErrors.ifTrue(message == null, ERROR.NO_MSG_DATA))
		.with(({ sheet, internal: { target } }) => getCellRangeFromTerm(target, sheet))
		.check(
			({ internal: { target } }, targetRange) =>
				target === undefined ||
				// target can be a NullTerm:
				target.value === null ||
				isInboxTerm(target) ||
				isOutboxTerm(target) ||
				isRangeTerm(targetRange) ||
				ERROR.TARGET
		)
		.run(({ sheet, streamId, message, internal: { target, resultKeys, timeout } }, targetRange) => {
			let reqId = getRequestId(funcTerm);
			if (!sheet.isPendingRequest(reqId)) {
				message.metadata.requestId = reqId;
				if (sheet.machine) message.metadata.machineId = sheet.machine.id;
				const target_ = targetRange || target;
				if (targetRange) {
					message.data.pageSize = determinePageSize(targetRange, message.data.pageSize, resultKeys);
				}
				reqId = createRequest(
					sheet,
					funcTerm,
					reqId,
					target_,
					resultKeys,
					Streams.request(streamId, message, timeout)
				);
				setRequestId(funcTerm, reqId);
				setDisposeHandler(funcTerm, reqId, sheet);
			}
			return reqId;
		});

const requestinternallegacy = (funcTerm, s, ...t) =>
	ensure(s, t)
		.withSheet()
		.withArgs(3, ['streamTerm', 'message', 'targetTerm', 'resultKeysTerm', 'timeoutTerm'])
		.withProducer()
		.isProcessing()
		.check(({ message }) => FunctionErrors.ifTrue(message == null, ERROR.NO_MSG_DATA))
		.check(
			({ targetTerm }) =>
				isInboxTerm(targetTerm) || isOutboxTerm(targetTerm) || isRangeTerm(targetTerm) || ERROR.TARGET
		)
		.with(({ resultKeysTerm, sheet }) => resultKeysTermToArray(sheet, resultKeysTerm))
		.with(({ timeoutTerm }) => termAsNumber(timeoutTerm))
		.run(({ sheet, targetTerm, streamId, message }, resultKeys, timeout) => {
			let reqId = getRequestId(funcTerm);
			if (!sheet.isPendingRequest(reqId)) {
				message.metadata.requestId = reqId;
				if (sheet.machine) message.metadata.machineId = sheet.machine.id;
				reqId = createRequest(
					sheet,
					funcTerm,
					reqId,
					targetTerm,
					resultKeys,
					Streams.request(streamId, message, timeout)
				);
				setRequestId(funcTerm, reqId);
				setDisposeHandler(funcTerm, reqId, sheet);
			}
			return reqId;
		});

// =REQUEST("REST Alexa Stream",OUTBOXDATA("Message"))
const request = (s, ...t) =>
	ensure(s, t)
		.withArgs(3, ['streamTerm', 'messageTerm', 'targetTerm', 'resultKeysTerm', 'timeoutTerm'])
		.withSheet()
		.withMachine()
		.with(({ messageTerm, machine }) => sheetutils.createMessageFromTerm(messageTerm, machine))
		.with(({ timeoutTerm }) => termAsNumber(timeoutTerm))
		.check((context, message) => FunctionErrors.ifTrue(message == null, ERROR.NO_MSG_DATA))
		.run(({ sheet, streamTerm, targetTerm }, message, timeout) =>
			// TODO: Add resultkeys
			requestinternal(request.term, sheet, streamTerm, message, { target: targetTerm, timeout })
		);

// returns true if request finished, false if pending request and #ERR on error
const requestinfo = (s, ...t) =>
	ensure(s, t)
		.withSheet()
		.withArgs(1, ['reqIdTerm'])
		.isProcessing()
		.run(({ sheet, reqIdTerm }) => {
			const state = sheet.getRequestState(reqIdTerm.value);
			return getPendingRequestInfo(state);
		});

module.exports = {
	REQUEST: request,
	REQUESTINFO: requestinfo,
	requestinternal,
	requestinternallegacy
};
