const { convert } = require('@cedalo/commons');
const { /* Functions, */ Term } = require('@cedalo/parser');
const { FunctionErrors } = require('@cedalo/error-codes');
const { Cell, /* State, */ isType } = require('@cedalo/machine-core');
const mapQueryOptions = require('./mapQueryOptions');
const {
	calculate,
	runFunction,
	// sheet: sheetutils,
	terms: { getCellRangeFromTerm, hasValue }
} = require('../../../utils');

const ERROR = FunctionErrors.code;
const EMPTY_ARRAY = Object.freeze([]);
const DEF_METHOD = 9;
const DEF_LIMIT = 500;
const MIN_INTERVAL = 1 / 1000; // 1ms

const countNonZero = (acc, entry) => entry.value ? acc + 1 : acc;
const countNumber = (acc, entry) => isType.number(entry.value) ? acc + 1 : acc;
		
const aggregations = {
	// '0': (entries) => toValue(entries[en	tries.length - 1]),
	'0': (values) => values,
	'1': (values) => calculate.avg(values),
	// doesn't make sense because no number values are ignored anyway!
	'2': (values) => values.reduce(countNumber, 0),
	'3': (values) => values.reduce(countNonZero, 0),
	'4': (values) => calculate.max(values),
	'5': (values) => calculate.min(values),
	'6': (values) => calculate.product(values),
	'7': (values) => calculate.standardDerivation(values),
	'9': (values) => calculate.sum(values)
};

// const getTimeStamp = (entry) => entry.timestamp;
// const getEntryValue = (key) => (entry) => entry.values[key];
// const addTimeStamp = (all, entry) => 

const keyValueReduceFilter = (key) => (filtered, entry) => {
	const value = entry.values[key];
	if (value != null) filtered.push(value);
	return filtered;
};
// const keyEntryReduceFilter = (key) => (filtered, entry) => {
// 	if (entry.values.hasOwnProperty(key)) filtered.push({ timestamp: entry.timestamp, value: entry.values[key] });
// 	return filtered;
// };
const getAggregateFunction = (key, method) => {
	const filter = keyValueReduceFilter(key);
	const aggregation = aggregations[method];
	return (entries) => aggregation(entries.reduce(filter, []));
};

const timeFilter = period => (entries, now) => {
	const limit = now - period;
	const filtered = [];
	for (let i = entries.length - 1; i >= 0; i -= 1) {
		const entry = entries[i];
		if (entry.timestamp < limit) break;
		else filtered.push(entry);
	}
	return filtered.reverse();
};
const limitedInsert = limit => (value, entries) => {
	if (entries.push(value) > limit) {
		entries.shift();
		return ERROR.LIMIT;
	}
	return true;
};
const boundedInsert = (size) => (value, entries) => {
	if (entries.push(value) > size) {
		entries.shift();
		return false;
	}
	return true;
};
const iterateByInterval = (entries, interval, cb) => {
	let goOn = true;
	let nextCall = -1;
	const intervalEntries = [];
	for (let i = entries.length - 1; goOn && i >= 0; i -= 1) {
		const entry = entries[i];
		if (nextCall < 0 || entry.timestamp >= nextCall) {
			goOn = intervalEntries.length ? !cb(intervalEntries) : true;
			intervalEntries.length = 0;
			nextCall = entry.timestamp + interval;
		}
		intervalEntries.push(entry);
	}
	if (intervalEntries.length) cb(intervalEntries);
};

class IntervalStore {
	// static of(timestore, settings) {
	// 	// size is minimum of period/interval or limit...
	// 	const { interval, limit } = settings;
	// 	const size = Math.min(limit, interval > 0 ? Math.round(timestore.period / interval) : 1);
		
	// 	return new (timestore.id, settings);
	// }
	constructor(id, settings) {
		this.id = id;
		this.entries = [];
		this.settings = settings;
		this._interval = settings.interval * 1000;
		this.insert = limitedInsert(settings.limit);
		this.intervalFilter = timeFilter(this._interval);
		this.nextAggregation = Date.now() + (this._interval);
		// this.keyEntryReduceFilter = keyEntryReduceFilter(settings.key);
		this.doAggregate = getAggregateFunction(settings.key, settings.method);
	}

