const ERROR = require('../errors');
const sheetutils = require('./sheet');


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

module.exports = {
	iterateTermValues,
	iterateAllTermsValues
};
