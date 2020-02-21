const { FunctionErrors } = require('@cedalo/error-codes');
const aggregations = require('./aggregations');
const mapQueryOptions = require('./mapQueryOptions');
const {	runFunction } = require('../../../utils');

const ERROR = FunctionErrors.code;

const NOOP = () => 0;

const timeFilter = period => (entries, now) => {
	const limit = now - period;
	return entries.filter((entry) => entry.ts > limit);
};
const createReducer = (queries) => queries.reduce((reducer, query) => {
	reducer[query.field] = aggregations.get(query.aggregate) || NOOP;
	return reducer;
}, {});

class Reducer {
	static of(queries) {}
	init() {
		return {};
	}
	step() {}
	result() {}
	reduce(entries) {
		entries.reduce((acc, entry) => this.step(acc, entry), this.init());
		return this.result();
	}
}
class QueryStore {
	static of(options) {
		return new QueryStore(options);
	}
	constructor({ interval, limit }) {
		this.limit = limit;
		this.interval = interval;
		this.intervalFilter = timeFilter(interval * 1000);
		this.nextQuery = interval > 0 ? Date.now() + interval * 1000 : -1;
		this.entries = [];
		this.queried = 0;
	}

	hasOptions({ interval, limit }) {
		return this.limit === limit && this.interval === interval;
	}

	query(store, queries) {
		const now = Date.now();
		this.queried += 1;
		if (this.nextQuery < 0 || now >= this.nextQuery) {
			const reducer = Reducer.of(queries);
			const entries = this.intervalFilter(store.entries, now);
			const result = reducer.reduce(entries);
			this.nextQuery = this.nextQuery > 0 ? now + this.interval * 1000 : -1;
		}
	}
	write(store, cell, range) {
		const values = store.entries.reduce(
			(all, { ts, values: vals }) => {
				all.time.push(ts);
				Object.keys(vals).forEach((key) => {
					all[key] = all[key] || [];
					all[key].push(vals[key]);
				});
				return all;
			},
			{ time: [] }
		);
		cell.info.values = values;
	}
}

const getQueryStore = (term, options) => {
	if (!term._querystore || !term._querystore.hasOptions(options)) {
		term._querystore = QueryStore.of(options);
	}
	return term._querystore;
};

const storeFromTerm = (term) => term && term.name === 'time.store' ? term : undefined;
const getTermFromRef = (cellref) => cellref.operand.target ? cellref.operand.target.term : undefined;
const getStoreTerm = (term) => storeFromTerm(term) || storeFromTerm(getTermFromRef(term));


const timeQuery = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.onSheetCalculation()
		.withMinArgs(2)
		.mapNextArg((storeref) => getStoreTerm(storeref) || ERROR.VALUE)
		.mapRemaingingArgs((remain) => {
			const options = mapQueryOptions(sheet, remain);
			return options.error || options.queries.length < 1  ? ERROR.VALUE : options;
		})
		.run((storeterm, options) => {
			const term = timeQuery.term;
			const timestore = storeterm._timestore;
			const querystore = getQueryStore(term, options);
			querystore.query(timestore, options.queries);
			querystore.write(timestore, term.cell, options.range);

			term.queries = options.queries;
			term.interval = options.interval;
			term.range = options.range;
			term.limit = options.limit;


			return true;
			// const term = timeInterval.term;
			// const intervalstore = getIntervalStore(term, timestore, { key, method, interval, limit });
			// const res = intervalstore.aggregate(timestore);
			// intervalstore.write(timestore, term.cell, targetrange);
			// return res;
		});


module.exports = timeQuery;
