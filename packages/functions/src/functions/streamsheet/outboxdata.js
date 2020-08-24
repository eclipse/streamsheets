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
const { FunctionErrors } = require('@cedalo/error-codes');
const {	runFunction, terms: { getCellRangeFromTerm } } = require('../../utils');

const ERROR = FunctionErrors.code;

const createJSONPath = (sheet, terms) => {
	const jsonpath = [];
	terms.reduce((path, term) => {
		// term can be a cell-range ...
		const range = getCellRangeFromTerm(term, sheet);
		if (range && !FunctionErrors.isError(range)) {
			range.iterate((cell) => cell && path.push(cell.value));
		} else {
			path.push(term.value);
		}
		return path;
	}, jsonpath);
	return jsonpath.length ? `[${jsonpath.join('][')}]` : '';
};

const idstr = (value) => (value != null ? `${value}` : '');

// new requirement: always return a string
// we cannot return an array anymore to ease further processing...  :(
const outboxdata = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMinArgs(1)
		.addMappedArg(() => idstr(terms.shift().value) || ERROR.NO_MSG_ID)
		.addMappedArg(() => createJSONPath(sheet, terms))
		.run((messageId, jsonpath) => `[${messageId}]${jsonpath}`);

const outboxmetadata = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMinArgs(1)
		.addMappedArg(() => idstr(terms.shift().value) || ERROR.NO_MSG_ID)
		.addMappedArg(() => createJSONPath(sheet, terms))
		.run((messageId, jsonpath) => `[${messageId}]${jsonpath}`);

module.exports = {
	OUTBOXDATA: outboxdata,
	OUTBOXMETADATA: outboxmetadata
};
