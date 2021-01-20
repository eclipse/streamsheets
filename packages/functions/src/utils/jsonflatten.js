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
const { isType } = require('@cedalo/machine-core');

const flattenObject = (obj, recursive, result) => {
	const isObjArray = Array.isArray(obj);
	Object.entries(obj).forEach(([key, value]) => {
		// in case of array key is index
		key = isObjArray ? Number(key) : key;
		result[0].push(key);
		if (recursive && (Array.isArray(value) || isType.object(value))) {
			result[1].push(undefined);
			flattenObject(value, recursive, result);
		} else {
			result[1].push(value);
		}
	});
	return result;
};
// returns a 2D array with keys in first row and values in second => so we can handle it same as range!!
const flattenJSON = (json, recursive = true) => flattenObject(json, recursive, [[], []]);

const flattenObjectList = (list) => {
	const key2index = new Map();
	const result = [[]];
	list.forEach((obj) => {
		const row = [];
		result.push(row);
		// ensure value is actually an object
		if (isType.object(obj)) {
			Object.entries(obj).forEach(([key, value]) => {
				let index = key2index.get(key);
				if (index == null) {
					index = key2index.size;
					key2index.set(key, index);
				}
				row[index] = value;
			});
		} else {
			// ...otherwise we simply add primitive as key (might not always be a good solution! improve...)
			key2index.set(obj, key2index.size);
		}
	});
	result[0] = Array.from(key2index.keys());
	return result;
};

// DL-1122: spread a list of objects...
const toObjectList = (json) => {
	// keys might be indices...
	const keys = Object.keys(json);
	const list = keys.reduce((all, key) => {
		const index = convert.toNumber(key);
		const value = json[key];
		if (index != null) all.push(isType.object(value) ? value : [value]);
		return all;
	}, []);
	return list.length === keys.length ? list : undefined;
};
const flattenArray = (json) => {
	if (Array.isArray(json)) {
		const firstEntry = json[0];
		if (Array.isArray(firstEntry)) return json;
		return isType.object(firstEntry) ? flattenObjectList(json) : [json];
	}
	return flattenJSON(json, false);
};
const ensureRange = (json) => {
	if (Array.isArray(json)) {
		const firstEntry = json[0];
		return firstEntry != null && !Array.isArray(firstEntry) ? [json] : json;
	}
	return undefined;
};
// create an 2d array from json
const toArray2D = (json, type /* , recursive */) => {
	// NOTE: no indices for arrays and objects (DL-4033)!!
	switch (type) {
		case 'array': {
			return Array.isArray(json) ? [json.map((val) => val)] : flattenJSON(json);
		}
		case 'dictionary':
			if (Array.isArray(json)) return flattenArray(json);
			if (isType.object(json)) {
				const lists = toObjectList(json);
				if (lists) {
					return isType.object(lists[0]) && !Array.isArray(lists[0]) ? flattenObjectList(lists) : lists;
				}
			}
			return flattenJSON(json, false);
		case 'jsonroot':
			return flattenJSON(json, false);
		case 'json':
			return flattenJSON(json, true);
		case 'range': {
			const lists = ensureRange(json);
			return lists ? flattenArray(lists) : flattenJSON(json, false);
		}
		default: {
			return flattenJSON(json, false);
		}
	}
};

module.exports = {
	toArray2D
};
