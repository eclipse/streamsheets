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
const { isType } = require('@cedalo/machine-core');
const {
	messages: { getMessageInfo, getMessageValue },
	runFunction,
	terms: { getCellRangeFromTerm, getJSONFromTerm }
} = require('../../utils');


const ERROR = FunctionErrors.code;

const getParent = (node, level) => {
	const parent = node.parent;
	return (parent.level >= level) ? getParent(node.parent, level) : parent;
};
const insert = (node) => {
	const doIt = node.key != null;
	if (doIt) {
		// find parent
		const parent = getParent(node, node.level);
		parent.kids[node.key] = node;
	}
	return doIt;
};
// DL-1305: stronger constraints for arrays
// all keys are numbers => first key must be 0 & last must be length -1!!
// const isArray = (node, keys) => keys[0] === '0' && keys[keys.length - 1] === `${keys.length - 1}`;
const isArray = keys => keys.reduce((isArr, key, index) => isArr && key === `${index}`, true);

const toJSON = (node, json) => {
	const kids = node.kids;
	const keys = Object.keys(kids);
	// eslint-disable-next-line no-nested-ternary
	const parent = keys.length ? (isArray(keys) ? [] : {}) : node.value;
	// const parent = keys.length ? (isArray(node, keys) ? [] : {}) : node.value;
	json[node.key] = parent;
	keys.forEach(key => toJSON(kids[key], parent));
	return json;
};
const jsonFromRange = (range) => {
	const root = { level: -1, kids: {} };
	let node = { parent: root, kids: {} };
	range.iterate((cell, index, next) => {
		if (next && insert(node)) {
			node = { parent: node, kids: {}, value: null };
		}
		if (cell) {
			// first cell value always defines key...
			if (node.key != null) node.value = cell.value != null ? cell.value : node.value;
			node.key = node.key != null ? node.key : cell.value;
			node.level = node.level != null ? node.level : cell.level;
		}
	});
	insert(node);
	root.key = 'root';
	return toJSON(root, {}).root || {};
};


const jsonToString = (json) => {
	try {
		return JSON.stringify(json);
	} catch (err) {
		/* ignore */
	}
	return undefined;
};

const createRangeFromTerm = (term, sheet) => {
	const range = getCellRangeFromTerm(term, sheet);
	return range != null && range.width > 1 ? range : undefined;
};

const str2json = (str) => {
	try {
		return str ? JSON.parse(str) : {};
	} catch (err) {
		/* ignore */
	}
	return undefined;
};
const range2json = (term, sheet) => {
	const range = createRangeFromTerm(term, sheet);
	return range ? jsonFromRange(range) : undefined;
};
const message2json = (term, sheet) => {
	const msginfo = getMessageInfo(sheet, term);
	const value = getMessageValue(msginfo);
	return value;
};

const json = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMinArgs(1)
		.withMaxArgs(2)
		.mapNextArg((str) => (isType.string(str.value) ? str2json(str.value) : undefined))
		.remapPrevArg((range, jsonobj) => jsonobj == null ? range2json(range, sheet) : jsonobj)
		.remapPrevArg((term, jsonobj) => jsonobj == null ? getJSONFromTerm(term) : jsonobj)
		.remapPrevArg((message, jsonobj) => jsonobj == null ? message2json(message, sheet) : jsonobj)
		.mapNextArg((asString) => (asString ? convert.toBoolean(asString.value, false) : false))
		.run((jsonobj, asString) => {
			// eslint-disable-next-line no-nested-ternary
			return jsonobj ? (asString ? jsonToString(jsonobj) : jsonobj) : ERROR.VALUE;
		});


module.exports = json;
