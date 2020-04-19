const { runFunction, terms: { getCellRangeFromTerm } } = require('../../utils');
const { FunctionErrors } = require('@cedalo/error-codes');

const ERROR = FunctionErrors.code;

const createJSONPath = (sheet, terms) => {
	const jsonpath = [];
	terms.reduce((path, term) => {
		// term can be a cell-range ...
		const range = getCellRangeFromTerm(term, sheet);
		if (range && !FunctionErrors.isError(range)) {
			range.iterate(cell => cell && path.push(cell.value));
		} else {
			path.push(term.value);
		}
		return path;
	}, jsonpath);
	return jsonpath.length ? `[${jsonpath.join('][')}]` : '';
};

const idstr = value => (value != null ? `${value}` : '');

// new requirement: always return a string
// we cannot return an array anymore to ease further processing...  :(
const outboxdata = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMinArgs(1)
		.addMappedArg(() => idstr(terms.shift().value) || ERROR.NO_MSG_ID)
		.addMappedArg(() => createJSONPath(sheet, terms))
		.run((messageId, jsonpath) => `[${messageId}]${jsonpath}`);


module.exports = outboxdata;
