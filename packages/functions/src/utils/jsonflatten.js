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

const flattenDictionaryList = (list /*, recursive */) => {
	const keys = new Set();
	const result = [[]];
	list.forEach((obj) => {
		const row = [];
		result.push(row);
		Object.entries(obj).forEach(([key, value]) => {
			keys.add(key);
			row.push(value);
		});
	});
	result[0] = Array.from(keys);
	return result;
};
const flattenDictionary = (dict, recursive = true) =>
	Array.isArray(dict) ? flattenDictionaryList(dict) : flattenJSON(dict, recursive);

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
const flattenArrayType = (json, recursive) => {
	if (Array.isArray(json)) {
		const firstEntry = json[0];
		if (Array.isArray(firstEntry)) return json;
		return isType.object(firstEntry) ? flattenDictionary(json, recursive) : [json];
	}
	return flattenJSON(json, recursive);
};
// create an 2d array from json
const toArray2D = (json, type, recursive) => {
// NOTE: no indices for arrays and objects (DL-4033)!!
	let lists;
	// create an 2d array from json
	if (type === 'array') {
		lists = flattenArrayType(json, recursive);
	} else if (type === 'dictionary') {
		// json can contain a list of objects!
		lists = Array.isArray(json) ? flattenDictionary(json, recursive) : flattenJSON(json, recursive);
	} else if (Array.isArray(json)) {
		lists = flattenArrayType(json, recursive);
	} else if (isType.object(json)) {
		lists = toObjectList(json);
		if (lists) {
			lists = isType.object(lists[0]) && !Array.isArray(lists[0]) ? flattenDictionary(lists, recursive) : lists;
		} else {
			lists = flattenJSON(json, recursive);
		}
	} else {
		lists = flattenJSON(json, recursive);
	}
	return lists;
};

module.exports = {
	toArray2D
};
