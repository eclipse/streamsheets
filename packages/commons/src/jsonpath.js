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
// const keyregex = new RegExp('\\[([^\\]]*)\\]', 'g');
// // returns an array with str keys to use as jsonkey path...
// const parse = (str) => {
// 	const res = [];
// 	// TODO how to handle not well defined key string, e.g. square brackets inside keys
// 	if (str && (typeof str === 'string')) {
// 		str.replace(keyregex, (g0, g1) => res.push(g1));
// 	}
// 	return res;
// };

const cutLastChar = (str) => str.substring(0, str.length - 1);
// returns an array with str keys to use as jsonkey path...
const parse = (str) => {
	if (str && typeof str === 'string' && str.startsWith('[') && str.endsWith(']')) {
		const parts = str.split('][');
		const last = parts.length > 1 ? parts.length - 1 : 0;
		parts[0] = parts[0].substr(1);
		parts[last] = cutLastChar(parts[last]);
		return parts;
	}
	return [];
};

const last = (parts) => {
	const _last = parts.length - 1;
	return parts[_last];
};

// path is an array of keys
const query = (path, obj) => {
	let res = obj;
	let parent = obj;
	const length = path != null ? path.length : 0;
	for (let i = 0; i < length; i += 1) {
		parent = parent[path[i]];
		res = parent;
		if (parent == null) {
			res = undefined;
			break;
		}
	}
	return res;
};

const checkKey = (key, parent) => (key === '' ? Object.keys(parent)[0] : key);

const setAt = (path, obj, value) => {
	let currentObj = obj;
	if (!Array.isArray(path)) return;
	for (let i = 0; i < path.length; i += 1) {
		const key = path[i];
		if (i + 1 === path.length) {
			// last iteration
			currentObj[key] = value;
		} else {
			if (currentObj[key] === null || typeof currentObj[key] !== 'object') {
				Object.assign(currentObj, { [key]: {} });
			}
			currentObj = currentObj[key];
		}
	}
};

const deleteAt = (path, obj) => {
	let res;
	let key = (path != null && path.length) ? path.pop() : undefined;
	if (key != null) { // key can be '' or 0...
		const parent = query(path, obj);
		if (parent) {
			key = checkKey(key, parent);
			res = parent[key];
			delete parent[key];
		}
	}
	return res;
};

const getValueByPath = (obj, path) => {
	if (!path || (typeof obj === 'object' && Object.keys(obj).length < 1)) {
		return null;
	}
	const parsed = parse(path);
	if (Array.isArray(parsed) && parsed.length > 0) {
		return query(parsed, obj);
	}
	return obj[path];
};

module.exports = {
	deleteAt,
	last,
	parse,
	query,
	setAt,
	getValueByPath
};

