const { runFunction, sheet: sheetutils, terms: { getCellRangeFromTerm } } = require('../../utils');
const { Term } = require('@cedalo/parser');
const { convert } = require('@cedalo/commons');
const { FunctionErrors } = require('@cedalo/error-codes');
const { Cell, ErrorTerm, isType } = require('@cedalo/machine-core');

const ERROR = FunctionErrors.code;

const toBool = (term, defval) => term ? convert.toBoolean(term.value, defval) : defval;

const toString = term => (term ? convert.toString(term.value, '') : '');

// DL-3703 for object values we have to use special replacement
const termFromValue = value => (isType.object(value) ? Term.fromValue(Cell.VALUE_REPLACEMENT) : Term.fromValue(value));

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

const getLastValue = (term, type) => {
	const value = term._lastValue;
	return value != null ? value : defValue(type);
};

const copyDataToCellRange = (range, isErrorValue, sheet, provider) => {
	let idx = 0;
	let nxt = 0;
	const iterate = provider.vertical ? range.iterateByCol : range.iterate;
	iterate.call(range, (cell, index, next) => {
		nxt += next ? 1 : 0;
		idx = next ? 0 : idx + 1;
		const value = !isErrorValue && (nxt < 2 ? provider.indexAt(idx) : provider.valueAt(idx));
		setOrCreateCellAt(index, value, isErrorValue, sheet);
	});
};
const arrayProvider = (array, vertical) => ({
	vertical,
	indexAt: idx => (idx >= 0 && idx < array.length ? idx : undefined),
	valueAt: idx => (idx >= 0 && idx < array.length ? array[idx] : undefined)
});
const dictProvider = (dict, vertical) => {
	const keys = dict ? Object.keys(dict) : [];
	return {
		vertical,
		indexAt: idx => (idx >= 0 && idx < keys.length ? keys[idx] : undefined),
		valueAt: idx => (idx >= 0 && idx < keys.length ? dict[keys[idx]] : undefined)
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
			if (index != null) all.push(data[key]);
			return all;
		}, []);
		list = list.length === keys.length ? list : undefined;
	}
	return list;
};
const spreadObjectList = (list, cellrange, isHorizontal) => {
	const sheet = cellrange.sheet;
	const keys = Object.keys(list[0]);
	const vertical = isHorizontal == null ? cellrange.height >= cellrange.width : !isHorizontal;
	const iterate = vertical ? cellrange.iterateByCol : cellrange.iterate;
	let keyidx = 0;
	let listidx = -1;
	iterate.call(cellrange, (cell, index, next) => {
		keyidx = next ? 0 : keyidx + 1;
		listidx += next ? 1 : 0;
		if (listidx > list.length) listidx = 0;
		const isArray = Array.isArray(list[listidx]);
		// eslint-disable-next-line
		const value = isArray ? list[listidx][keys[keyidx]] : (listidx === 0 ? keys[keyidx] : list[listidx - 1][keys[keyidx]]);
		setOrCreateCellAt(index, value, false, sheet);
	});
};
const copyToCellRange = (cellrange, data, type, isHorizontal) => {
	const isError = FunctionErrors.isError(data);
	if (!isError) {
		const objlist = (!type || type === 'array') && toObjectList(data);
		if (objlist) {
			spreadObjectList(objlist, cellrange, isHorizontal);
			return;
		} 
	}
	const sheet = cellrange.sheet;
	if (cellrange.width === 1 && cellrange.height === 1) {
		setOrCreateCellAt(cellrange.start, data, isError, sheet);
	} else {
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
		.mapNextArg((pathterm) => sheetutils.readMessageValue(sheet, pathterm))
		.mapNextArg((target) => target && getCellRangeFromTerm(target, sheet))
		.mapNextArg((type) => toString(type).toLowerCase())
		.mapNextArg((isHorizontal) => toBool(isHorizontal, undefined))
		.mapNextArg((returnNA) => toBool(returnNA, false))
		.validate((data, targetRange) => targetRange && validate(targetRange, ERROR.INVALID_PARAM))
		.run((data, targetRange, type, isHorizontal, returnNA) => {
			if (data.value == null || data.isProcessed) {
				data.value = returnNA ? ERROR.NA : getLastValue(read.term, type);
			}
			if (targetRange) {
				read.term._lastValue = data.value;
				copyToCellRange(targetRange, data.value, type, isHorizontal);
			}
			// DL-1080: part of this issue specifies that READ() should return number value...
			return convert.toNumber(data.key, data.key);
		});
read.displayName = true;

module.exports = read;
