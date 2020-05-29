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

const createObj = (keys, values) => {
	const obj = {};
	keys.forEach((key, index) => {
		if (key != null) {
			obj[key] = values[index];
		}
	});
	return obj;
};
const createObjects = (keys, values) => values.map(vals => createObj(keys, vals));

const nextRow = (arr) => {
	const row = [];
	arr.push(row);
	return row;
};
const createDictionaries = (range, byrow) => {
	const keys = [];
	const values = [];
	const iterate = byrow ? range.iterate : range.iterateByCol;
	let arr;
	iterate.call(range, (cell, index, next) => {
		// eslint-disable-next-line
		arr = next ? (!keys.length ? keys : nextRow(values)) : (!values.length ? keys : arr);
		arr.push(cell ? cell.value : '');
	});
	return createObjects(keys, values);
};

// cell-range to json object => to use for writejson, execute or publish...
const dictionary = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMinArgs(1)
		.withMaxArgs(2)
		.mapNextArg(cellrange => getCellRangeFromTerm(cellrange, sheet) || ERROR.INVALID_PARAM)
		.mapNextArg(byrow => convert.toBoolean(!!byrow && byrow.value, false))
		.validate((cellrange) => FunctionErrors.ifTrue(cellrange.width < 2 && cellrange.height < 2, ERROR.INVALID_PARAM))
		.run((cellrange, byrow) => {
			const dicts = createDictionaries(cellrange, byrow);
			return dicts.length < 2 ? dicts[0] : dicts;
		});


module.exports = dictionary;
