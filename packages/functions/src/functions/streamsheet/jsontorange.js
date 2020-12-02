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
	terms: { getCellRangeFromTerm, getJSONFromTerm }
} = require('../../utils');

const ERROR = FunctionErrors.code;
const TYPES = ['array', 'dictionary', 'json', 'jsontop', 'range'];

const ensureRange = (json) => {
	if (Array.isArray(json)) {
		const firstEntry = json[0];
		return firstEntry != null && !Array.isArray(firstEntry) ? [json] : json;
	}
	return undefined;
};
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
const jsontorange = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.onSheetCalculation()
		.withMinArgs(2)
		.withMaxArgs(4)
		.mapNextArg((json) => getJSONFromTerm(json) || ERROR.VALUE)
		.mapNextArg((range) => getRange(range) || ERROR.VALUE)
		.mapNextArg((type) => (type ? getType(type) || ERROR.VALUE : 'json'))
		.mapNextArg((direction) => (direction ? convert.toBoolean(direction.value, ERROR.VALUE) : true))
		.run((json, range, type, direction) => {
			let res = true;
			const spread = 	range.width === 1 && range.height === 1 ? toRangeGrow : toRange
			switch (type) {
				case 'array':
				case 'range':
					type = 'array';
					json = ensureRange(json);
					direction = !direction;
					break;
				case 'dictionary':
					//dictionary is simply JSON with flipped direction, so
					direction = !direction;
					break;
				case 'json':
					break;
				default: /* ignore */
			}
			json = toArray2D(json, type);
			res = json ? spread(json, range, !direction) : ERROR.VALUE;
			return res;
		});

module.exports = jsontorange;
