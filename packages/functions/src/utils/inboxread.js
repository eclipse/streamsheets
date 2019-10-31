const { cutBrackets } = require('./common');
const runFunction = require('./runner');
const sheetutils = require('./sheet');
const { getCellRangeFromTerm } = require('./terms');
const { FunctionErrors: Error } = require('@cedalo/error-codes');

// now loop element is referenced if prefix is empty...
const isLoopPrefix = (term) => {
	const val = term.value;
	return val == null || val === '';
};
const loopPath = (path, prefix) => {
	if (path && path.toLowerCase().startsWith(prefix)) {
		path = path.substr(prefix.length);
		return cutBrackets(path);
	}
	return undefined;
};

const createJSONPath = (prefix, streamsheet, terms) => {
	const jsonpath = [];
	const firstTerm = terms[0];
	if (firstTerm != null && isLoopPrefix(firstTerm)) {
		terms.shift();
		const looppath = loopPath(streamsheet.getLoopPath(), prefix);
		if (looppath !== undefined) {
			// DL-1528: if looppath equals prefix we get and empty string, which we will ignore
			if (looppath.length) jsonpath.push(looppath);
			jsonpath.push(streamsheet.getLoopIndexKey());
		} else {
			return Error.code.INVALID_LOOP_PATH;
		}
	}
	terms.reduce((path, term) => {
		// term can be a cell-range ...
		const range = getCellRangeFromTerm(term, streamsheet.sheet);
		if (range && !Error.isError(range)) {
			range.iterate(cell => cell && path.push(cell.value));
		} else {
			path.push(term.value);
		}
		return path;
	}, jsonpath);
	return jsonpath;
};

const getMessageId = term => (term && term.value) || '';

// new requirement: always return a string
// we cannot return an array anymore to ease further processing...  :(
const inboxread = (prefix, sheet, ...terms) =>
	runFunction(sheet, terms)
		.mapNextArg(() => sheetutils.getStreamSheet(terms.shift(), sheet) || Error.code.NO_STREAMSHEET)
		.mapNextArg(() => getMessageId(terms.shift()))
		.addMappedArg((streamsheet) => createJSONPath(prefix, streamsheet, terms))
		.run((streamsheet, messageId, jsonpath) => {
			const path = jsonpath.length ? `[${jsonpath.join('][')}]` : '';
			return `[${streamsheet.name}][${messageId}]${path}`;
		});


module.exports = inboxread;
