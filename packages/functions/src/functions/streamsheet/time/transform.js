const {	common: { compose } } = require('../../../utils');
const aggregations = require('./aggregations');

const NOOP = () => 0;

// general map...
const map = (mapFn) => (combineFn) => (a, c) => combineFn(a, mapFn(c));
// ...and filter
// const filter = predicateFn => combineFn => (a, c) => (predicateFn(c) ? combineFn(a, c) : a);

const combine = (acc, curr) => Object.assign(acc, curr);

const init = (first) => (entry) => {
	first.ts = entry.ts;
	Object.assign(first.values, entry.values);
	return first;
};

const mapAggregate = (all, { value, aggregate } = {}) => {
	// TODO define how to handle wrong/unknown aggregate method
	const fn = aggregations.get(aggregate, value) || NOOP;
	all.push(map(fn));
	return all;
};

const create = (queries) => {
	const aggregates = queries.reduce(mapAggregate, [map(init({ values: {} }))]);
	return compose(...aggregates)(combine);
};

module.exports = {
	create
};
