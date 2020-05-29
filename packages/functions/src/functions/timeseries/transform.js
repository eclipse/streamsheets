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
const { functions: { compose } } = require('@cedalo/commons');
const aggregations = require('./aggregations');
const whereparser = require('./whereparser');

const NOOP = (entry) => entry;

// const map = (mapFn) => (combineFn) => (a, c) => combineFn(a, mapFn(c));
const reduce = (reduceFn) => (combineFn) => (a, c) => combineFn(reduceFn(a, c), c);
const filter = (predicateFn) => (combineFn) => (a, c) => (predicateFn(c) ? combineFn(a, c) : a);

const combine = (acc /* , curr */) => acc;

const interval = (period) => (entry) => period < 0 || entry.ts > period;
// const interval = (period) => {
// 	let last;
// 	return (entry) => {
// 		if (last == null) last = entry.ts - period;
// 		return period < 0 || entry.ts > last;
// 	};
// };


const createFrom = (query, period) => {
	const xFormFns = [filter(interval(period))];
	const aggregate = query.aggregate || [];
	const whereCondition = whereparser.parseCondition(query.where);
	if (whereCondition) xFormFns.push(filter(whereCondition));
	if (query.hasWildcard) {
		xFormFns.push(reduce(aggregations.getWildCard(aggregate[0]) || NOOP));
	} else {
		query.select.forEach((key, index) => xFormFns.push(reduce(aggregations.get(aggregate[index], key) || NOOP)));
	}
	const xform = compose(...xFormFns);
	return xform(combine);
};

module.exports = {
	createFrom
};
