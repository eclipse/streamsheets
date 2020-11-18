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
const { isType, ObjectTerm } = require('@cedalo/machine-core');
const { Term } = require('@cedalo/parser');
const { runFunction, terms: { getCellRangeFromTerm, getJSONFromTerm } } = require('../../utils');

const ERROR = FunctionErrors.code;
const TYPES = ['ARRAY', 'DICTIONARY', 'JSON', 'RANGE'];


const termFromValue = (value) => (isType.object(value) ? new ObjectTerm(value) : Term.fromValue(value));
const setCellAt = (index, value, sheet) => {
	// handle empty strings like undefined!
	if (value == null || value === '') {
		sheet.setCellAt(index, undefined);
	} else {
		const cell = sheet.cellAt(index, true);
		cell.value = value;
		cell.term = termFromValue(value);
	}
};

const flattenObject = (obj, result) => {
	const isObjArray = Array.isArray(obj);
	Object.entries(obj).forEach(([key, value]) => {
		// in case of array key is index
		key = isObjArray ? Number(key) : key;
		result[0].push(key);
		if (Array.isArray(value) || isType.object(value)) {
			result[1].push(undefined);
			flattenObject(value, result);
		} else {
			result[1].push(value);
		}
	});
	return result;
};
// returns a 2D array with keys in first row and values in second => so we can handle it same as range!!
const flattenJSON = (json) => flattenObject(json, [[], []]);
const flattenDictionaryList = (list) => {
	const keys = new Set();
	const result = [[]];
	list.forEach((obj) => {
		const row = []
		result.push(row);
		Object.entries(obj).forEach(([key, value]) => {
			keys.add(key);
			row.push(value);
		});
	});
	result[0] = Array.from(keys);
	return result;
};


const mapCol = (direction) => (direction ? (coord) => coord.x : (coord) => coord.y);
const mapRow = (direction) => (direction ? (coord) => coord.y : (coord) => coord.x);
const mapValues = (values, direction) => {
	const col = mapCol(direction);
	const row = mapRow(direction);
	return (coord) => {
		const list = values[row(coord)];
		return list ? list[col(coord)] : undefined;
	};
};
const autoSpreadRange = (lists, range, direction) => {
	const sheet = range.sheet;
	const index = range.start.copy();
	const startcol = index.col;
	const startrow = index.row;
	lists.forEach((values, row) => {
		values.forEach((value, col) => {
			if (direction) index.set(startrow + row, startcol + col);
			else index.set(startrow + col, startcol + row);
			setCellAt(index, value, sheet);
		});
	});
	return true;
};
const spreadRange = (lists, range, direction) => {
	if (range.width === 1 && range.height === 1) return autoSpreadRange(lists, range, direction);
	const coord = { x: -1, y: -1 };
	const sheet = range.sheet;
	const getValue = mapValues(lists, direction);
	range.iterate((cell, index, nextrow) => {
		coord.x += 1;
		if (nextrow) {
			coord.x = 0;
			coord.y += 1;
		}
		const value = getValue(coord);
		setCellAt(index, value, sheet);
	});
	return true;
};
const ensureRange = (json) => {
	if (Array.isArray(json)) {
		const firstEntry = json[0];
		return firstEntry != null && !Array.isArray(firstEntry) ? [json] : json;
	}
	return undefined;
}
const getType = (term) => {
	let value = convert.toString(term.value);
	if (value != null) value = value.toUpperCase();
	// eslint-disable-next-line no-nested-ternary
	return value == null ? 'JSON' : TYPES.includes(value) ? value : undefined;
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
		.mapNextArg((type) => (type ? getType(type) || ERROR.VALUE : 'JSON'))
		.mapNextArg((direction) => (direction ? convert.toBoolean(direction.value, ERROR.VALUE) : true))
		.run((json, range, type, direction) => {
			let res = true;
			switch (type) {
				case 'ARRAY':
				case 'RANGE':
					direction = !direction;
					json = ensureRange(json);
					break;
				case 'DICTIONARY':
					//dictionary is simply JSON with flipped direction, so
					direction = !direction;
					json = Array.isArray(json) ? flattenDictionaryList(json) : flattenJSON(json);
					break;
				default:
					// flatten json to 2D array so we can reuse spreadRange()
					json = flattenJSON(json);
			}
			res = json ? spreadRange(json, range, !direction) : ERROR.VALUE;
			return res;
		});

module.exports = jsontorange;
