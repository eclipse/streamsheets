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
const { messages, runFunction, terms: { getCellRangeFromTerm } } = require('../../utils');

const ERROR = FunctionErrors.code;

const toBool = (term, defval) => term ? convert.toBoolean(term.value, defval) : defval;
const toString = term => (term ? convert.toString(term.value, '') : '');
const termFromValue = (value) => (isType.object(value) ? new ObjectTerm(value) : Term.fromValue(value));

const setOrCreateCellAt = (index, value, isErrorValue, sheet) => {
	if (value != null) {
		const cell = sheet.cellAt(index, true);
		// DL-2144: if cell has a formula only set its value, otherwise its term
		if (cell.hasFormula) {
			cell.value = value;
		} else if (isErrorValue) {
			cell.term = ErrorTerm.fromError(ERROR.NA);
		} else {
			cell.term = value != null ? termFromValue(value) : Term.fromValue('');
		}
	} else {
		// clear target:
		sheet.setCellAt(index, undefined);
	}
};

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

const copyDataToCellRange = (range, isErrorValue, sheet, provider) => {
	let idx = 0;
	let nxt = 0;
	// prepare: DL-4090 might requires to fill target range...
	// const size = provider.vertical ? range.height : range.width;
	const iterate = provider.vertical ? range.iterateByCol : range.iterate;
	iterate.call(range, (cell, index, next) => {
		nxt += next ? 1 : 0;
		idx = next ? 0 : idx + 1;
		const value = !isErrorValue && (nxt < 2 ? provider.indexAt(idx) : provider.valueAt(idx, nxt/* , size */));
		setOrCreateCellAt(index, value, isErrorValue, sheet);
	});
};
// no indices for arrays (DL-4033)
const arrayProvider = (array, vertical) => ({
	vertical,
	indexAt: (idx) => (idx >= 0 && idx < array.length ? array[idx] : undefined),
	valueAt: (/* idx */) => undefined // (idx >= 0 && idx < array.length ? idx : undefined),
	// prepare: DL-4090 might requires to fill target range... => check dictProvider too!!
	// valueAt: (idx, nxt, size) => {
	// 	nxt -= 1;
	// 	idx += nxt * size;
	// 	return (idx >= 0 && idx < array.length ? array[idx] : undefined);
	// }
});
const dictProvider = (dict, vertical) => {
	const keys = dict ? Object.keys(dict) : [];
	return {
		vertical,
		indexAt: idx => (idx >= 0 && idx < keys.length ? keys[idx] : undefined),
		valueAt: (idx, col) => (idx >= 0 && col < 3 && idx < keys.length ? dict[keys[idx]] : undefined)
	};
};
// DL-1122: spread a list of objects...
const toObjectList = (data) => {
	const isArray = Array.isArray(data);
	let list = isArray && typeof data[0] === 'object' && data;
	if (!list && !isArray && typeof data === 'object') {
		// keys might be indices...
		const keys = Object.keys(data);
		list = keys.reduce((all, key) => {
			const index = convert.toNumber(key);
			const value = data[key];
			if (index != null) all.push(isType.object(value) ? value : [value]);
			return all;
		}, []);
		list = list.length === keys.length ? list : undefined;
	}
	return list;
};
const spreadObjectList = (list, cellrange, isHorizontal) => {
	const sheet = cellrange.sheet;
	const first = list[0];
	const keys = Array.isArray(first) || isType.object(first) ? Object.keys(list[0]) : Object.keys(list);
	const vertical = isHorizontal == null ? cellrange.height >= cellrange.width : !isHorizontal;
	const iterate = vertical ? cellrange.iterateByCol : cellrange.iterate;
	let keyidx = 0;
	let listidx = -1;
	let value;
	iterate.call(cellrange, (cell, index, next) => {
		keyidx = next ? 0 : keyidx + 1;
		listidx += next ? 1 : 0;
		value = undefined;
		if (listidx <= list.length) {
			const curr = list[listidx];
			const prev = list[listidx - 1] 
			if (Array.isArray(curr)) {
				value = curr[keys[keyidx]];
			} else if (listidx === 0) {
				value = keys[keyidx];
			} else if(!Array.isArray(prev)) {
				value = isType.object(prev) ? prev[keys[keyidx]] : prev;
			}
		}
		setOrCreateCellAt(index, value, false, sheet);
	});
};
const copyToCellRange = (cellrange, data, type, isHorizontal) => {
	const sheet = cellrange.sheet;
	const isError = FunctionErrors.isError(data);
	if (cellrange.width === 1 && cellrange.height === 1) {
		setOrCreateCellAt(cellrange.start, data, isError, sheet);
	} else {
		if (!isError) {
			const objlist = (!type || type === 'array') && toObjectList(data);
			if (objlist) {
				spreadObjectList(objlist, cellrange, isHorizontal);
				return;
			} 
		}
		const vertical = isHorizontal == null ? cellrange.height >= cellrange.width : !isHorizontal;
		const provider = Array.isArray(data) ? arrayProvider(data, vertical) : dictProvider(data, vertical);
		copyDataToCellRange(cellrange, isError, sheet, provider);
	}
};


const validate = (range, errorcode) =>
	((!range || FunctionErrors.isError(range) || FunctionErrors.isError(range.sheet)) ? errorcode : undefined);


const read = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMinArgs(1)
		.withMaxArgs(5)
		.mapNextArg((msgTerm) => messages.getMessageInfo(sheet, msgTerm))
		.mapNextArg((target) => target && getCellRangeFromTerm(target, sheet))
		.mapNextArg((type) => toString(type).toLowerCase())
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
