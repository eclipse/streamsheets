const { convert } = require('@cedalo/commons');
const { FunctionErrors } = require('@cedalo/error-codes');
const { Cell } = require('@cedalo/machine-core');
const { Term } = require('@cedalo/parser');

const { runFunction, terms: { getCellRangeFromTerm } } = require('../../../utils');
// const readQueryOptions = require('./readQueryOptions');
const stateListener = require('./stateListener');
const transform = require('./transform');


const ERROR = FunctionErrors.code;
const DEF_LIMIT = 100;
const MIN_INTERVAL = 1 / 1000; // 1ms


const split = (str) => `${str}`.split(',').map((part) => part.trim());
const createQuery = (json) => {
	let query;
	if (json != null && typeof json === 'object' && json.select) {
		let aggregate = json.aggregate;
		const { select, where } = json;
		aggregate = aggregate != null ? split(aggregate) : [];
		query = { select: split(select), aggregate, where };
	}
	return query;
};

const boundedPush = (size) => (value, entries) => {
	entries.push(value);
	if (entries.length > size) entries.shift();
	return entries;
};

const areEqualQueries = (q1, q2) => q1.select === q2.select && q1.aggregate === q2.aggregate && q1.where === q2.where;


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
	static of(query, interval, limit) {
		const store = new QueryStore(interval, limit);
		store.queryobj = query;
		store.xform = transform.createFrom(query, store.msInterval);
		return store;
	}
	constructor(interval, limit) {
		this.limit = limit;
		this.interval = interval;
		this.msInterval = interval * 1000;
		this.nextQuery = interval > 0 ? Date.now() + this.msInterval : -1;
		this.entries = [];
		this.push = boundedPush(limit);
		this.reset = this.reset.bind(this);
		this.lastTry = 0;
	}

	reset() {
		this.entries = [];
		this.nextQuery = this.msInterval > 0 ? Date.now() + this.msInterval : -1;
	}

	hasEqual(queryobj, interval, limit) {
		return this.interval === interval && this.limit === limit && areEqualQueries(this.queryobj, queryobj);
	}

	query(store, now = Date.now()) {
		// const xform = transform.createFrom(this.query, now - this.msInterval);
		const result = store.entries.reduceRight(this.xform, { ts: now, values: {} });
		// TODO: how to handle empty values in result, ie. result = { values: {} }??
		this.push(result, this.entries);
	}
	queryOnInterval(store, now = Date.now()) {
		if (this.nextQuery > 0 && now >= this.nextQuery) {
			this.query(store, now);
			this.nextQuery = now + this.msInterval;
		}
		this.lastTry = now;
	}

	write(timestore, cell, range) {
		let entries = this.entries;
		if (this.msInterval < 0) {
			entries = timestore.limit > this.limit ? limitEntries(timestore.entries, this.limit) : timestore.entries;
		} 
		const values = entries.reduce(entriesReduce, { time: [] });
		if (range) spreadValuesToRange(values, range);
		cell.info.values = values;
	}
}

const getQueryStore = (term, query, interval, limit) => {
	if (!term._querystore || !term._querystore.hasEqual(query, interval, limit)) {
		term._querystore = QueryStore.of(query, interval, limit);
	}
	// store current options which contains possible changed queries, required by tests...
	// term._options = options;
	return term._querystore;
};

const getRange = (term, sheet) =>
	term && term.value != null ? getCellRangeFromTerm(term, sheet) || ERROR.VALUE : undefined;
const getNumber = (value, defVal) => value != null ? convert.toNumberStrict(value) : defVal;
const getLimit = (nr) => {
	nr = getNumber(nr, DEF_LIMIT);
	return nr != null ? Math.max(1, nr) : ERROR.VALUE;
}; 
const getInterval = (nr) => {
	nr = getNumber(nr, -1);
	return nr != null && (nr >= MIN_INTERVAL || nr === -1) ? nr : ERROR.VALUE;
};
const storeFromTerm = (term) => term && term.name === 'time.store' ? term : undefined;
const getTermFromRef = (cellref) => cellref.operand.target ? cellref.operand.target.term : undefined;
const getStoreTerm = (term) => storeFromTerm(term) || storeFromTerm(getTermFromRef(term));


const timeQuery = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.onSheetCalculation()
		.withMinArgs(2)
		.withMaxArgs(5)
		.mapNextArg((storeref) => getStoreTerm(storeref) || ERROR.VALUE)
		.mapNextArg((query) => createQuery(query.value) || ERROR.VALUE)
		.mapNextArg((interval) => interval != null ? getInterval(interval.value) : -1)
		.mapNextArg((range) => getRange(range))
		.mapNextArg((limit) => limit != null ? getLimit(limit.value) : DEF_LIMIT)
		.run((storeterm, query, interval, range, limit) => {
			const term = timeQuery.term;
			const timestore = storeterm._timestore;
			const querystore = getQueryStore(term, query, interval, limit);
			stateListener.registerCallback(sheet, term, querystore.reset);
			querystore.queryOnInterval(timestore);
			querystore.write(timestore, term.cell, range);
			const size = querystore.entries.length;
			// eslint-disable-next-line no-nested-ternary
			return size === 0 ? ERROR.NA : size < querystore.limit ? true : ERROR.LIMIT;
		});


module.exports = timeQuery;