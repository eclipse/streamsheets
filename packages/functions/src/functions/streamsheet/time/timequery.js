const { FunctionErrors } = require('@cedalo/error-codes');
const { Cell } = require('@cedalo/machine-core');
const { Term } = require('@cedalo/parser');

const { runFunction } = require('../../../utils');
const readQueryOptions = require('./readQueryOptions');
const stateListener = require('./stateListener');
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

const entriesReduce = (all, { ts, values: vals }) => {
	all.time.push(ts);
	if (vals) {
		Object.keys(vals).forEach((key) => {
			all[key] = all[key] || [];
			all[key].push(vals[key]);
		});
	}
	return all;
};
const limitEntries = (entries, limit) => {
	const allEntries = entries.reduceRight((all, entry) => {
		if (all.length < limit) all.push(entry);
		return all;
	}, []);
	return allEntries.reverse();
};
const spreadValuesToRange = (values, range) => {
	const sheet = range.sheet;
	const time = values.time || [];
	const entries = Object.entries(values).filter(([key]) => key !== 'time');
	let row = -1;
	let col = 0;
	let value;
	range.iterate((_cell, index, nextrow) => {
		col = nextrow ? 0 : col + 1;
		row = nextrow ? row + 1 : row;
		value = undefined;
		if (col === 0) {
			value = row === 0 ? 'time' : time[row - 1];
		} else {
			const colEntries = entries[col - 1];
			if (colEntries) {
				value = row === 0 ? colEntries[0] : colEntries[1][row - 1];
			}
		}
		const newCell = value != null ? new Cell(value, Term.fromValue(value)) : undefined;
		sheet.setCellAt(index, newCell);
	});
};

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
		this.reset = this.reset.bind(this);
	}

	reset() {
		this.entries = [];
		this.nextQuery = this.interval > 0 ? Date.now() + this.interval : -1;
	}

	query(store, query, now = Date.now()) {
		const xform = transform.createFrom(query, now - this.interval);
		const result = store.entries.reduceRight(xform, { values: {} });
		result.ts = now;
		// TODO: how to handle empty values in result, ie. result = { values: {} }??
		this.push(result, this.entries);
	}
	queryOnInterval(store, query, now = Date.now()) {
		if (this.nextQuery > 0 && now >= this.nextQuery) {
			this.query(store, query, now);
			this.nextQuery = now + this.interval;
		}
	}

	write(timestore, cell, range) {
		let entries = this.entries;
		if (this.interval < 0) {
			entries = timestore.limit > this.limit ? limitEntries(timestore.entries, this.limit) : timestore.entries;
		} 
		const values = entries.reduce(entriesReduce, { time: [] });
		if (range) spreadValuesToRange(values, range);
		cell.info.values = values;
	}
}

const getQueryStore = (term, options) => {
	if (!term._options || !term._querystore || !areEqualOptions(options, term._options)) {
		term._querystore = QueryStore.of(options);
	}
	// store current options which contains possible changed queries, required by tests...
	term._options = options;
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
			return options.error || options;
		})
		.run((storeterm, options) => {
			const term = timeQuery.term;
			const timestore = storeterm._timestore;
			const querystore = getQueryStore(term, options);
			stateListener.registerCallback(sheet, term, querystore.reset);
			querystore.queryOnInterval(timestore, options.query);
			querystore.write(timestore, term.cell, options.range);
			const size = querystore.entries.length;
			// eslint-disable-next-line no-nested-ternary
			return size === 0 ? ERROR.NA : size < querystore.limit ? true : ERROR.LIMIT;
		});


module.exports = timeQuery;