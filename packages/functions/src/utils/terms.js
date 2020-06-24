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
const { CellReference, SheetRange } = require('@cedalo/machine-core');

const ERROR = FunctionErrors.code;

const cellFromTerm = (term) => {
	const refop = term && term.operand;
	return refop && refop.sheet && refop.sheet.cellAt(refop.index);
};

// sheet: default sheet to use if CellReference must be created
const getCellFromTermIndex = (term, sheet) => {
	let cell;
	if (term.hasOperandOfType('CellRangeReference')) {
		const range = term.operand.range;
		cell = FunctionErrors.isError(range) || range.sheet.cellAt(range.start);
	} else {
		// eslint-disable-next-line
		term.value; // we need to get value to ensure a possible cell-index is set...
		cell = term.cellIndex != null ? sheet.cellAt(term.cellIndex) : undefined;
	}
	return cell;
};
const getCellFromTerm = (term, sheet) => {
	let cell;
	if (term) {
		cell = term.hasOperandOfType('CellReference') ? term.operand.target : getCellFromTermIndex(term, sheet);
	}
	return cell;
};


const createCellRangeFromIndex = (index, sheet) => {
	const cellrange = index && SheetRange.fromStartEnd(index, index);
	if (cellrange) cellrange.sheet = sheet;
	return cellrange;
};
const createCellRangeFromCellReference = (term) => {
	const cellref = term.operand;
	return term.hasOperandOfType('CellReference') && cellref
		? createCellRangeFromIndex(cellref.index, cellref.sheet)
		: undefined;
};
const getCellRangeFromTerm = (term, sheet, strict) => {
	let range;
	if (term) {
		// we need to get value to ensure cell index is set...
		const value = term.value;
		// cannot simply return error here!! will prevent overriding an error-cell!!!
		// range = FunctionErrors.isError(value) || ((value instanceof SheetRange) && value);
		range = (value instanceof SheetRange) && value;
		if (!range && !strict) {
			range = createCellRangeFromCellReference(term)
				|| (term.cellIndex ? createCellRangeFromIndex(term.cellIndex, sheet) : undefined);
		}
	}
	return range;
};

const getCellRangesFromTerm = (term, sheet, strict) => {
	const ranges = [];
	if (term) {
		const value = term.value;
		// did we get an array of values...
		if (Array.isArray(value)) {
			value.forEach(((val) => {
				const range = (val instanceof SheetRange) && val;
				if (range) ranges.push(range);
			}));
		} else {
			const range = getCellRangeFromTerm(term, sheet, strict);
			if (range) ranges.push(range);
		}
	}
	return ranges;
};


// const getCellsFromTerm = (term, sheet) => {
// 	let list = term ? [] : undefined;
// 	if (list) {
// 		const params = term.isList ? term.params : [term];
// 		params.some((param) => {
// 			const range = getCellRangeFromTerm(param, sheet);
// 			if (!FunctionErrors.isError(range)) {
// 				range.iterate(cell => cell && list.push(cell));
// 				return false;
// 			}
// 			list = range;
// 			return true;
// 		});
// 	}
// 	return list;
// };
const getCellReferencesFromTerm = (term, sheet) => {
	let refs = term ? [] : undefined;
	if (refs) {
		const params = term.isList ? term.params : [term];
		params.some((param) => {
			const range = getCellRangeFromTerm(param, sheet);
			if (FunctionErrors.isError(range)) {
				refs = range;
				return true;
			}
			const rangesheet = range && range.sheet;
			if (rangesheet) {
				range.iterate((cell, index) => {
					if (index) refs.push(new CellReference(index.copy(), rangesheet));
				});
			}
			return false;
		});
	}
	return refs;
};



const callCallback = (termOrCell, cb) => {
	const value = termOrCell ? termOrCell.value : undefined;
	const error = value != null ? FunctionErrors.isError(value) : undefined;
	if (value != null) cb(value, error);
	return error;
};
const iterateTermValues = (sheet, term, callback) => {
	const cellrange = getCellRangeFromTerm(term, sheet);
	let error = FunctionErrors.isError(cellrange); // e.g. illegal reference or range
	if (error) callback(undefined, error);
	else if (cellrange) return !cellrange.some((cell) => !!callCallback(cell, callback));
	else error = callCallback(term, callback);
	return !error;
};
const iterateAllTermsValues = (sheet, terms, callback) => {
	// stop on first error!!
	terms.every((term) => iterateTermValues(sheet, term, callback));
};

const isFuncTerm = (term, func) =>
	term && term.func && typeof term.name === 'string' && term.name.toLowerCase() === func.toLowerCase();

const isInboxTerm = (term) => isFuncTerm(term, 'inbox');
const isInboxDataTerm = (term) => isFuncTerm(term, 'inboxdata');
const isInboxMetaDataTerm = (term) => isFuncTerm(term, 'inboxmetadata');
const isOutboxTerm = (term) => isFuncTerm(term, 'outbox');
const isOutboxDataTerm = (term) => isFuncTerm(term, 'outboxdata');
const isBoxFuncTerm = (term) =>
	isInboxTerm(term) ||
	isOutboxTerm(term) ||
	isOutboxDataTerm(term) ||
	isInboxDataTerm(term) ||
	isInboxMetaDataTerm(term);

const termAs = (f) => (term, fallback) => (term ? f(term.value, fallback) : fallback);

const termAsString = termAs(convert.toString);
const termAsNumber = termAs(convert.toNumber);

const requestIdCurrentMessage = (sheet) => {
	const message = sheet.streamsheet.getMessage();
	return message && message.metadata && message.metadata.requestId;
};

const getRequestIdFromTerm = (requestIdTerm, sheet) => {
	const requestIdParam = requestIdTerm && requestIdTerm.value;
	const requestId = requestIdParam || requestIdCurrentMessage(sheet);
	const error = FunctionErrors.ifNot(typeof requestId === 'string', ERROR.INVALID_PARAM);
	return error || requestId;
};

// const getPendingRequestIdFromTerm = (funcTerm) => (funcTerm && funcTerm._pendingRequestId) || IdGenerator.generate();
const hasValue = (term) => term && term.value != null;

const getTargetTerm = (term) => {
	const target = term.operand.target;
	return (target && target.term) || term;
};

const getJSONFromTerm = (term) => {
	const value = term && term.value;
	return value && (Array.isArray(value) || typeof value === 'object') ? value : undefined;
};

module.exports = {
	cellFromTerm,
	getCellFromTerm,
	// getCellsFromTerm,
	getCellRangeFromTerm,
	getCellRangesFromTerm,
	getCellReferencesFromTerm,
	// getPendingRequestIdFromTerm,
	getJSONFromTerm,
	getRequestIdFromTerm,
	getTargetTerm,
	hasValue,
	isFuncTerm,
	isBoxFuncTerm,
	isInboxTerm,
	isInboxDataTerm,
	isInboxMetaDataTerm,
	isOutboxTerm,
	isOutboxDataTerm,
	iterateTermValues,
	iterateAllTermsValues,
	termAsString,
	termAsNumber
};
