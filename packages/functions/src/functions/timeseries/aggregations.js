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
const { isType } = require('@cedalo/machine-core');
const { aggregations } = require('../../utils');

// we use a slightly different none implementation
const none = () => {
	let val;
	let first = false;
	return (value) => {
		if (!first) {
			val = value;
			first = true;
		}
		return isType.object(val) ? '{ JSON Object }' : val;
	};
};

const createMethod = (str) => str === 'none' ? none() : aggregations.createMethod(str);
const getMethodFactory = (str) => str === 'none' ? none : aggregations.getMethodFactory(str);

const access = (key) => ({
	get: (entry) => entry.values[key],
	set: (value, entry) => {
		entry.values[key] = value;
		return entry;
	}
});
const aggregate = (key, method) => {
	const accessor = access(key);
	return (acc, entry) => {
		const value = method(accessor.get(entry), accessor.get(acc));
		return accessor.set(value, acc);
	};
};

const methodFactory = (methodFab) => {
	const keys = {};
	return {
		get: (key) => {
			keys[key] = keys[key] || methodFab();
			return keys[key];
		}
	};
};
const wildcard = (methodFab) => {
	const methodMap = methodFactory(methodFab);
	return (acc, entry) => {
		const accValues = acc.values;
		Object.entries(entry.values).forEach(([key, value]) => {
			const aggr = methodMap.get(key);
			accValues[key] = aggr(value, accValues[key]);
		});
		return acc;
	};
};

module.exports = {
	get: (str, key) => { // = 0, key) => {
		const method = createMethod(str || 'none');
		return method ? aggregate(key, method) : undefined;
	},
	getWildCard: (str) => { // = 'none') => {
		const methodFab = getMethodFactory(str || 'none');
		return methodFab ? wildcard(methodFab) : undefined;
	},
	validate: (methods = []) => methods.every((str) => !str || aggregations.hasMethod(str))
};
