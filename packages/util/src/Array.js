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
const unique = (array) => [...new Set(array)];

const updateWhere = (array, update, f, upsert = true) => {
	let isNew = true;
	const updatedArray = array.map((e) => {
		if(f(e)){
			isNew = false;
			return update;
		}
		return e;
	})
	return isNew && upsert ? [...updatedArray, update] : updatedArray;
}

const intersperse = (array, item) => {
	const applyWithIndex = typeof item === 'function';
	return array.reduce((acc, element, index) => {
		const isLast = index === array.length - 1;
		return [...acc, element, ...(isLast ? [] : [applyWithIndex ? item(index) : item])];
	}, []);
};

const partition = (array, keyF) =>
	array.reduce((acc, element) => {
		const key = keyF(element);
		const existing = acc[key] || [];
		return {
			...acc,
			[key]: [...existing, element]
		};
	}, {});

module.exports = {
	unique,
	updateWhere,
	intersperse,
	partition
};
