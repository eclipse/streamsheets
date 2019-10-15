const ERROR = require('./errors');
const { ErrorTerm } = require('../parser/Error');
const jsonpath = require('./jsonpath');
const { convert, sheet: sheetutils } = require('./_utils');
const { getMachine, getStreamSheetByName } = require('./utils');
const { Term } = require('@cedalo/parser');


const toBool = (term, defval) => term ? convert.toBoolean(term.value, defval) : defval;

const toString = term => (term ? convert.toString(term.value, '') : '');

const termFromValue = value => (value == null || (typeof value === 'object')) ? undefined : Term.fromValue(value);

const setOrCreateCellAt = (index, value, isErrorValue, sheet) => {
	const cell = sheet.cellAt(index, true);
	// DL-2144: if cell has a formula only set its value, otherwise its term
	if (cell.hasFormula) {
		cell.value = value;
	} else {
		cell.term = isErrorValue ? ErrorTerm.fromError(ERROR.NA) : termFromValue(value);
	}
	return cell;
};

// eslint-disable-next-line no-nested-ternary
const defValue = type => (type === 'number' ? 0 : (type === 'boolean' ? false : ''));

const getLastValue = (term, type) => {
	const value = term._lastValue;
	return value != null ? value : defValue(type.toLowerCase());
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
		const isArray = Array.isArray(list[listidx]);
		// eslint-disable-next-line
		const value = isArray ? list[listidx][keys[keyidx]] : (listidx === 0 ? keys[keyidx] : list[listidx - 1][keys[keyidx]]);
		setOrCreateCellAt(index, value, false, sheet);
	});
};
const copyToCellRange = (cellrange, data, type, isHorizontal) => {
	const isError = ERROR.isError(data);
	const objlist = !isError && toObjectList(data);
	if (!isError && objlist) {
		spreadObjectList(objlist, cellrange, isHorizontal);
		return;
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


const getInboxMessage = (sheet, streamsheetName, messageId) => {
	const streamsheet = getStreamSheetByName(streamsheetName, sheet);
	return streamsheet ? streamsheet.getMessage(messageId) : undefined;
};
const getOutboxMessage = (sheet, messageId) => {
	const machine = getMachine(sheet);
	const outbox = machine && machine.outbox;
	return outbox ? outbox.peek(messageId) : undefined;
};
// DL-578: special handling for special trigger types in endless mode:
const isProcessed = (sheet, message) => sheet.streamsheet.isMessageProcessed(message);
// eslint-disable-next-line
const messageDataAt = (path, message, metadata) => message ? (metadata ? message.getMetaDataAt(path) : message.getDataAt(path)) : null;

const getData = (sheet, term, path, returnNA) => {
	const funcname = term.func && term.name;
	const message = funcname === 'OUTBOXDATA'
		? getOutboxMessage(sheet, path.shift())
		: getInboxMessage(sheet, path.shift(), path.shift());
	// path = path.length ? jsonpath.toString(path) : '';
	return (isProcessed(sheet, message) && returnNA)
		? ERROR.NA
		: messageDataAt(path, message, funcname === 'INBOXMETADATA');
};

const getLastPathPart = (path, term) => {
	if (path.length) {
		const last = jsonpath.last(path);
		// DL-1080: part of this issue specifies that READ() should return number value...
		return convert.toNumber(last, last);
	}
	const funcname = term.func && term.name;
	return funcname === 'INBOXMETADATA' ? 'Metadata' : 'Data';
};

// extract this!!
const validate = (range, errorcode) =>
	((!range || ERROR.isError(range) || ERROR.isError(range.sheet)) ? errorcode : undefined);

const read = (sheet, ...terms) => {
	let error = (!sheet || terms.length < 1) ? ERROR.ARGS : undefined;
	const pathterm = terms[0];
	const val = pathterm.value;
	error = error || ERROR.isError(val);
	if (!error) {
		const path = jsonpath.parse(val);
		const type = toString(terms[2]);
		const target = terms[1];
		const returnNA = toBool(terms[4], false);
		let data = getData(sheet, pathterm, path, returnNA);
		// no target cell => we return json value
		const retval = target ? getLastPathPart(path, pathterm) : data;
		if (data == null) data = (returnNA ? ERROR.NA : getLastValue(read.term, type));
		if (target) {
			const targetrange = sheetutils.getCellRangeFromTerm(target, sheet);
			error = validate(targetrange, ERROR.INVALID_PARAM);
			if (!error && targetrange) {
				const isHorizontal = terms[3] ? !!terms[3].value : undefined;
				read.term._lastValue = data;
				copyToCellRange(targetrange, data, type, isHorizontal);
			// } else {
			// 	// invalid target parameter:
			// 	error = ERROR.INVALID_PARAM;
			}
		}
		// we ignore any error here and return requested path or json value:
		return retval;
	}
	return error;
};

module.exports = read;
