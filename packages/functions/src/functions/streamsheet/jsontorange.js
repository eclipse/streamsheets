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
const flattenArray = (arr, list=[]) => {
	arr.forEach((value, index) => {
		if (Array.isArray(value)) {
			list.push({ key: index });
			flattenArray(value, list);
		} else if (isType.object(value)) {
			list.push({ key: index });
			// eslint-disable-next-line no-use-before-define
			flattenObject(value, list);
		} else {
			list.push({ key: index, value });
		}
	});
	return list;
};
const flattenObject = (obj, list = []) => {
	const entries = Object.entries(obj);
	entries.forEach(([key, value]) => {
		if (Array.isArray(value)) {
			list.push({ key });
			flattenArray(value, list);
		} else if (isType.object(value)) {
			list.push({ key });
			flattenObject(value, list);
		} else {
			list.push({ key, value });
		}
	});
	return list;
};
const json2KeyValues = (json) => (Array.isArray(json) ? flattenArray(json) : flattenObject(json));
const relativeIndex = (range, direction) => {
	const startcol = range.start.col;
	const startrow = range.start.row;
	return (index) => direction ? index.row - startrow : index.col - startcol;
};
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
const valueFromEntry = (entry, useKey) => {
	if (entry == null) return entry;
	const { key, value } = entry;
	return useKey ? key : value;
};
const fillRangeByColumn = (range, keyValues, sheet) => {
	let useKey = false;
	const toArrayIndex = relativeIndex(range, true);
	range.iterateByCol((cell, index, nextcol) => {
		if (nextcol) useKey = !useKey;
		const idx = toArrayIndex(index);
		const entry = keyValues[idx];
		const value = valueFromEntry(entry, useKey);
		setCellAt(index, value, sheet);
	});
};
const fillRangeByRow = (range, keyValues, sheet) => {
	let useKey = false;
	const toArrayIndex = relativeIndex(range, false);
	range.iterate((cell, index, nextrow) => {
		if (nextrow) useKey = !useKey;
		const idx = toArrayIndex(index);
		const entry = keyValues[idx];
		const value = valueFromEntry(entry, useKey);
		setCellAt(index, value, sheet);
	});
};
const spreadJSON = (json, range, direction) => {
	const sheet = range.sheet;
	const keyValues = json2KeyValues(json);
	if (direction) fillRangeByColumn(range, keyValues, sheet);
	else fillRangeByRow(range, keyValues, sheet);
};

const autoSpreadJSON = (json, range, direction) => {
	const sheet = range.sheet;
	const index = range.start.copy();
	const startcol = index.col;
	const startrow = index.row;
	const keyValues = json2KeyValues(json);
	keyValues.forEach(({ key, value }, idx) => {
		if (direction) {
			index.set(startrow + idx, startcol);
			setCellAt(index, key, sheet);
			index.set(startrow + idx, startcol + 1);
			setCellAt(index, value, sheet);
		} else {
			// index.set(startrow + col, startcol + row);
			index.set(startrow, startcol + idx);
			setCellAt(index, key, sheet);
			index.set(startrow + 1, startcol + idx);
			setCellAt(index, value, sheet);
		} 
	});
};
const spreadJSON2 = (json, range, direction) => {
	let useKey = false;
	const sheet = range.sheet;
	const keyValues = json2KeyValues(json);
	const toArrayIndex = relativeIndex(range, direction);
	const iterateRange = (direction ? range.iterateByCol : range.iterate).bind(range);
	iterateRange((cell, index, next) => {
		if (next) useKey = !useKey;
		const idx = toArrayIndex(index);
		const entry = keyValues[idx];
		const value = valueFromEntry(entry, useKey);
		setCellAt(index, value, sheet);
	});
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
const spreadLists = (lists, range, direction) => {
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
};
const spreadRange = (lists, range, direction) => {
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
};

const getType = (term) => {
	let value = convert.toString(term.value);
	if (value != null) value = value.toUpperCase();
	// eslint-disable-next-line no-nested-ternary
	return value == null ? 'JSON' : TYPES.includes(value) ? value : undefined;
};
// json should be an array of arrays
const isRange = (json) => Array.isArray(json) && (json[0] == null || Array.isArray(json[0]));
const getRange = (term) => {
	const range = getCellRangeFromTerm(term);
	return range == null || range.width > 0 || range.height > 0 ? range : undefined;
};
const jsontorange = (sheet, ...terms) =>
	runFunction(sheet, terms)
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
					if (Array.isArray(json)) {
						// check if first entry is array too
						const firstEntry = json[0];
						if (firstEntry != null && !Array.isArray(firstEntry)) json = [json];
						if (range.width === 1 && range.height === 1) spreadLists(json, range, direction);
						else spreadRange(json, range, direction);
					}
					else res = ERROR.VALUE;
					break;
				case 'RANGE':
					if (isRange(json)) {
						if (range.width === 1 && range.height === 1) spreadLists(json, range, direction);
						else spreadRange(json, range, direction);
					}
					else res = ERROR.VALUE;
					break;
				case 'DICTIONARY':
					//dictionary is simply JSON with flipped direction, so
					direction = !direction;
				// eslint-disable-next-line no-fallthrough
				default:
					// JSON
					if (range.width === 1 && range.height === 1) autoSpreadJSON(json, range, direction);
					else spreadJSON(json, range, direction);
			}
			return res;
		});

module.exports = jsontorange;
