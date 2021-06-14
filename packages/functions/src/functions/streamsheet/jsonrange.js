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
const { FunctionErrors } = require('@cedalo/error-codes');
const {
	arrayspread: { toRange, toRangeGrow },
	jsonflatten: { toArray2D },
	runFunction,
	sheet: { setCellValue },
	terms: { getCellRangeFromTerm, getJSONFromTerm }
} = require('../../utils');

const ERROR = FunctionErrors.code;
const TYPES = ['array', 'dictionary', 'json', 'jsonroot', 'range'];

const getType = (term) => {
	let value = convert.toString(term.value);
	if (value != null) value = value.toLowerCase();
	// eslint-disable-next-line no-nested-ternary
	return value == null ? 'json' : TYPES.includes(value) ? value : undefined;
};
const getRange = (term) => {
	const range = getCellRangeFromTerm(term);
	return range == null || range.width > 0 || range.height > 0 ? range : undefined;
};

// handle empty strings like undefined!
const setCellAt = (sheet, index, value) => setCellValue(sheet, index, value === '' ? null : value);

const jsonrange = (sheet, ...terms) =>
	runFunction(sheet, terms, jsonrange)
		.onSheetCalculation()
		.withMinArgs(2)
		.withMaxArgs(4)
		.mapNextArg((json) => getJSONFromTerm(json) || ERROR.VALUE)
		.mapNextArg((range) => getRange(range) || ERROR.VALUE)
		.mapNextArg((type) => (type ? getType(type) || ERROR.VALUE : 'json'))
		.mapNextArg((direction) => (direction ? convert.toBoolean(direction.value, ERROR.VALUE) : true))
		.run((json, range, type, direction) => {
			let res = true;
			const spread = range.width === 1 && range.height === 1 ? toRangeGrow : toRange;
			const horizontally = type === 'dictionary' || type === 'range' ? direction : !direction;
			json = toArray2D(json, type);
			res = json ? spread(json, range, horizontally, setCellAt) : ERROR.VALUE;
			return res;
		});

module.exports = jsonrange;
