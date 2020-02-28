const { FunctionErrors } = require('@cedalo/error-codes');
const { runFunction } = require('../../../utils');
const readQueryOptions = require('./readQueryOptions');
const transform = require('./transform');


const ERROR = FunctionErrors.code;


const boundedPush = (size) => (value, entries) => {
	entries.push(value);
	if (entries.length > size) entries.shift();
	return entries;
};

// const areEqualQueries = (query1, query2) => query1.value === query2.value && query1.aggregate ===  query2.aggregate;
// const areEqualOptions = (opts1, opts2) =>
// 	opts1.limit === opts2.limit &&
// 	opts1.interval === opts2.interval &&
// 	opts1.queries.length === opts2.queries.length &&
// 	opts1.queries.every((query, index) => areEqualQueries(query, opts2.queries[index]));
const areEqualOptions = (opts1, opts2) => opts1.limit === opts2.limit && opts1.interval === opts2.interval;


class QueryStore {
	static of(options) {
		return new QueryStore(options);
	}
	constructor({ interval, limit }) {
		this.limit = limit;
		this.push = boundedPush(limit);
		this.interval = interval * 1000;
		this.nextQuery = interval > 0 ? Date.now() + this.interval : -1;
		this.entries = [];
	}

	reset() {
		this.entries = [];
		this.nextQuery = this.interval > 0 ? Date.now() + this.interval : -1;
	}

	query(store, queries, now = Date.now()) {
		const xform = transform.create(queries, now - this.interval);
		const result = store.entries.reduceRight(xform, { values: {} });
		// TODO: how to handle empty values in result, ie. result = { values: {} }??
		this.push(result, this.entries);
	}
	queryOnInterval(store, queries, now = Date.now()) {
		if (this.nextQuery > 0 && now >= this.nextQuery) {
			this.doQuery(store, queries, now);
			this.nextQuery = now + this.interval;
		}
	}

	write(store, cell, range) {
		// const values = this.entries.reduce(
		// 	(all, { ts, values: vals }) => {
		// 		all.time.push(ts);
		// 		Object.keys(vals).forEach((key) => {
		// 			all[key] = all[key] || [];
		// 			all[key].push(vals[key]);
		// 		});
		// 		return all;
		// 	},
		// 	{ time: [] }
		// );
		const values = this.entries.reduce(
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
	if (!term._options || !term._querystore || !areEqualOptions(options, term._options)) {
		term._options = options;
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
			const options = readQueryOptions(sheet, remain);
			return options.error || options.queries.length < 1  ? ERROR.VALUE : options;
		})
		.run((storeterm, options) => {
			const term = timeQuery.term;
			const timestore = storeterm._timestore;
			const querystore = getQueryStore(term, options);
			querystore.queryOnInterval(timestore, options.queries);
			querystore.write(timestore, term.cell, options.range);
			return true;
		});


module.exports = timeQuery;
