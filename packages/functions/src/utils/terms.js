const ERROR = require('../functions/errors');
const sheetutils = require('./sheet');
const { convert } = require('@cedalo/commons');
const IdGenerator = require('@cedalo/id-generator');


const cellFromTerm = (term) => {
	const refop = term && term.operand;
	return refop && refop.sheet && refop.sheet.cellAt(refop.index);
};

const callCallback = (termOrCell, cb) => {
	const value = termOrCell ? termOrCell.value : undefined;
	const error = value != null ? ERROR.isError(value) : undefined;
	if (value != null) cb(value, error);
	return error;
};
const iterateTermValues = (sheet, term, callback) => {
	const cellrange = sheetutils.getCellRangeFromTerm(term, sheet);
	let error = ERROR.isError(cellrange); // e.g. illegal reference or range
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
	const error = ERROR.ifNot(typeof requestId === 'string', ERROR.INVALID_PARAM);
	return error || requestId;
};

const getPendingRequestIdFromTerm = (funcTerm) => (funcTerm && funcTerm._pendingRequestId) || IdGenerator.generate();

module.exports = {
	cellFromTerm,
	getPendingRequestIdFromTerm,
	getRequestIdFromTerm,
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
