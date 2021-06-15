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
const { FunctionErrors: { code: ERROR } } = require('@cedalo/error-codes');
const { parseCSS, parseCSV, parseJavaScript, parseMarkdown, parseXML, parseYAML } = require('@cedalo/parsers');
const { AsyncRequest, runFunction } = require('../../utils');
const { addParseResultToInbox } = require('./utils');


const asString = (value) => (value ? convert.toString(value, ERROR.VALUE) : '');

const createDefaultCallback = (sheet) => (context, parseResult, error) => {
	const inbox = sheet.streamsheet.inbox;
	addParseResultToInbox(context, inbox, parseResult, error);
};


const css = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.onSheetCalculation()
		.withArgCount(1)
		.mapNextArg((string) => asString(string.value))
		.run((string) =>
			AsyncRequest.create(sheet, css.context)
				.request(() => parseCSS(string))
				.response(createDefaultCallback(sheet))
				.reqId()
		);
css.displayName = true;

const csv = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.onSheetCalculation()
		.withArgCount(1)
		.mapNextArg((string) => asString(string.value))
		.run((string) =>
			AsyncRequest.create(sheet, csv.context)
				.request(() => parseCSV(string))
				.response(createDefaultCallback(sheet))
				.reqId()
		);
csv.displayName = true;

const javascript = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.onSheetCalculation()
		.withArgCount(1)
		.mapNextArg((string) => asString(string.value))
		.run((string) =>
			AsyncRequest.create(sheet, javascript.context)
				.request(() => parseJavaScript(string))
				.response(createDefaultCallback(sheet))
				.reqId()
		);
javascript.displayName = true;

const markdown = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.onSheetCalculation()
		.withArgCount(1)
		.mapNextArg((string) => asString(string.value))
		.run((string) =>
			AsyncRequest.create(sheet, markdown.context)
				.request(() => parseMarkdown(string))
				.response(createDefaultCallback(sheet))
				.reqId()
		);
markdown.displayName = true;

const svg = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.onSheetCalculation()
		.withArgCount(1)
		.mapNextArg((string) => asString(string.value))
		.run((string) =>
			AsyncRequest.create(sheet, svg.context)
				.request(() => parseXML(string))
				.response(createDefaultCallback(sheet))
				.reqId()
		);
svg.displayName = true;

const xml = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.onSheetCalculation()
		.withArgCount(1)
		.mapNextArg((string) => asString(string.value))
		.run((string) =>
			AsyncRequest.create(sheet, xml.context)
				.request(() => parseXML(string))
				.response(createDefaultCallback(sheet))
				.reqId()
		);
xml.displayName = true;

const yaml = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.onSheetCalculation()
		.withArgCount(1)
		.mapNextArg((string) => asString(string.value))
		.run((string) =>
			AsyncRequest.create(sheet, yaml.context)
				.request(() => parseYAML(string))
				.response(createDefaultCallback(sheet))
				.reqId()
		);
yaml.displayName = true;

module.exports = {
	'PARSE.CSS': css,
	'PARSE.CSV': csv,
	'PARSE.JAVASCRIPT': javascript,
	'PARSE.MARKDOWN': markdown,
	'PARSE.SVG': svg,
	'PARSE.XML': xml,
	'PARSE.YAML': yaml
};