	get interval() {
		return this.settings.interval;
	}
	get limit() {
		return this.settings.limit;
	}
	get method() {
		return this.settings.method;
	}
	hasSettings({ key, method, interval, limit }) {
		return (
			this.settings.key === key &&
			this.settings.method === method &&
			this.settings.interval === interval &&
			this.settings.limit === limit
		);
	}
	aggregate(store) {
		const now = Date.now();
		const interval = this._interval;
		const aggregatedStoreValue = this.doAggregate(store.entries);
		if (interval > 0 && now >= this.nextAggregation) {
			const aggregated = this.doAggregate(this.intervalFilter(store.entries, now));
			if (aggregated != null) {
				this.insert({ timestamp: now, key: this.settings.key, value: aggregated }, this.entries);
			}
			this.nextAggregation = now + interval;
		}
		return aggregatedStoreValue;
	}
	aggregate2(store) {
		const interval = this._interval;
		const aggregatedEntries = [];
		const aggregatedStoreValue = this.doAggregate(store.entries);
		iterateByInterval(store.entries, interval, (entries) => {
			const aggregated = this.doAggregate(entries);
			const timestamp = entries[0].timestamp;
			return this.insert({ timestamp, key: this.settings.key, value: aggregated }, aggregatedEntries);
		});
		this.entries = aggregatedEntries.reverse();
		return aggregatedStoreValue;
	}
	write(store, cell, range) {
		let values;
		if (this.interval > 0) {
			values = this.entries.map(({ timestamp, value }) => ({ timestamp, value }));
		} else {
			// DL-2306 always return entries with cell
			const { key } = this.settings;
			const { entries } = store;
			// limit store values!!
			const first = Math.max(0, entries.length - this.limit);
			values =[];
			for (let i = first; i < entries.length; i += 1) {
				const entry = entries[i];
				values.push({ timestamp: entry.timestamp, value: entry.values[key] })
			}
		}
		if (range) {
			const sheet = range.sheet;
			const startrow = range.start.row;
			range.iterate((_cell, index, nextrow) => {
				const entry = values[index.row - startrow];
				// eslint-disable-next-line no-nested-ternary
				const value = entry ? (nextrow ? entry.timestamp : entry.value) : undefined;
				const newCell = value != null ? new Cell(value, Term.fromValue(value)) : undefined;
				sheet.setCellAt(index, newCell);
			});
		}
		// DL-2306 always return entries with cell
		cell.info = { values };
		// const entries = this.interval > 0 ? this.entries : store.entries;
		// if (range) {
		// 	const sheet = range.sheet;
		// 	const startrow = range.start.row;
		// 	range.iterate((_cell, index, nextrow) => {
		// 		const entry = entries[index.row - startrow];
		// 		// eslint-disable-next-line no-nested-ternary
		// 		const value = entry ? (nextrow ? entry.key : entry.value) : undefined;
		// 		const newCell = value != null ? new Cell(value, Term.fromValue(value)) : undefined;
		// 		sheet.setCellAt(index, newCell);
		// 	});
		// }
		// DL-2306 always return entries with cell
		// cell.info = { values: entries.map(({ timestamp, value }) => ({ timestamp, value })) };
	}
}
const getIntervalStore = (term, timestore, settings) => {
	if (!term._intervalstore || timestore.id !== term._intervalstore.id || !term._intervalstore.hasSettings(settings)) {
		term._intervalstore = new IntervalStore(timestore.id, settings);
	}
	return term._intervalstore;
};

const getInterval = (value) => {
	const interval = convert.toNumberStrict(value, 0);
	return interval < MIN_INTERVAL ? ERROR.VALUE : interval;
};
const getMethodNumber = (value) => {
	const nr = convert.toNumberStrict(value);
	return aggregations[nr] ? nr : ERROR.VALUE;
};

const isQuery = (val) => {
	return val != null && typeof val === 'object' && val.field != null
};

const storeFromTerm = (term) => term && term.name === 'time.store' ? term : undefined;
const getTermFromRef = (cellref) => cellref.operand.target ? cellref.operand.target.term : undefined;
const getStoreTerm = (term) => {
	const store = storeFromTerm(term) || storeFromTerm(getTermFromRef(term));
	return store;
};


const timeQuery = (sheet, ...terms) =>
	runFunction(sheet, terms)
		// .onSheetCalculation()
		.withMinArgs(2)
		.mapNextArg((storeref) => getStoreTerm(storeref) || ERROR.VALUE)
		// .mapNextArg((jsonterm) => isQuery(jsonterm.value) ? jsonterm.value : ERROR.VALUE)
		// .mapNextArg(method => hasValue(method) ? getMethodNumber(method.value) : DEF_METHOD)
		// .mapNextArg(interval => hasValue(interval) ? getInterval(interval.value) : -1)
		// .mapNextArg(targetrange => getCellRangeFromTerm(targetrange, sheet))
		// .mapNextArg(limit => hasValue(limit) ? convert.toNumberStrict(limit.value, ERROR.VALUE) : DEF_LIMIT)
		.mapRemaingingArgs((remain) => {
			const options = mapQueryOptions(sheet, remain);
			// const queries = [];
			// let limit = DEF_LIMIT;
			// let interval = -1;
			// let targetrange;
			// let state = 'query';
			// remain.forEach((term, index) => {
			// 	const val = term.value;
			// 	if (state === 'query' && isQuery(val)) queries.push(val);
			// 	else {
			// 		state = state === 'query' ? 'interval' : state === 'interval' ? 'range' : 
			// 		interval = val != null ? getInterval(val) : -1;
			// 	}
			// });
			return options.error || options.queries.length < 1  ? ERROR.VALUE : options;
		})
		.run((storeterm, options) => {
			const term = timeQuery.term;
			term.queries = options.queries;
			term.interval = options.interval;
			term.range = options.range;
			term.limit = options.limit;
			return true;
			// const term = timeInterval.term;
			// const timestore = storeterm._timestore;
			// const intervalstore = getIntervalStore(term, timestore, { key, method, interval, limit });
			// const res = intervalstore.aggregate(timestore);
			// intervalstore.write(timestore, term.cell, targetrange);
			// return res;
		});


module.exports = timeQuery;
