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
const { parseCSV, parseXML } = require('@cedalo/parsers');
const { AsyncRequest, runFunction } = require('../../utils');
const { addParseResultToInbox } = require('./utils');


const asString = (value) => (value ? convert.toString(value, ERROR.VALUE) : '');

const createDefaultCallback = (sheet) => (context, parseResult, error) => {
	const inbox = sheet.streamsheet.inbox;
	addParseResultToInbox(context, inbox, parseResult, error);
};

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

module.exports = {
	'PARSE.CSV': csv,
	'PARSE.XML': xml
};
