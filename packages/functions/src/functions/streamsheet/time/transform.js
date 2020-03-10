const { common: { compose } } = require('../../../utils');
const aggregations = require('./aggregations');
const whereparser = require('./whereparser');

const NOOP = (entry) => entry;

// const map = (mapFn) => (combineFn) => (a, c) => combineFn(a, mapFn(c));
const reduce = (reduceFn) => (combineFn) => (a, c) => combineFn(reduceFn(a, c), c);
const filter = (predicateFn) => (combineFn) => (a, c) => (predicateFn(c) ? combineFn(a, c) : a);

const combine = (acc /* , curr */) => acc;

const interval = (period) => (entry) => entry.ts > period;
// const interval2 = (period) => {
// 	let last;
// 	return (entry) => {
// 		if (last == null) last = Date.now() - period;
// 		// if (last == null) last = entry.ts - period;
// 		return entry.ts > last;
// 	};
// };


const createFrom = (query, period) => {
	const xFormFns = [filter(interval(period))];
	const aggregate = query.aggregate || [];
	const whereCondition = whereparser.parseCondition(query.where);
	if (whereCondition) xFormFns.push(filter(whereCondition));
	query.select.forEach((key, index) => xFormFns.push(reduce(aggregations.get(aggregate[index], key) || NOOP)));
	const xform = compose(...xFormFns);
	return xform(combine);
};

module.exports = {
	createFrom
};
