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
const { convert } = require('@cedalo/commons');
const { FunctionErrors } = require('@cedalo/error-codes');
const { BinaryOperator } = require('@cedalo/parser');

const ERROR = FunctionErrors.code;

const getSheetFrom = (term) => term && (term.sheet || (term.cell && term.cell.sheet));

const getJSONFromMessageBox = (sheet, boxstr) => {
	let msg;
	if (sheet && boxstr) {
		boxstr = boxstr.toLowerCase();
		if (boxstr.startsWith('inbox')) msg = sheet.streamsheet.inbox.peek();
		else if (boxstr.startsWith('outbox')) msg = sheet.machine.outbox.peek();
		if (msg) {
			if (boxstr.endsWith('metadata')) msg = msg.metadata;
			else if (boxstr.endsWith('data')) msg = msg.data;
		}
	}
	return msg;
};

const getJSON = (term) => {
	const value = term && term.value;
	const type = typeof value;
	if (type === 'string') return getJSONFromMessageBox(getSheetFrom(term), value);
	return value && (Array.isArray(value) || typeof value === 'object') ? value : undefined;
};

const SYMBOL = '.';

class DotReferenceOperator extends BinaryOperator {
	static get SYMBOL() {
		return SYMBOL;
	}
	constructor() {
		super(SYMBOL);
	}

	calc(left, right) {
		if (FunctionErrors.isError(left)) return left;
		if (FunctionErrors.isError(right)) return right;
		// json from left
		const json = getJSON(left);
		if (!json) return ERROR.VALUE;
		// string from right
		const key = right != null ? convert.toString(right.value) : undefined;
		if (key == null) return ERROR.VALUE;
		return json[key];
	}
}

module.exports = DotReferenceOperator;
