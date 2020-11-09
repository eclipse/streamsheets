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
const { runFunction, terms: { getCellRangeFromTerm } } = require('../../utils');

const ERROR = FunctionErrors.code;

const addRow = (arr) => {
	const row = [];
	arr.push(row);
	return row;
};
const toArray = (range) => {
	let row;
	const arr = [];
	range.iterate((cell, index, nextrow) => {
		if (nextrow) row = addRow(arr);
		row.push(!cell || cell.value == null ? null : cell.value);
	});
	return arr.length > 1 ? arr : arr[0];
};

const range = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withArgCount(1)
		.mapNextArg((cellrange) => getCellRangeFromTerm(cellrange, sheet) || ERROR.INVALID_PARAM)
		.run((cellrange) => toArray(cellrange));

module.exports = range;