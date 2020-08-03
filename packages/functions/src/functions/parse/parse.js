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
const { AsyncRequest, runFunction, terms: { getCellRangeFromTerm, hasValue } } = require('../../utils');
const { addParseResultToInbox } = require('./utils');
const { FunctionErrors } = require('@cedalo/error-codes');
const { parseCSS, parseCSV, parseJavaScript, parseMarkdown, parseXML, parseYAML } = require('@cedalo/parsers');

const ERROR = FunctionErrors.code;

const asString = (value) => value ? convert.toString(value) : '';
const asBoolean = (value) => value ? convert.toBoolean(value) : false;

const createDefaultCallback = () => (context, parseResult, error) => {
	const term = context.term;

	addParseResultToInbox(parseResult, context, error);

	const err = error || response.error;
	if (term && !term.isDisposed) {
		term.cellValue = err ? ERROR.RESPONSE : undefined;
	}
	return err ? AsyncRequest.STATE.REJECTED : undefined;
};

const css = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.onSheetCalculation()
		.withMinArgs(1)
		.withMaxArgs(1)
		.mapNextArg((string) => asString(string.value, ERROR.VALUE))
		.run((string) => {
			return AsyncRequest.create(sheet, css.context)
				.request(() => parseCSS(string))
				.response(createDefaultCallback())
				.reqId();
		});
css.displayName = true;

const csv = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.onSheetCalculation()
		.withMinArgs(1)
		.withMaxArgs(1)
		.mapNextArg((string) => asString(string.value, ERROR.VALUE))
		.run((string) => {
			return AsyncRequest.create(sheet, csv.context)
				.request(() => parseCSV(string))
				.response(createDefaultCallback())
				.reqId();
		});
csv.displayName = true;

const javascript = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.onSheetCalculation()
		.withMinArgs(1)
		.withMaxArgs(1)
		.mapNextArg((string) => asString(string.value, ERROR.VALUE))
		.run((string) => {
			return AsyncRequest.create(sheet, javascript.context)
				.request(() => parseJavaScript(string))
				.response(createDefaultCallback())
				.reqId();
		});
javascript.displayName = true;

const markdown = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.onSheetCalculation()
		.withMinArgs(1)
		.withMaxArgs(1)
		.mapNextArg((string) => asString(string.value, ERROR.VALUE))
		.run((string) => {
			return AsyncRequest.create(sheet, markdown.context)
				.request(() => parseMarkdown(string))
				.response(createDefaultCallback())
				.reqId();
		});
markdown.displayName = true;

const svg = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.onSheetCalculation()
		.withMinArgs(1)
		.withMaxArgs(1)
		.mapNextArg((string) => asString(string.value, ERROR.VALUE))
		.run((string) => {
			return AsyncRequest.create(sheet, svg.context)
				.request(() => parseXML(string))
				.response(createDefaultCallback())
				.reqId();
		});
svg.displayName = true;
module.exports = {
	'PARSE.CSS': css,
	'PARSE.CSV': csv,
	'PARSE.JAVASCRIPT': javascript,
	'PARSE.MARKDOWN': markdown,
	'PARSE.SVG': svg,
};
