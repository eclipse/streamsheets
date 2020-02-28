const {
	common: { compose }
} = require('../../../utils');
const aggregations = require('./aggregations');

const NOOP = () => 0;

// const map = (mapFn) => (combineFn) => (a, c) => combineFn(a, mapFn(c));
const reduce = (reduceFn) => (combineFn) => (a, c) => combineFn(reduceFn(a, c), c);
const filter = (predicateFn) => (combineFn) => (a, c) => (predicateFn(c) ? combineFn(a, c) : a);

const combine = (acc /* , curr */) => acc;

const interval = (period) => (entry) => entry.ts > period;

const create = (queries, period) => {
	const methods = queries.reduce((all, { value, aggregate }) => {
		const method = aggregations.get(aggregate, value) || NOOP;
		all.set(value, reduce(method));
		return all;
	}, new Map());
	const xform = compose(filter(interval(period)), ...methods.values());
	return xform(combine);
};

module.exports = {
	create
};
