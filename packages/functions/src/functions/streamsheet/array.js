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
const { runFunction, terms: { getCellRangeFromTerm } } = require('../../utils');
const { convert } = require('@cedalo/commons');
const { FunctionErrors } = require('@cedalo/error-codes');

const ERROR = FunctionErrors.code;

const nextRow = (arr) => {
	const row = [];
	arr.push(row);
	return row;
};

const to2DArray = (range, byrow) => {
	const arr = [];
	const iterate = byrow ? range.iterate : range.iterateByCol;
	let row;
	iterate.call(range, (cell, index, nextCol) => {
		row = nextCol ? nextRow(arr) : row;
		row.push(cell ? cell.cellValue : '');
	});
	return arr;
};

const toArray = (range) => {
	const arr = [];
	range.iterate(cell => arr.push(cell ? cell.cellValue : ''));
	return arr;
};

// DL-1829 requires a different, more strict bool handling...
const toBool = (term, defval) => {
	const val = term && term.value;
	return val != null ? convert.toBoolean(val, defval) : defval;
};

// cell-range to json array => to use for writejson, execute or publish...
const array = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMinArgs(1)
		.withMaxArgs(3)
		.mapNextArg(range => getCellRangeFromTerm(range, sheet) || ERROR.INVALID_PARAM)
		.mapNextArg(byrow => toBool(byrow, true))
		.mapNextArg(flat => (flat ? flat.value === 'flat' : null))
		.run((range, byrow, flat) => {
			flat = flat == null ? range.width === 1 || range.height === 1 : flat;
			return flat ? toArray(range) : to2DArray(range, byrow);
		});

module.exports = array;
