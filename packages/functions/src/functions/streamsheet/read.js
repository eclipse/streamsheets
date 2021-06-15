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
const { ErrorTerm } = require('@cedalo/machine-core');
const {
	arrayspread: { toRange },
	jsonflatten: { toArray2D },
	messages,
	runFunction,
	sheet: { setCellValue },
	terms: { getCellRangeFromTerm }
} = require('../../utils');

const ERROR = FunctionErrors.code;
const TYPES = ['array', 'bool', 'boolean', 'dictionary', 'json', 'jsonroot', 'number', 'range', 'string'];

const toBool = (term, defval) => term ? convert.toBoolean(term.value, defval) : defval;

// eslint-disable-next-line no-nested-ternary
const defValue = type => (type === 'number' ? 0 : (type === 'boolean' ? false : ''));

const getLastValue = (context, path, value, type) => {
	const { lastValue, lastValuePath } = context;
	if (lastValue != null && lastValuePath === path) return lastValue;
	if (value != null) return value;
	return defValue(type);
	// return lastValue != null && lastValuePath === path ? lastValue : defValue(value, type);
};
const setLastValue = (context, path, value) => {
	context.lastValue = value;
	context.lastValuePath = path;
};

// DL-2144: if cell has a formula only set its value, otherwise its term
const setCellAt = (sheet, index, value) => setCellValue(sheet, index, value, true);

const setErrorCell = (index, sheet) => {
	const cell = sheet.cellAt(index, true);
	cell.term = ErrorTerm.fromError(ERROR.NA);
};
const copyToCellRange = (range, data, type, horizontally) => {
	const sheet = range.sheet;
	const isError = FunctionErrors.isError(data);
	// note: DL-4090 might requires to fill target range...
	if (isError) {
		// fill range with error code...
		range.iterate((cell, index) => setErrorCell(index, sheet));
	} else if (range.width === 1 && range.height === 1) {
		setCellAt(sheet, range.start, data);
	} else {
		// spread array to range, support jsonflat (DL-4560)
		const lists = toArray2D(data, type);
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
		.mapNextArg((direction) => toBool(direction, true))
		.mapNextArg((returnNA) => toBool(returnNA, false))
		.validate((msgInfo, targetRange) => targetRange && validate(targetRange, ERROR.INVALID_PARAM))
		.run((msgInfo, targetRange, type, direction, returnNA) => {
			const context = read.context;
			const key = messages.getMessageValueKey(msgInfo);
			let value = messages.getMessageValue(msgInfo);
			if (value == null || msgInfo.isProcessed) {
				value = returnNA ? ERROR.NA : getLastValue(context, msgInfo.messageKey, value, type);
			}
			if (targetRange) {
				const horizontally = type === 'dictionary' || type === 'range' ? direction : !direction;
				setLastValue(context, msgInfo.messageKey, value);
				copyToCellRange(targetRange, value, type, horizontally);
			}
			// DL-1080: part of this issue specifies that READ() should return number value...
			return convert.toNumber(key, key);
		});
read.displayName = true;

module.exports = read;
