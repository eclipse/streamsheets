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
const { FunctionErrors } = require('@cedalo/error-codes');
const { ErrorTerm, ObjectTerm, isType } = require('@cedalo/machine-core');
const { Term } = require('@cedalo/parser');
const {
	arrayspread: { toRange },
	jsonflatten: { toArray2D },
	messages,
	runFunction,
	terms: { getCellRangeFromTerm }
} = require('../../utils');

const ERROR = FunctionErrors.code;
const TYPES = ['array', 'bool', 'boolean', 'dictionary', 'json', 'jsonroot', 'number', 'range', 'string'];

const toBool = (term, defval) => term ? convert.toBoolean(term.value, defval) : defval;
const termFromValue = (value) => (isType.object(value) ? new ObjectTerm(value) : Term.fromValue(value));

// eslint-disable-next-line no-nested-ternary
const defValue = type => (type === 'number' ? 0 : (type === 'boolean' ? false : ''));

const getLastValue = (context, path, type) => {
	const { lastValue, lastValuePath } = context;
	return lastValue != null && lastValuePath === path ? lastValue : defValue(type);
};
const setLastValue = (context, path, value) => {
	context.lastValue = value; 
	context.lastValuePath = path; 
};

const setCellAt = (index, value, sheet) => {
	if (value == null) sheet.setCellAt(index, undefined);
	else {
		const cell = sheet.cellAt(index, true);
		// DL-2144: if cell has a formula only set its value, otherwise its term
		if (cell.hasFormula) {
			cell.value = value;
		} else {
			cell.term = termFromValue(value);
		}
	}
};
const setErrorCell = (index, sheet) => {
	const cell = sheet.cellAt(index, true);
	const errTerm = ErrorTerm.fromError(ERROR.NA);
	cell.term = errTerm;
};
const copyToCellRange = (range, data, type, isHorizontal) => {
	const sheet = range.sheet;
	const isError = FunctionErrors.isError(data);
	// note: DL-4090 might requires to fill target range...
	if (isError) {
		// fill range with error code...
		range.iterate((cell, index) => setErrorCell(index, sheet));
	} else if (range.width === 1 && range.height === 1) {
		setCellAt(range.start, data, sheet);
	} else {
		// spread array to range, support jsonflat (DL-4560)
		const lists = toArray2D(data, type);
		const horizontally = isHorizontal == null ? range.height < range.width : isHorizontal;
		toRange(lists, range, horizontally, setCellAt);
	}
};

const validate = (range, errorcode) =>
	((!range || FunctionErrors.isError(range) || FunctionErrors.isError(range.sheet)) ? errorcode : undefined);

const getType = (term) => {
	let value = term ? convert.toString(term.value) : undefined;
	if (value != null) value = value.toLowerCase().trim();
	// eslint-disable-next-line no-nested-ternary
	return value == null ? 'json' : TYPES.includes(value) ? value : undefined;
};
const read = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMinArgs(1)
		.withMaxArgs(5)
		.mapNextArg((msgTerm) => messages.getMessageInfo(sheet, msgTerm))
		.mapNextArg((target) => target && getCellRangeFromTerm(target, sheet))
		.mapNextArg((type) => getType(type) || ERROR.VALUE)
		.mapNextArg((isHorizontal) => toBool(isHorizontal, undefined))
		.mapNextArg((returnNA) => toBool(returnNA, false))
		.validate((msgInfo, targetRange) => targetRange && validate(targetRange, ERROR.INVALID_PARAM))
		.run((msgInfo, targetRange, type, isHorizontal, returnNA) => {
			const context = read.context;
			const key = messages.getMessageValueKey(msgInfo);
			let value = messages.getMessageValue(msgInfo);
			if (value == null || msgInfo.isProcessed) {
				value = returnNA ? ERROR.NA : getLastValue(context, msgInfo.messageKey, type);
			}
			if (targetRange) {
				setLastValue(context, msgInfo.messageKey, value);
				copyToCellRange(targetRange, value, type, isHorizontal);
			}
			// DL-1080: part of this issue specifies that READ() should return number value...
			return convert.toNumber(key, key);
		});
read.displayName = true;

module.exports = read;
