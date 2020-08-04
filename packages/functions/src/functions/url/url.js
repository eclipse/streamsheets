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
const { AsyncRequest, runFunction, terms: { cellFromTerm, hasValue } } = require('../../utils');
const { FunctionErrors } = require('@cedalo/error-codes');
const { Cell } = require('@cedalo/machine-core');

const ERROR = FunctionErrors.code;

const asURL = (value) => value ? new URL(convert.toString(value)) : new URL();

const createCell = (sheet, term) => {
	const refop = term && term.operand;
	const newcell = new Cell('');
	return (refop && sheet.setCellAt(refop.index, newcell)) ? newcell : null;
};

const setCellValue = (cell, value, sheet, term) => {
	if (cell == null) {
		cell = createCell(sheet, term);
	}
	if (cell) {
		cell.value = value;
	}
}

const createURLFunction = (getter) => {
	const f = (sheet, ...terms) =>
		runFunction(sheet, terms)
			.onSheetCalculation()
			.withMinArgs(2)
			.withMaxArgs(2)
			.mapNextArg((url) => hasValue(url) ? asURL(url.value, ERROR.VALUE) : {})
			.mapNextArg(cell => cellFromTerm(cell))
			.run((url, cell) => {
				const value = getter(url);
				setCellValue(cell, value, sheet, terms[1]);
				return true;
		});
	f.displayName = true;
	return f;
}

const hash = createURLFunction((url) => url.hash);
const host = createURLFunction((url) => url.host);
const hostname = createURLFunction((url) => url.hostname);
const origin = createURLFunction((url) => url.origin);
const password = createURLFunction((url) => url.password);
const pathname = createURLFunction((url) => url.pathname);
const port = createURLFunction((url) => url.port);
const protocol = createURLFunction((url) => url.protocol);
module.exports = {
	'URL.HASH': hash,
	'URL.HOST': host,
	'URL.HOSTNAME': hostname,
	'URL.ORIGIN': origin,
	'URL.PASSWORD': password,
	'URL.PATHNAME': pathname,
	'URL.PORT': port,
	'URL.PROTOCOL': protocol,
};
