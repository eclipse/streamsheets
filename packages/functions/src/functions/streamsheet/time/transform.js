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

const createFrom = (query, period) => {
	const aggregate = query.aggregate || [];
	const methods = query.select.map((key, index) => reduce(aggregations.get(aggregate[index], key) || NOOP));
	const xform = compose(filter(interval(period)), ...methods.values());
	return xform(combine);
};

module.exports = {
	createFrom
};
