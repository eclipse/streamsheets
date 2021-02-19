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
const { jsonpath } = require('@cedalo/commons');
const { Message } = require('@cedalo/machine-core');
const {
	arrayspread: { toRange },
	jsonflatten: { toArray2D },
	sheet: sheetutils,
	terms: { getCellRangeFromTerm, isInboxTerm, isOutboxTerm, termFromValue }
} = require('../../utils');

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

const addToCell = (index, resobj, sheet) => {
	if (resobj == null) sheet.setCellAt(index, undefined);
	else {
		const cell = sheet.cellAt(index, true);
		cell.term = termFromValue(resobj);
	}
};

const addToCellRange = (range, resobj) => {
	if (range.width === 1 && range.height === 1) {
		addToCell(range.start, resobj, range.sheet);
	} else {
		const lists = toArray2D(resobj, 'json');
		toRange(lists, range, false, addToCell);
	}
};

const addResultToTarget = (sheet, target, resobj) => {
	if (isOutboxTerm(target) || isInboxTerm(target)) {
		const boxref = jsonpath.parse(target.value || '');
		const msgbox = isInboxTerm(target) ? sheetutils.getInbox(sheet, boxref.shift()) : sheet.machine.outbox;
		addToMessageBox(msgbox, resobj, boxref.shift());
	} else {
		const range = getCellRangeFromTerm(target);
		addToCellRange(range, resobj);
	}
};

module.exports = {
	addResultToTarget
};
